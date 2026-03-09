import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const opportunity = await prisma.opportunity.findFirst({
      where: { id, userId: session.user.id },
      include: {
        reminders: { orderBy: { scheduledAt: 'asc' } },
        applications: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    return NextResponse.json({
      opportunity: {
        ...opportunity,
        skills: parseSkills(opportunity.skills),
        extractedLinks: parseLinks(opportunity.extractedLinks),
      },
    });
  } catch (error) {
    console.error('[OPPORTUNITY_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, notes, fitScore, atsScore, skills, deadline, salaryRange, location } = body;

    const existing = await prisma.opportunity.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;
    if (fitScore !== undefined) updateData.fitScore = fitScore;
    if (atsScore !== undefined) updateData.atsScore = atsScore;
    if (skills !== undefined) updateData.skills = JSON.stringify(skills);
    if (deadline !== undefined) updateData.deadline = deadline ? new Date(deadline) : null;
    if (salaryRange !== undefined) updateData.salaryRange = salaryRange;
    if (location !== undefined) updateData.location = location;

    const updated = await prisma.opportunity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      opportunity: {
        ...updated,
        skills: parseSkills(updated.skills),
        extractedLinks: parseLinks(updated.extractedLinks),
      },
    });
  } catch (error) {
    console.error('[OPPORTUNITY_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await prisma.opportunity.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    await prisma.opportunity.delete({ where: { id } });

    return NextResponse.json({ message: 'Opportunity deleted successfully' });
  } catch (error) {
    console.error('[OPPORTUNITY_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
