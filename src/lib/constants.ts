import type { OpportunityStatus } from '@/types';

/**
 * Statuses that mark an opportunity as no longer actively pursued.
 * Pending reminders are automatically cancelled when an opportunity reaches one of these states.
 */
export const TERMINAL_STATUSES: OpportunityStatus[] = [
  'APPLIED',
  'REJECTED',
  'SELECTED',
  'MISSED',
];
