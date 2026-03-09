import type { Opportunity } from '@/types';

export interface ReminderSchedule {
  type: 'IMMEDIATE' | 'DAILY' | 'SIX_HOUR' | 'HOURLY' | 'THIRTY_MIN';
  scheduledAt: Date;
  label: string;
}

export function generateReminders(opportunity: Opportunity): ReminderSchedule[] {
  const reminders: ReminderSchedule[] = [];
  const now = new Date();

  // 1. Immediate reminder
  reminders.push({
    type: 'IMMEDIATE',
    scheduledAt: new Date(now.getTime() + 5 * 60 * 1000), // 5 minutes from now
    label: 'New opportunity detected!',
  });

  if (!opportunity.deadline) {
    // No deadline — schedule daily reminders for the next 7 days
    for (let i = 1; i <= 7; i++) {
      const scheduledAt = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      scheduledAt.setHours(9, 0, 0, 0); // 9 AM
      reminders.push({
        type: 'DAILY',
        scheduledAt,
        label: `Daily reminder: Don't forget to apply to ${opportunity.title}`,
      });
    }
    return reminders;
  }

  const deadline = new Date(opportunity.deadline);
  const msUntilDeadline = deadline.getTime() - now.getTime();

  if (msUntilDeadline <= 0) return reminders; // Deadline passed

  // 2. Daily reminders (until 1 day before deadline)
  const daysUntilDeadline = Math.floor(msUntilDeadline / (24 * 60 * 60 * 1000));

  for (let i = 1; i < daysUntilDeadline; i++) {
    const scheduledAt = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    scheduledAt.setHours(9, 0, 0, 0);
    reminders.push({
      type: 'DAILY',
      scheduledAt,
      label: `${daysUntilDeadline - i} day(s) left to apply for ${opportunity.title}`,
    });
  }

  // 3. Six-hour reminder (when 6 hours remain)
  const sixHourMark = new Date(deadline.getTime() - 6 * 60 * 60 * 1000);
  if (sixHourMark > now) {
    reminders.push({
      type: 'SIX_HOUR',
      scheduledAt: sixHourMark,
      label: `⚠️ Only 6 hours left to apply for ${opportunity.title}!`,
    });
  }

  // 4. Hourly reminders in final 6 hours
  for (let h = 5; h >= 1; h--) {
    const scheduledAt = new Date(deadline.getTime() - h * 60 * 60 * 1000);
    if (scheduledAt > now) {
      reminders.push({
        type: 'HOURLY',
        scheduledAt,
        label: `🚨 ${h} hour(s) left! Apply now for ${opportunity.title}`,
      });
    }
  }

  // 5. Final 30-minute urgent reminder
  const thirtyMinMark = new Date(deadline.getTime() - 30 * 60 * 1000);
  if (thirtyMinMark > now) {
    reminders.push({
      type: 'THIRTY_MIN',
      scheduledAt: thirtyMinMark,
      label: `🚨🚨 FINAL ALERT: 30 minutes left to apply for ${opportunity.title}!`,
    });
  }

  return reminders.sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
}

export function cancelReminders(opportunityId: string): string {
  // In production this would update DB — returns message for API response
  return `Reminders cancelled for opportunity ${opportunityId}`;
}
