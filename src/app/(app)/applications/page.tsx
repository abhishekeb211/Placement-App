'use client';

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Calendar, ExternalLink, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import type { Application } from '@/types';

const APPLICATION_STATUSES = [
  { value: 'PENDING', label: 'Pending — Preparing to apply' },
  { value: 'SUBMITTED', label: 'Submitted — Application submitted' },
  { value: 'IN_REVIEW', label: 'In Review — Under review' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interviewing — Interview set' },
  { value: 'OFFER_RECEIVED', label: 'Offer Received — Got an offer' },
  { value: 'SELECTED', label: 'Selected — Accepted / Joined' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'WITHDRAWN', label: 'Withdrawn — Withdrawn by applicant' },
];

const FILTER_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interviewing' },
  { value: 'OFFER_RECEIVED', label: 'Offer' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'REJECTED', label: 'Rejected' },
];

type ApplicationWithOpp = Application & {
  opportunity: {
    id: string;
    title: string;
    company: string;
    role: string | null;
    location: string | null;
    deadline: string | null;
    status: string;
  };
};

interface EditState {
  status: string;
  notes: string;
  outcome: string;
  appliedAt: string;
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<ApplicationWithOpp[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editStates, setEditStates] = useState<Record<string, EditState>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const loadApplications = useCallback(async () => {
    const res = await fetch('/api/applications');
    const data = await res.json();
    if (data.applications) {
      setApplications(data.applications);
      const states: Record<string, EditState> = {};
      for (const app of data.applications as ApplicationWithOpp[]) {
        states[app.id] = {
          status: app.status,
          notes: app.notes ?? '',
          outcome: app.outcome ?? '',
          appliedAt: app.appliedAt ? new Date(app.appliedAt).toISOString().slice(0, 10) : '',
        };
      }
      setEditStates(states);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const saveApplication = async (appId: string) => {
    const edit = editStates[appId];
    if (!edit) return;
    setSaving((p) => ({ ...p, [appId]: true }));
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: edit.status,
        notes: edit.notes || null,
        outcome: edit.outcome || null,
        appliedAt: edit.appliedAt || null,
      }),
    });
    const data = await res.json();
    if (data.application) {
      setApplications((prev) =>
        prev.map((a) => (a.id === appId ? { ...a, ...data.application } : a))
      );
    }
    setSaving((p) => ({ ...p, [appId]: false }));
  };

  const deleteApplication = async (appId: string) => {
    if (!confirm('Remove this application from tracking?')) return;
    setDeleting((p) => ({ ...p, [appId]: true }));
    await fetch(`/api/applications/${appId}`, { method: 'DELETE' });
    setApplications((prev) => prev.filter((a) => a.id !== appId));
    setDeleting((p) => ({ ...p, [appId]: false }));
  };

  const updateEditState = (appId: string, field: keyof EditState, value: string) => {
    setEditStates((prev) => ({ ...prev, [appId]: { ...prev[appId], [field]: value } }));
  };

  const filtered = applications.filter(
    (a) => activeFilter === 'ALL' || a.status === activeFilter
  );

  const stats = {
    total: applications.length,
    submitted: applications.filter((a) => a.status === 'SUBMITTED').length,
    interviewing: applications.filter((a) => a.status === 'INTERVIEW_SCHEDULED').length,
    selected: applications.filter((a) => a.status === 'SELECTED').length,
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-40 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-400" />
            My Applications
          </h1>
          <p className="text-slate-400 text-sm mt-0.5">Track your job application progress</p>
        </div>
        <Link href="/opportunities">
          <Button size="sm" variant="secondary">
            <Plus size={14} /> Add from Opportunities
          </Button>
        </Link>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-blue-400' },
          { label: 'Submitted', value: stats.submitted, color: 'text-green-400' },
          { label: 'Interviewing', value: stats.interviewing, color: 'text-indigo-400' },
          { label: 'Selected', value: stats.selected, color: 'text-emerald-400' },
        ].map(({ label, value, color }) => (
          <Card key={label} padding="sm">
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {FILTER_TABS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveFilter(value)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              activeFilter === value
                ? 'bg-blue-600/20 text-blue-300 border-blue-600/40'
                : 'text-slate-400 border-slate-700 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Application List */}
      {filtered.length === 0 ? (
        <Card className="text-center py-12">
          <ClipboardList size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">
            {applications.length === 0 ? 'No applications tracked yet' : 'No applications match this filter'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {applications.length === 0
              ? 'Open any opportunity and click "Start Tracking" to begin'
              : 'Try a different filter tab above'}
          </p>
          {applications.length === 0 && (
            <Link href="/opportunities" className="mt-4 inline-block">
              <Button size="sm" variant="secondary">Browse Opportunities</Button>
            </Link>
          )}
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => {
            const isExpanded = expandedId === app.id;
            const edit = editStates[app.id] ?? {
              status: app.status,
              notes: app.notes ?? '',
              outcome: app.outcome ?? '',
              appliedAt: '',
            };

            return (
              <Card key={app.id} padding="none">
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-white truncate">
                          {app.opportunity.company}
                        </h3>
                        <Badge status={app.status} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">
                        {app.opportunity.role ?? app.opportunity.title}
                      </p>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {app.appliedAt && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar size={11} />
                            Applied {new Date(app.appliedAt).toLocaleDateString()}
                          </span>
                        )}
                        {app.outcome && (
                          <span className="text-xs text-slate-400 italic truncate max-w-[160px]">
                            Outcome: {app.outcome}
                          </span>
                        )}
                        {app.notes && !isExpanded && (
                          <span className="text-xs text-slate-500 truncate max-w-[160px]">
                            {app.notes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/opportunities/${app.opportunityId}`}
                        className="p-1.5 text-slate-500 hover:text-blue-400 transition-colors"
                        title="View opportunity"
                      >
                        <ExternalLink size={15} />
                      </Link>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : app.id)}
                        className="p-1.5 text-slate-500 hover:text-white transition-colors"
                        title={isExpanded ? 'Collapse' : 'Edit'}
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline Edit Form */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-4 space-y-3">
                    {/* Status */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Status</label>
                      <select
                        value={edit.status}
                        onChange={(e) => updateEditState(app.id, 'status', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {APPLICATION_STATUSES.map(({ value, label }) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Applied Date */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Applied Date</label>
                      <input
                        type="date"
                        value={edit.appliedAt}
                        onChange={(e) => updateEditState(app.id, 'appliedAt', e.target.value)}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Outcome */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Outcome</label>
                      <input
                        type="text"
                        value={edit.outcome}
                        onChange={(e) => updateEditState(app.id, 'outcome', e.target.value)}
                        placeholder="e.g. Got offer, Rejected after round 2..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Notes</label>
                      <textarea
                        value={edit.notes}
                        onChange={(e) => updateEditState(app.id, 'notes', e.target.value)}
                        rows={3}
                        placeholder="Add notes about this application..."
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => deleteApplication(app.id)}
                        loading={deleting[app.id]}
                      >
                        <Trash2 size={13} /> Remove
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => saveApplication(app.id)}
                        loading={saving[app.id]}
                      >
                        Save Changes
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
