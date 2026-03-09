import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const opportunitySelect = {
  id: true,
  title: true,
  company: true,
  role: true,
  location: true,
  deadline: true,
  status: true,
};

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applications = await prisma.application.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      include: { opportunity: { select: opportunitySelect } },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error('[APPLICATIONS_GET]', error);
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
    const { opportunityId, notes, appliedAt } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, userId: session.user.id },
    });
    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const existing = await prisma.application.findFirst({
      where: { userId: session.user.id, opportunityId },
    });
    if (existing) {
      return NextResponse.json({ error: 'Application already tracked' }, { status: 409 });
    }

    const application = await prisma.application.create({
      data: {
        userId: session.user.id,
        opportunityId,
        notes: notes ?? null,
        appliedAt: appliedAt ? new Date(appliedAt) : null,
        status: 'PENDING',
      },
      include: { opportunity: { select: opportunitySelect } },
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error('[APPLICATIONS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
