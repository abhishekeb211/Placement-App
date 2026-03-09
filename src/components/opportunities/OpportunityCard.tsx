import Link from 'next/link';
import { MapPin, Calendar, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { Opportunity } from '@/types';

interface OpportunityCardProps {
  opportunity: Opportunity;
}

export function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const deadline = opportunity.deadline ? new Date(opportunity.deadline) : null;
  const isDeadlineSoon =
    deadline && deadline.getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000;

  return (
    <Link href={`/opportunities/${opportunity.id}`}>
      <Card className="hover:border-slate-600 transition-colors cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="text-sm font-semibold text-white truncate">{opportunity.title}</h3>
              <Badge status={opportunity.status} />
            </div>
            <p className="text-slate-400 text-xs mb-2">{opportunity.company}</p>

            <div className="flex flex-wrap gap-3 text-xs text-slate-500">
              {opportunity.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  {opportunity.location}
                </span>
              )}
              {deadline && (
                <span className={`flex items-center gap-1 ${isDeadlineSoon ? 'text-red-400' : ''}`}>
                  <Calendar size={11} />
                  {isDeadlineSoon ? '⚠️ ' : ''}
                  {deadline.toLocaleDateString()}
                </span>
              )}
              {opportunity.salaryRange && (
                <span className="text-green-400">💰 {opportunity.salaryRange}</span>
              )}
            </div>

            {(opportunity.skills || []).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {opportunity.skills.slice(0, 4).map((skill) => (
                  <span
                    key={skill}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-300 rounded"
                  >
                    {skill}
                  </span>
                ))}
                {opportunity.skills.length > 4 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-400 rounded">
                    +{opportunity.skills.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {opportunity.fitScore != null && (
            <div className="flex flex-col items-center shrink-0">
              <TrendingUp size={14} className="text-blue-400 mb-1" />
              <span
                className={`text-lg font-bold ${
                  opportunity.fitScore >= 80
                    ? 'text-emerald-400'
                    : opportunity.fitScore >= 60
                    ? 'text-blue-400'
                    : opportunity.fitScore >= 40
                    ? 'text-amber-400'
                    : 'text-red-400'
                }`}
              >
                {opportunity.fitScore}%
              </span>
              <span className="text-[10px] text-slate-500">fit</span>
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
