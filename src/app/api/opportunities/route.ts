import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateReminders } from '@/lib/reminderEngine';
import type { Opportunity, OpportunityStatus } from '@/types';

function parseSkills(skillsStr: string): string[] {
  try {
    return JSON.parse(skillsStr);
  } catch {
    return [];
  }
}

function parseLinks(linksStr: string): string[] {
  try {
    return JSON.parse(linksStr);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const whereClause: Record<string, unknown> = { userId: session.user.id };
    if (status) whereClause.status = status;
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { company: { contains: search } },
        { role: { contains: search } },
      ];
    }

    const opportunities = await prisma.opportunity.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const parsed = opportunities.map((opp) => ({
      ...opp,
      skills: parseSkills(opp.skills),
      extractedLinks: parseLinks(opp.extractedLinks),
    }));

    return NextResponse.json({ opportunities: parsed });
  } catch (error) {
    console.error('[OPPORTUNITIES_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, company, role, location, deadline, salaryRange, sourceEmail, extractedLinks, requirements, skills } = body;

    if (!title || !company) {
      return NextResponse.json({ error: 'Title and company are required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.create({
      data: {
        userId: session.user.id,
        title,
        company,
        role: role || null,
        location: location || null,
        deadline: deadline ? new Date(deadline) : null,
        salaryRange: salaryRange || null,
        sourceEmail: sourceEmail || null,
        extractedLinks: JSON.stringify(extractedLinks || []),
        requirements: requirements || null,
        skills: JSON.stringify(skills || []),
        status: 'NEW',
      },
    });

    // Auto-schedule reminders using the reminder engine
    const parsedOpp: Opportunity = {
      ...opportunity,
      role: opportunity.role ?? undefined,
      location: opportunity.location ?? undefined,
      deadline: opportunity.deadline ?? undefined,
      salaryRange: opportunity.salaryRange ?? undefined,
      sourceEmail: opportunity.sourceEmail ?? undefined,
      requirements: opportunity.requirements ?? undefined,
      notes: opportunity.notes ?? undefined,
      status: opportunity.status as OpportunityStatus,
      skills: parseSkills(opportunity.skills),
      extractedLinks: parseLinks(opportunity.extractedLinks),
    };

    const reminders = generateReminders(parsedOpp);
    if (reminders.length > 0) {
      await prisma.reminder.createMany({
        data: reminders.map((r) => ({
          userId: session.user.id,
          opportunityId: opportunity.id,
          scheduledAt: r.scheduledAt,
          type: r.type,
          status: 'PENDING',
        })),
      });
    }

    // Create an initial "new opportunity" notification
    await prisma.notification.create({
      data: {
        userId: session.user.id,
        opportunityId: opportunity.id,
        title: 'New Opportunity Detected',
        body: `${title} at ${company} has been added to your tracker.`,
        type: 'OPPORTUNITY',
      },
    });

    return NextResponse.json({
      opportunity: {
        ...opportunity,
        skills: parseSkills(opportunity.skills),
        extractedLinks: parseLinks(opportunity.extractedLinks),
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[OPPORTUNITIES_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
