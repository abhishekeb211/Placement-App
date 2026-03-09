'use client';

import { useEffect } from 'react';

/**
 * ReminderProcessor silently checks for due reminders on mount and
 * converts them into notifications so the notification feed stays current.
 */
export function ReminderProcessor() {
  useEffect(() => {
    fetch('/api/reminders/check').catch(() => {
      // Non-critical — ignore errors silently
    });
  }, []);

  return null;
}
