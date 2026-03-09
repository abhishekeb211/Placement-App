import React from 'react';
import type { OpportunityStatus } from '@/types';

interface BadgeProps {
  status: OpportunityStatus | string;
  className?: string;
}

const statusConfig: Record<string, { label: string; classes: string }> = {
  NEW: { label: 'New', classes: 'bg-blue-900/50 text-blue-300 border-blue-700' },
  OPENED: { label: 'Opened', classes: 'bg-slate-700 text-slate-300 border-slate-600' },
  IN_PROGRESS: { label: 'In Progress', classes: 'bg-yellow-900/50 text-yellow-300 border-yellow-700' },
  APPLIED: { label: 'Applied', classes: 'bg-green-900/50 text-green-300 border-green-700' },
  MISSED: { label: 'Missed', classes: 'bg-red-900/50 text-red-400 border-red-700' },
  SHORTLISTED: { label: 'Shortlisted', classes: 'bg-purple-900/50 text-purple-300 border-purple-700' },
  TEST_RECEIVED: { label: 'Test Received', classes: 'bg-orange-900/50 text-orange-300 border-orange-700' },
  INTERVIEW_SCHEDULED: { label: 'Interview', classes: 'bg-indigo-900/50 text-indigo-300 border-indigo-700' },
  REJECTED: { label: 'Rejected', classes: 'bg-red-900/60 text-red-400 border-red-700' },
  SELECTED: { label: '🎉 Selected', classes: 'bg-emerald-900/50 text-emerald-300 border-emerald-700' },
};

export function Badge({ status, className = '' }: BadgeProps) {
  const config = statusConfig[status] || { label: status, classes: 'bg-slate-700 text-slate-300 border-slate-600' };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${config.classes} ${className}`}
    >
      {config.label}
    </span>
  );
}
