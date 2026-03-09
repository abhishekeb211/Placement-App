import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/reminders/check
 * Processes pending reminders that are due and converts them into notifications.
 * Call this on page load to keep the notification feed up-to-date.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    // Find all pending reminders that are now due
    const dueReminders = await prisma.reminder.findMany({
      where: {
        userId: session.user.id,
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      include: {
        opportunity: { select: { id: true, title: true, company: true } },
      },
    });

    if (dueReminders.length === 0) {
      return NextResponse.json({ processed: 0 });
    }

    // Create notifications for each due reminder
    const REMINDER_TITLES: Record<string, string> = {
      IMMEDIATE: 'New Opportunity Reminder',
      DAILY: 'Daily Application Reminder',
      SIX_HOUR: '6-Hour Warning',
      HOURLY: 'Hourly Reminder',
      THIRTY_MIN: 'Final 30-Minute Alert',
    };

    await prisma.notification.createMany({
      data: dueReminders.map((r) => ({
        userId: session.user.id,
        opportunityId: r.opportunityId,
        title: REMINDER_TITLES[r.type] ?? 'Application Reminder',
        body: r.opportunity
          ? `Don't forget: ${r.opportunity.title} at ${r.opportunity.company}`
          : 'You have a pending application reminder.',
        type: 'REMINDER',
      })),
    });

    // Mark reminders as SENT
    await prisma.reminder.updateMany({
      where: { id: { in: dueReminders.map((r) => r.id) } },
      data: { status: 'SENT', sentAt: now },
    });

    return NextResponse.json({ processed: dueReminders.length });
  } catch (error) {
    console.error('[REMINDERS_CHECK]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
