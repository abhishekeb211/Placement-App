'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck } from 'lucide-react';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import type { NotificationDisplay } from '@/components/notifications/NotificationItem';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications');
    const data = await res.json();
    setNotifications(data.notifications || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setMarking(false);
  };

  const markOneRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-slate-400 text-sm">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} loading={marking}>
            <CheckCheck size={16} /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <Card className="text-center py-12">
          <Bell size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No notifications yet</p>
          <p className="text-slate-500 text-sm mt-1">
            Notifications about opportunities and reminders will appear here
          </p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onRead={markOneRead} />
          ))}
        </div>
      )}
    </div>
  );
}
