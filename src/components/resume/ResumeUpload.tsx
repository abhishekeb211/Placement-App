'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ParsedResumeData } from '@/types';

interface ResumeUploadProps {
  onUpload?: (data: ParsedResumeData) => void;
}

function simulateParsing(filename: string): ParsedResumeData {
  // Demo parsed data — in production, integrate a real PDF parser
  return {
    name: 'Student Name',
    email: 'student@example.com',
    phone: '+91 9876543210',
    summary: 'Computer Science student with passion for software development',
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git'],
    education: [
      {
        institution: 'Example University',
        degree: 'B.Tech Computer Science',
        year: '2024',
        cgpa: 8.5,
      },
    ],
    experience: [],
    projects: [
      {
        name: 'E-Commerce Platform',
        description: 'Built a full-stack e-commerce platform using React and Node.js',
        technologies: ['React', 'Node.js', 'MongoDB'],
      },
    ],
  };
}

export function ResumeUpload({ onUpload }: ResumeUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState('');

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.match(/\.(pdf|doc|docx)$/i)) {
      setError('Please upload a PDF or Word document');
      return;
    }
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setFile(selectedFile);
    setError('');
    setUploading(true);

    try {
      const parsedData = simulateParsing(selectedFile.name);

      const res = await fetch('/api/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name.replace(/\s+/g, '_'),
          originalName: selectedFile.name,
          parsedData,
        }),
      });

      if (!res.ok) throw new Error('Upload failed');

      setUploaded(true);
      onUpload?.(parsedData);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFile(dropped);
    },
    [handleFile]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  return (
    <div className="w-full">
      {uploaded && file ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-700 rounded-xl">
          <CheckCircle size={20} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-300">Resume uploaded successfully!</p>
            <p className="text-xs text-slate-400 truncate">{file.name}</p>
          </div>
          <button
            onClick={() => { setFile(null); setUploaded(false); }}
            className="text-slate-500 hover:text-slate-300"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
            dragging
              ? 'border-blue-500 bg-blue-900/20'
              : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
          }`}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {file && uploading ? (
            <>
              <FileText size={32} className="text-blue-400 mb-3" />
              <p className="text-sm text-slate-300">Parsing {file.name}...</p>
            </>
          ) : (
            <>
              <Upload size={32} className="text-slate-500 mb-3" />
              <p className="text-sm font-medium text-slate-300">Drop your resume here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse</p>
              <p className="text-xs text-slate-600 mt-2">PDF, DOC, DOCX • Max 5MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
    </div>
  );
}
