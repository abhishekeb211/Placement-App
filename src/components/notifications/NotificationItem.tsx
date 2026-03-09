'use client';

import { Bell, Briefcase, Info } from 'lucide-react';
import Link from 'next/link';
import type { NotificationType } from '@/types';

export interface NotificationDisplay {
  id: string;
  userId: string;
  opportunityId?: string | null;
  title: string;
  body: string;
  type: NotificationType | string;
  isRead: boolean;
  createdAt: Date | string;
  opportunity?: { id: string; title: string; company: string } | null;
}

interface NotificationItemProps {
  notification: NotificationDisplay;
  onRead?: (id: string) => void;
}

const typeIcons = {
  OPPORTUNITY: Briefcase,
  REMINDER: Bell,
  SYSTEM: Info,
};

const typeColors = {
  OPPORTUNITY: 'text-blue-400',
  REMINDER: 'text-amber-400',
  SYSTEM: 'text-slate-400',
};

export function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Info;
  const iconColor = typeColors[notification.type as keyof typeof typeColors] || 'text-slate-400';

  const handleClick = () => {
    if (!notification.isRead) onRead?.(notification.id);
  };

  const content = (
    <div
      className={`flex gap-3 p-4 rounded-lg border transition-colors cursor-pointer ${
        notification.isRead
          ? 'bg-slate-800/50 border-slate-700/50'
          : 'bg-slate-800 border-slate-600 hover:border-slate-500'
      }`}
      onClick={handleClick}
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium ${notification.isRead ? 'text-slate-400' : 'text-white'}`}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1" />
          )}
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{notification.body}</p>
        <p className="text-xs text-slate-600 mt-1">
          {new Date(notification.createdAt).toLocaleString()}
        </p>
      </div>
    </div>
  );

  if (notification.opportunityId) {
    return (
      <Link href={`/opportunities/${notification.opportunityId}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
