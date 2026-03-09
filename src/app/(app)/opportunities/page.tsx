'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Plus, Briefcase } from 'lucide-react';
import { OpportunityCard } from '@/components/opportunities/OpportunityCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import type { Opportunity, OpportunityStatus } from '@/types';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Status' },
  { value: 'NEW', label: 'New' },
  { value: 'OPENED', label: 'Opened' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'APPLIED', label: 'Applied' },
  { value: 'SHORTLISTED', label: 'Shortlisted' },
  { value: 'TEST_RECEIVED', label: 'Test Received' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview' },
  { value: 'REJECTED', label: 'Rejected' },
  { value: 'SELECTED', label: 'Selected' },
  { value: 'MISSED', label: 'Missed' },
];

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const [newOpp, setNewOpp] = useState({
    title: '',
    company: '',
    role: '',
    location: '',
    deadline: '',
    salaryRange: '',
    skills: '',
    requirements: '',
  });
  const [adding, setAdding] = useState(false);

  const fetchOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/opportunities?${params}`);
      const data = await res.json();
      setOpportunities(data.opportunities || []);
    } catch {
      console.error('Failed to fetch opportunities');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchOpportunities, 300);
    return () => clearTimeout(timer);
  }, [fetchOpportunities]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOpp,
          skills: newOpp.skills.split(',').map((s) => s.trim()).filter(Boolean),
          deadline: newOpp.deadline || undefined,
        }),
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewOpp({ title: '', company: '', role: '', location: '', deadline: '', salaryRange: '', skills: '', requirements: '' });
        fetchOpportunities();
      }
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Opportunities</h1>
          <p className="text-slate-400 text-sm">{opportunities.length} found</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus size={16} /> Add
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-8 pr-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <Card className="text-center py-12">
          <Briefcase size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-300 font-medium">No opportunities found</p>
          <p className="text-slate-500 text-sm mt-1">
            {search || statusFilter ? 'Try adjusting your filters' : 'Add your first opportunity to get started'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {opportunities.map((opp) => (
            <OpportunityCard key={opp.id} opportunity={opp} />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-4">Add Opportunity</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              <Input label="Job Title *" value={newOpp.title} onChange={(e) => setNewOpp({ ...newOpp, title: e.target.value })} placeholder="e.g. Software Engineer" required />
              <Input label="Company *" value={newOpp.company} onChange={(e) => setNewOpp({ ...newOpp, company: e.target.value })} placeholder="e.g. Google" required />
              <Input label="Role" value={newOpp.role} onChange={(e) => setNewOpp({ ...newOpp, role: e.target.value })} placeholder="e.g. Frontend Developer" />
              <Input label="Location" value={newOpp.location} onChange={(e) => setNewOpp({ ...newOpp, location: e.target.value })} placeholder="e.g. Bangalore / Remote" />
              <Input label="Deadline" type="date" value={newOpp.deadline} onChange={(e) => setNewOpp({ ...newOpp, deadline: e.target.value })} />
              <Input label="Salary Range" value={newOpp.salaryRange} onChange={(e) => setNewOpp({ ...newOpp, salaryRange: e.target.value })} placeholder="e.g. 8-12 LPA" />
              <Input label="Skills (comma-separated)" value={newOpp.skills} onChange={(e) => setNewOpp({ ...newOpp, skills: e.target.value })} placeholder="React, Node.js, SQL" />
              <div>
                <label className="text-sm font-medium text-slate-300">Requirements</label>
                <textarea
                  value={newOpp.requirements}
                  onChange={(e) => setNewOpp({ ...newOpp, requirements: e.target.value })}
                  rows={3}
                  placeholder="Job description / requirements..."
                  className="mt-1 w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={adding} className="flex-1">
                  Add Opportunity
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
