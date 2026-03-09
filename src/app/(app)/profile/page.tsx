'use client';

import { useState, useEffect } from 'react';
import { User, Save, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ProfileData {
  name: string;
  phone: string;
  college: string;
  degree: string;
  year: string;
  cgpa: string;
  skills: string[];
  bio: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>({
    name: '', phone: '', college: '', degree: '', year: '',
    cgpa: '', skills: [], bio: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '',
  });
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/profile');
        const data = await res.json();
        if (data.profile) {
          setProfile({
            name: data.user?.name || '',
            phone: data.profile.phone || '',
            college: data.profile.college || '',
            degree: data.profile.degree || '',
            year: data.profile.year?.toString() || '',
            cgpa: data.profile.cgpa?.toString() || '',
            skills: data.profile.skills || [],
            bio: data.profile.bio || '',
            linkedinUrl: data.profile.linkedinUrl || '',
            githubUrl: data.profile.githubUrl || '',
            portfolioUrl: data.profile.portfolioUrl || '',
          });
        }
      } catch {
        // Profile might not exist yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save');
        return;
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (skill && !profile.skills.includes(skill)) {
      setProfile((p) => ({ ...p, skills: [...p.skills, skill] }));
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setProfile((p) => ({ ...p, skills: p.skills.filter((s) => s !== skill) }));
  };

  const set = (field: keyof ProfileData, value: string) =>
    setProfile((p) => ({ ...p, [field]: value }));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-slate-800 rounded animate-pulse" />
        <div className="h-64 bg-slate-800 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
          {profile.name?.[0]?.toUpperCase() || <User size={24} />}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{profile.name || 'Your Profile'}</h1>
          <p className="text-slate-400 text-sm">Manage your placement profile</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        {/* Personal Info */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Personal Information</h2>
          <div className="space-y-3">
            <Input label="Full Name" value={profile.name} onChange={(e) => set('name', e.target.value)} placeholder="John Doe" />
            <Input label="Phone" type="tel" value={profile.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 9876543210" />
            <div>
              <label className="text-sm font-medium text-slate-300">Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => set('bio', e.target.value)}
                rows={3}
                placeholder="Tell us about yourself..."
                className="mt-1 w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Academic Info */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Academic Information</h2>
          <div className="space-y-3">
            <Input label="College / University" value={profile.college} onChange={(e) => set('college', e.target.value)} placeholder="IIT Delhi" />
            <Input label="Degree" value={profile.degree} onChange={(e) => set('degree', e.target.value)} placeholder="B.Tech Computer Science" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Year" type="number" min="1" max="6" value={profile.year} onChange={(e) => set('year', e.target.value)} placeholder="3" />
              <Input label="CGPA" type="number" step="0.01" min="0" max="10" value={profile.cgpa} onChange={(e) => set('cgpa', e.target.value)} placeholder="8.5" />
            </div>
          </div>
        </Card>

        {/* Skills */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-3">Skills</h2>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              placeholder="Add a skill..."
              className="flex-1 px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Button type="button" size="sm" variant="secondary" onClick={addSkill}>
              <Plus size={14} />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((skill) => (
              <span key={skill} className="flex items-center gap-1 px-2.5 py-1 bg-blue-900/30 text-blue-300 text-xs rounded-full border border-blue-800">
                {skill}
                <button type="button" onClick={() => removeSkill(skill)} className="hover:text-white">
                  <X size={12} />
                </button>
              </span>
            ))}
            {profile.skills.length === 0 && (
              <p className="text-xs text-slate-500">No skills added yet</p>
            )}
          </div>
        </Card>

        {/* Social Links */}
        <Card>
          <h2 className="text-sm font-semibold text-white mb-4">Social Links</h2>
          <div className="space-y-3">
            <Input label="LinkedIn URL" type="url" value={profile.linkedinUrl} onChange={(e) => set('linkedinUrl', e.target.value)} placeholder="https://linkedin.com/in/username" />
            <Input label="GitHub URL" type="url" value={profile.githubUrl} onChange={(e) => set('githubUrl', e.target.value)} placeholder="https://github.com/username" />
            <Input label="Portfolio URL" type="url" value={profile.portfolioUrl} onChange={(e) => set('portfolioUrl', e.target.value)} placeholder="https://yourportfolio.com" />
          </div>
        </Card>

        {error && (
          <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {saved && (
          <p className="text-sm text-emerald-400 bg-emerald-900/20 border border-emerald-800 px-3 py-2 rounded-lg">
            ✓ Profile saved successfully!
          </p>
        )}

        <Button type="submit" loading={saving} className="w-full" size="lg">
          <Save size={16} /> Save Profile
        </Button>
      </form>
    </div>
  );
}
