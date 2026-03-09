import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        userId: session.user.id,
        status: 'PENDING',
      },
      include: {
        opportunity: {
          select: { id: true, title: true, company: true, deadline: true },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });

    return NextResponse.json({ reminders });
  } catch (error) {
    console.error('[REMINDERS_GET]', error);
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
    const { opportunityId, scheduledAt, type } = body;

    if (!opportunityId || !scheduledAt) {
      return NextResponse.json({ error: 'opportunityId and scheduledAt are required' }, { status: 400 });
    }

    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, userId: session.user.id },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        opportunityId,
        scheduledAt: new Date(scheduledAt),
        type: type || 'IMMEDIATE',
        status: 'PENDING',
      },
    });

    return NextResponse.json({ reminder }, { status: 201 });
  } catch (error) {
    console.error('[REMINDERS_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/reminders
 * Cancel all pending reminders for a given opportunity.
 * Body: { opportunityId: string }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { opportunityId } = body;

    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    // Verify the opportunity belongs to this user
    const opportunity = await prisma.opportunity.findFirst({
      where: { id: opportunityId, userId: session.user.id },
    });

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const { count } = await prisma.reminder.updateMany({
      where: { opportunityId, userId: session.user.id, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({ cancelled: count });
  } catch (error) {
    console.error('[REMINDERS_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
