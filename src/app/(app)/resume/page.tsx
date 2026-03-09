'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { ResumeUpload } from '@/components/resume/ResumeUpload';
import { Card } from '@/components/ui/Card';
import type { ParsedResumeData } from '@/types';

interface ResumeData {
  id: string;
  originalName: string;
  uploadedAt: string;
  isActive: boolean;
  parsedData: ParsedResumeData;
}

export default function ResumePage() {
  const [activeResume, setActiveResume] = useState<ResumeData | null>(null);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadResume() {
      try {
        const res = await fetch('/api/resume');
        if (res.ok) {
          const data = await res.json();
          if (data.resume) {
            setActiveResume(data.resume);
            setParsedData(data.resume.parsedData);
          }
        }
      } catch {
        // No resume yet
      } finally {
        setLoading(false);
      }
    }
    loadResume();
  }, []);

  const handleUpload = (data: ParsedResumeData) => {
    setParsedData(data);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume</h1>
        <p className="text-slate-400 text-sm">Upload your resume to enable scoring and recommendations</p>
      </div>

      {/* Upload */}
      <Card>
        <h2 className="text-sm font-semibold text-white mb-3">Upload Resume</h2>
        <ResumeUpload onUpload={handleUpload} />
        {activeResume && (
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
            <CheckCircle size={14} className="text-emerald-400" />
            Active: <span className="text-white">{activeResume.originalName}</span>
            <span className="text-slate-600">•</span>
            {new Date(activeResume.uploadedAt).toLocaleDateString()}
          </div>
        )}
      </Card>

      {/* Parsed Data */}
      {parsedData && (
        <>
          {/* Skills */}
          {(parsedData.skills || []).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-3">Detected Skills</h2>
              <div className="flex flex-wrap gap-2">
                {parsedData.skills!.map((skill) => (
                  <span key={skill} className="px-2.5 py-1 text-xs bg-blue-900/30 text-blue-300 rounded-full border border-blue-800">
                    {skill}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Education */}
          {(parsedData.education || []).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-3">Education</h2>
              {parsedData.education!.map((edu, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-sm font-medium text-white">{edu.degree}</p>
                  <p className="text-xs text-slate-400">{edu.institution}</p>
                  <div className="flex gap-3 text-xs text-slate-500 mt-0.5">
                    {edu.year && <span>{edu.year}</span>}
                    {edu.cgpa && <span>CGPA: {edu.cgpa}</span>}
                  </div>
                </div>
              ))}
            </Card>
          )}

          {/* Projects */}
          {(parsedData.projects || []).length > 0 && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-3">Projects</h2>
              {parsedData.projects!.map((proj, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-sm font-medium text-white">{proj.name}</p>
                  {proj.description && <p className="text-xs text-slate-400 mt-0.5">{proj.description}</p>}
                  {proj.technologies && proj.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {proj.technologies.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-[10px] bg-slate-700 text-slate-400 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}

          {/* Summary */}
          {parsedData.summary && (
            <Card>
              <h2 className="text-sm font-semibold text-white mb-2">Summary</h2>
              <p className="text-xs text-slate-400 leading-relaxed">{parsedData.summary}</p>
            </Card>
          )}
        </>
      )}

      {!loading && !parsedData && (
        <Card className="text-center py-8">
          <FileText size={32} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">No resume uploaded yet</p>
          <p className="text-slate-600 text-xs mt-1">
            Upload your resume to enable ATS scoring and job-fit analysis
          </p>
        </Card>
      )}
    </div>
  );
}
