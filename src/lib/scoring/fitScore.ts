import type { FitScoreResult, ParsedResumeData } from '@/types';

interface ScoringInput {
  resume: ParsedResumeData;
  cgpa?: number | null;
  jobSkills: string[];
  jobRequirements?: string;
  jobTitle: string;
  jobRole?: string;
}

export function calculateFitScore(input: ScoringInput): FitScoreResult {
  const { resume, cgpa, jobSkills, jobRequirements, jobTitle, jobRole } = input;

  const resumeSkills = (resume.skills || []).map((s) => s.toLowerCase().trim());
  const requiredSkills = jobSkills.map((s) => s.toLowerCase().trim());

  // 1. Skill Overlap (max 40 points)
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const skill of requiredSkills) {
    const matched = resumeSkills.some(
      (rs) => rs.includes(skill) || skill.includes(rs)
    );
    if (matched) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  const skillOverlap =
    requiredSkills.length > 0
      ? Math.round((matchedSkills.length / requiredSkills.length) * 40)
      : 20;

  // 2. CGPA Eligibility (max 20 points)
  let cgpaEligibility = 0;
  const cgpaMatch = jobRequirements?.match(/cgpa[:\s]*(\d+\.?\d*)/i);
  const requiredCgpa = cgpaMatch ? parseFloat(cgpaMatch[1]) : null;

  if (cgpa && requiredCgpa) {
    cgpaEligibility = cgpa >= requiredCgpa ? 20 : Math.round((cgpa / requiredCgpa) * 20);
  } else if (cgpa) {
    // No explicit requirement — score based on absolute CGPA
    if (cgpa >= 8.5) cgpaEligibility = 20;
    else if (cgpa >= 7.5) cgpaEligibility = 15;
    else if (cgpa >= 6.5) cgpaEligibility = 10;
    else cgpaEligibility = 5;
  } else {
    cgpaEligibility = 10; // unknown, neutral
  }

  // 3. Experience Relevance (max 20 points)
  let experienceRelevance = 0;
  const allText = [
    ...(resume.experience || []).map((e) => `${e.role} ${e.description || ''}`),
    ...(resume.projects || []).map((p) => `${p.name} ${p.description || ''}`),
  ]
    .join(' ')
    .toLowerCase();

  const roleKeywords = [jobTitle, jobRole || '']
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const matchedKeywords = roleKeywords.filter((kw) => allText.includes(kw));
  experienceRelevance =
    roleKeywords.length > 0
      ? Math.min(20, Math.round((matchedKeywords.length / roleKeywords.length) * 20))
      : 10;

  // 4. Keyword Match (max 20 points)
  let keywordMatch = 0;
  if (jobRequirements) {
    const jobKeywords = jobRequirements
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4);
    const resumeText = JSON.stringify(resume).toLowerCase();
    const matchedJobKeywords = jobKeywords.filter((kw) => resumeText.includes(kw));
    keywordMatch = Math.min(
      20,
      Math.round((matchedJobKeywords.length / Math.max(jobKeywords.length, 1)) * 20)
    );
  } else {
    keywordMatch = 10;
  }

  const score = Math.min(100, skillOverlap + cgpaEligibility + experienceRelevance + keywordMatch);

  const suggestions: string[] = [];
  if (missingSkills.length > 0) {
    suggestions.push(`Learn these skills to improve fit: ${missingSkills.slice(0, 5).join(', ')}`);
  }
  if (cgpaEligibility < 15 && cgpa) {
    suggestions.push('Focus on improving your academic performance');
  }
  if (experienceRelevance < 10) {
    suggestions.push(`Build projects related to ${jobTitle} to demonstrate experience`);
  }

  return {
    score,
    breakdown: { skillOverlap, cgpaEligibility, experienceRelevance, keywordMatch },
    matchedSkills,
    missingSkills,
    suggestions,
  };
}
