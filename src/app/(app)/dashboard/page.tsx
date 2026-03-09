import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Briefcase, Bell, Clock, TrendingUp, ClipboardList, CheckCircle } from 'lucide-react';
import type { Opportunity, Notification, OpportunityStatus } from '@/types';
import type { NotificationDisplay } from '@/components/notifications/NotificationItem';

function parseOpp(opp: {
  id: string; userId: string; title: string; company: string;
  role: string | null; location: string | null; deadline: Date | null;
  salaryRange: string | null; sourceEmail: string | null;
  extractedLinks: string; requirements: string | null; skills: string;
  status: string; fitScore: number | null; atsScore: number | null;
  notes: string | null; createdAt: Date; updatedAt: Date;
}): Opportunity {
  return {
    ...opp,
    role: opp.role ?? undefined,
    location: opp.location ?? undefined,
    deadline: opp.deadline ?? undefined,
    salaryRange: opp.salaryRange ?? undefined,
    sourceEmail: opp.sourceEmail ?? undefined,
    requirements: opp.requirements ?? undefined,
    notes: opp.notes ?? undefined,
    status: opp.status as OpportunityStatus,
    skills: JSON.parse(opp.skills || '[]'),
    extractedLinks: JSON.parse(opp.extractedLinks || '[]'),
  };
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const userId = session.user.id;

  const [opportunities, pendingReminders, notifications] = await Promise.all([
    prisma.opportunity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    prisma.reminder.count({ where: { userId, status: 'PENDING' } }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { opportunity: { select: { id: true, title: true, company: true } } },
    }),
  ]);

  const totalOpps = await prisma.opportunity.count({ where: { userId } });
  const appliedCount = await prisma.opportunity.count({
    where: { userId, status: 'APPLIED' },
  });

  const [interviewCount, selectedCount, recentApplications] = await Promise.all([
    prisma.application.count({ where: { userId, status: 'INTERVIEW_SCHEDULED' } }),
    prisma.application.count({ where: { userId, status: 'SELECTED' } }),
    prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        opportunity: { select: { id: true, title: true, company: true, role: true } },
      },
    }),
  ]);

  // Compute avg fit score from ALL scored opportunities, not just the recent 5
  const scoredOpps = await prisma.opportunity.findMany({
    where: { userId, fitScore: { not: null } },
    select: { fitScore: true },
  });
  const avgFitScore =
    scoredOpps.length > 0
      ? Math.round(scoredOpps.reduce((sum, o) => sum + (o.fitScore ?? 0), 0) / scoredOpps.length)
      : null;

  const stats = [
    { label: 'Total Opportunities', value: totalOpps, icon: Briefcase, color: 'text-blue-400' },
    { label: 'Applied', value: appliedCount, icon: TrendingUp, color: 'text-emerald-400' },
    { label: 'Pending Reminders', value: pendingReminders, icon: Clock, color: 'text-amber-400' },
    { label: 'Avg Fit Score', value: avgFitScore != null ? `${avgFitScore}%` : 'N/A', icon: Bell, color: 'text-purple-400' },
    { label: 'Interviews', value: interviewCount, icon: ClipboardList, color: 'text-indigo-400' },
    { label: 'Selected', value: selectedCount, icon: CheckCircle, color: 'text-green-400' },
  ];

  const parsedOpportunities = opportunities.map(parseOpp);

  type DashNotification = NotificationDisplay;
  const parsedNotifications: DashNotification[] = notifications.map((n) => ({
    ...n,
    opportunityId: n.opportunityId ?? undefined,
    type: n.type as Notification['type'],
    opportunity: n.opportunity ?? undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          Welcome back, {session.user.name?.split(' ')[0] || 'Student'}! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here&apos;s your placement summary</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <div className="flex items-center gap-3">
              <div className={`${color}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Opportunities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Recent Opportunities</h2>
          <a href="/opportunities" className="text-xs text-blue-400 hover:text-blue-300">
            View all
          </a>
        </div>
        {parsedOpportunities.length === 0 ? (
          <Card className="text-center py-8">
            <Briefcase size={32} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No opportunities yet</p>
            <p className="text-slate-600 text-xs mt-1">Opportunities detected from email will appear here</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {parsedOpportunities.map((opp) => (
              <OpportunityCard key={opp.id} opportunity={opp} />
            ))}
          </div>
        )}
      </div>

      {/* Recent Notifications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white">Recent Notifications</h2>
          <a href="/notifications" className="text-xs text-blue-400 hover:text-blue-300">
            View all
          </a>
        </div>
        {parsedNotifications.length === 0 ? (
          <Card className="text-center py-6">
            <Bell size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No notifications yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {parsedNotifications.map((n) => (
              <NotificationItem key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>

      {/* My Applications Summary */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <ClipboardList size={16} className="text-blue-400" />
            My Applications
          </h2>
          <a href="/applications" className="text-xs text-blue-400 hover:text-blue-300">
            View all
          </a>
        </div>
        {recentApplications.length === 0 ? (
          <Card className="text-center py-6">
            <ClipboardList size={28} className="text-slate-600 mx-auto mb-2" />
            <p className="text-slate-400 text-sm">No applications tracked yet</p>
            <p className="text-slate-500 text-xs mt-1">Open any opportunity and click &quot;Start Tracking&quot;</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentApplications.map((app) => (
              <a key={app.id} href={`/opportunities/${app.opportunityId}`}>
                <Card padding="sm" className="flex items-center justify-between gap-3 hover:bg-slate-700/50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{app.opportunity.company}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {app.opportunity.role ?? app.opportunity.title}
                    </p>
                  </div>
                  <Badge status={app.status} />
                </Card>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
