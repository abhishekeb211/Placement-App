'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, MapPin, Calendar, DollarSign, Link as LinkIcon,
  Bell, BellOff, Trash2, TrendingUp, FileText, Lightbulb
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ScoreRing } from '@/components/ui/ScoreRing';
import type { Opportunity, OpportunityStatus, FitScoreResult, ATSScoreResult, RecommendationResult } from '@/types';

const STATUS_OPTIONS: OpportunityStatus[] = [
  'NEW', 'OPENED', 'IN_PROGRESS', 'APPLIED', 'MISSED',
  'SHORTLISTED', 'TEST_RECEIVED', 'INTERVIEW_SCHEDULED', 'REJECTED', 'SELECTED',
];

export default function OpportunityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [fitResult, setFitResult] = useState<FitScoreResult | null>(null);
  const [atsResult, setAtsResult] = useState<ATSScoreResult | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [scoringLoading, setScoringLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/opportunities/${id}`);
      const data = await res.json();
      if (data.opportunity) {
        setOpportunity(data.opportunity);
        setNotes(data.opportunity.notes || '');
      }
      setLoading(false);
    }
    load();
  }, [id]);

  const updateStatus = async (status: OpportunityStatus) => {
    const res = await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.opportunity) setOpportunity(data.opportunity);
  };

  const saveNotes = async () => {
    setSaving(true);
    await fetch(`/api/opportunities/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
  };

  const runScoring = async () => {
    setScoringLoading(true);
    try {
      const [fit, ats, rec] = await Promise.all([
        fetch('/api/scoring/fit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: id }) }),
        fetch('/api/scoring/ats', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: id }) }),
        fetch('/api/recommendations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ opportunityId: id }) }),
      ]);
      const [fitData, atsData, recData] = await Promise.all([fit.json(), ats.json(), rec.json()]);
      if (fitData.result) setFitResult(fitData.result);
      if (atsData.result) setAtsResult(atsData.result);
      if (recData.result) setRecommendations(recData.result);

      // Refresh opportunity to get updated scores
      const oppRes = await fetch(`/api/opportunities/${id}`);
      const oppData = await oppRes.json();
      if (oppData.opportunity) setOpportunity(oppData.opportunity);
    } finally {
      setScoringLoading(false);
    }
  };

  const deleteOpportunity = async () => {
    if (!confirm('Delete this opportunity?')) return;
    await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
    router.push('/opportunities');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-32 bg-slate-800 rounded animate-pulse" />
        <div className="h-48 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!opportunity) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Opportunity not found</p>
        <Button variant="ghost" onClick={() => router.back()} className="mt-4">Go back</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-white">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{opportunity.title}</h1>
          <p className="text-slate-400 text-sm">{opportunity.company}</p>
        </div>
        <button onClick={deleteOpportunity} className="text-slate-500 hover:text-red-400 transition-colors p-1">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Status & Info */}
      <Card>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge status={opportunity.status} />
          {opportunity.location && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <MapPin size={11} /> {opportunity.location}
            </span>
          )}
          {opportunity.deadline && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Calendar size={11} /> {new Date(opportunity.deadline).toLocaleDateString()}
            </span>
          )}
          {opportunity.salaryRange && (
            <span className="flex items-center gap-1 text-xs text-green-400">
              <DollarSign size={11} /> {opportunity.salaryRange}
            </span>
          )}
        </div>

        {/* Status Change */}
        <div>
          <label className="text-xs text-slate-500 mb-1 block">Update Status</label>
          <select
            value={opportunity.status}
            onChange={(e) => updateStatus(e.target.value as OpportunityStatus)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Skills */}
      {opportunity.skills.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-2">Required Skills</h3>
          <div className="flex flex-wrap gap-1.5">
            {opportunity.skills.map((skill) => (
              <span key={skill} className="px-2 py-0.5 text-xs bg-slate-700 text-slate-300 rounded-full border border-slate-600">
                {skill}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Scores */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Scores</h3>
          <Button size="sm" variant="secondary" onClick={runScoring} loading={scoringLoading}>
            <TrendingUp size={14} /> Analyze
          </Button>
        </div>
        <div className="flex gap-6 justify-center">
          <div className="text-center">
            <ScoreRing score={opportunity.fitScore ?? 0} label="Fit Score" />
          </div>
          <div className="text-center">
            <ScoreRing score={opportunity.atsScore ?? 0} label="ATS Score" />
          </div>
        </div>
      </Card>

      {/* Fit Score Breakdown */}
      {fitResult && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-400" /> Fit Score Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(fitResult.breakdown).map(([key, val]) => (
              <div key={key} className="bg-slate-700 rounded-lg p-2">
                <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-base font-bold text-white">{val}<span className="text-xs text-slate-400">pts</span></p>
              </div>
            ))}
          </div>
          {fitResult.missingSkills.length > 0 && (
            <div>
              <p className="text-xs text-slate-400 mb-1">Missing Skills:</p>
              <div className="flex flex-wrap gap-1">
                {fitResult.missingSkills.map((s) => (
                  <span key={s} className="px-2 py-0.5 text-xs bg-red-900/30 text-red-400 rounded border border-red-800">{s}</span>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ATS Tips */}
      {atsResult && atsResult.tips.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText size={16} className="text-purple-400" /> ATS Improvement Tips
          </h3>
          <ul className="space-y-2">
            {atsResult.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-300">
                <span className="text-purple-400 shrink-0 mt-0.5">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.recommendations.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Lightbulb size={16} className="text-amber-400" /> Skill Recommendations
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Readiness: <span className="text-white font-medium">{recommendations.readinessLabel}</span>
          </p>
          <div className="space-y-2">
            {recommendations.recommendations.slice(0, 6).map((rec, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 mt-0.5 ${
                  rec.priority === 'critical' ? 'bg-red-900/40 text-red-400' :
                  rec.priority === 'useful' ? 'bg-amber-900/40 text-amber-400' :
                  'bg-slate-700 text-slate-400'
                }`}>
                  {rec.priority}
                </span>
                <div>
                  <p className="text-xs font-medium text-white">{rec.skill}</p>
                  <p className="text-xs text-slate-500">{rec.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Links */}
      {opportunity.extractedLinks.length > 0 && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <LinkIcon size={14} /> Apply Links
          </h3>
          <div className="space-y-1">
            {opportunity.extractedLinks.map((link, i) => (
              <a key={i} href={link} target="_blank" rel="noopener noreferrer"
                className="block text-xs text-blue-400 hover:text-blue-300 truncate">
                {link}
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <h3 className="text-sm font-semibold text-white mb-2">Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add notes about this opportunity..."
          className="w-full bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <Button size="sm" variant="secondary" onClick={saveNotes} loading={saving} className="mt-2">
          Save Notes
        </Button>
      </Card>

      {/* Requirements */}
      {opportunity.requirements && (
        <Card>
          <h3 className="text-sm font-semibold text-white mb-2">Job Description</h3>
          <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
            {opportunity.requirements}
          </p>
        </Card>
      )}
    </div>
  );
}
