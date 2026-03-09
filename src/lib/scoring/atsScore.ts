import type { ATSScoreResult, ParsedResumeData } from '@/types';

const ACTION_VERBS = [
  'developed', 'built', 'designed', 'implemented', 'created', 'led', 'managed',
  'optimized', 'improved', 'reduced', 'increased', 'delivered', 'launched',
  'architected', 'engineered', 'deployed', 'automated', 'streamlined', 'collaborated',
  'coordinated', 'resolved', 'integrated', 'migrated', 'refactored', 'scaled',
  'analyzed', 'researched', 'presented', 'trained', 'mentored', 'owned',
];

export function calculateATSScore(
  resume: ParsedResumeData,
  jobTitle: string,
  jobRequirements?: string,
  jobSkills?: string[]
): ATSScoreResult {
  // 1. Keyword Coverage (max 40 points)
  const jobKeywords = [
    ...(jobSkills || []),
    ...(jobRequirements || jobTitle)
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 4),
  ].map((k) => k.toLowerCase());

  const resumeText = [
    resume.summary || '',
    ...(resume.skills || []),
    ...(resume.experience || []).map((e) => `${e.role} ${e.description || ''}`),
    ...(resume.projects || []).map((p) => `${p.name} ${p.description || ''}`),
    ...(resume.education || []).map((e) => `${e.institution} ${e.degree}`),
  ]
    .join(' ')
    .toLowerCase();

  const coveredKeywords = jobKeywords.filter((kw) => resumeText.includes(kw));
  const keywordCoverage =
    jobKeywords.length > 0
      ? Math.round((coveredKeywords.length / jobKeywords.length) * 40)
      : 20;

  // 2. Section Completeness (max 25 points)
  const sections = {
    contact: !!(resume.email || resume.phone),
    education: (resume.education || []).length > 0,
    skills: (resume.skills || []).length > 0,
    experience: (resume.experience || []).length > 0 || (resume.projects || []).length > 0,
    summary: !!resume.summary,
  };

  const completedSections = Object.values(sections).filter(Boolean).length;
  const sectionCompleteness = Math.round((completedSections / Object.keys(sections).length) * 25);

  // 3. Action Verbs (max 15 points)
  const experienceText = [
    ...(resume.experience || []).map((e) => e.description || ''),
    ...(resume.projects || []).map((p) => p.description || ''),
  ]
    .join(' ')
    .toLowerCase();

  const foundVerbs = ACTION_VERBS.filter((verb) => experienceText.includes(verb));
  const actionVerbs = Math.min(15, Math.round((foundVerbs.length / 8) * 15));

  // 4. Measurable Outcomes (max 20 points)
  const hasNumbers = /\d+%|\d+x|\$\d+|\d+ (users|customers|projects|teams|systems|features)/i.test(experienceText);
  const hasMultipleNumbers = (experienceText.match(/\d+/g) || []).length >= 3;
  const measurableOutcomes = hasNumbers ? 20 : hasMultipleNumbers ? 12 : 5;

  const score = Math.min(100, keywordCoverage + sectionCompleteness + actionVerbs + measurableOutcomes);

  const tips: string[] = [];

  if (keywordCoverage < 25) {
    const missing = jobKeywords.filter((kw) => !resumeText.includes(kw)).slice(0, 5);
    tips.push(`Add these missing keywords to your resume: ${missing.join(', ')}`);
  }
  if (!sections.summary) {
    tips.push('Add a professional summary/objective to the top of your resume');
  }
  if (!sections.contact) {
    tips.push('Ensure your contact information (email/phone) is visible');
  }
  if (actionVerbs < 10) {
    tips.push('Use more action verbs like "developed", "optimized", "led" in your experience');
  }
  if (measurableOutcomes < 12) {
    tips.push('Quantify your achievements with numbers and percentages (e.g., "improved performance by 30%")');
  }
  if ((resume.skills || []).length < 5) {
    tips.push('List more technical skills relevant to the job posting');
  }

  return {
    score,
    breakdown: { keywordCoverage, sectionCompleteness, actionVerbs, measurableOutcomes },
    tips,
  };
}
