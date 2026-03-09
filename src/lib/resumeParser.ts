import type { ParsedResumeData } from '@/types';

// ─── Limits ───────────────────────────────────────────────────────────────────

const MAX_SUMMARY_LENGTH = 600;
const MAX_SKILLS_COUNT = 30;
const MAX_FALLBACK_SKILLS_COUNT = 20;
const MAX_PROJECTS_COUNT = 6;
const MAX_CERTIFICATIONS_COUNT = 10;

// ─── Regex helpers ────────────────────────────────────────────────────────────

const EMAIL_RE = /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/;
const PHONE_RE = /(?:\+?\d{1,3}[\s\-.]?)?\(?\d{3}\)?[\s\-.]?\d{3}[\s\-.]?\d{4}/;
const URL_RE = /https?:\/\/[^\s,]+|www\.[^\s,]+/gi;
const CGPA_RE = /(?:cgpa|gpa|score)[^\d]*(\d+\.?\d*)\s*(?:\/\s*(?:10|4))?/i;

const SECTION_HEADINGS: Record<string, string[]> = {
  summary: ['summary', 'objective', 'profile', 'about', 'about me', 'career objective', 'professional summary'],
  skills: ['skills', 'technical skills', 'technologies', 'tech stack', 'core competencies', 'key skills', 'tools & technologies', 'tools and technologies'],
  education: ['education', 'academic background', 'qualifications', 'educational qualifications'],
  experience: ['experience', 'work experience', 'professional experience', 'employment', 'work history', 'internship', 'internships'],
  projects: ['projects', 'personal projects', 'academic projects', 'key projects', 'project experience'],
  certifications: ['certifications', 'certificates', 'achievements', 'awards', 'courses', 'training'],
};

// Skills vocabulary for extraction when a skills section isn't clearly delimited
const KNOWN_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby', 'kotlin', 'swift',
  'react', 'next.js', 'vue', 'angular', 'svelte', 'node.js', 'express', 'fastapi', 'django', 'flask',
  'spring', 'spring boot', 'html', 'css', 'tailwind', 'bootstrap', 'sass',
  'sql', 'mongodb', 'postgresql', 'mysql', 'sqlite', 'redis', 'firebase',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'linux', 'bash',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy', 'scikit-learn',
  'data analysis', 'power bi', 'tableau', 'excel',
  'graphql', 'rest api', 'microservices', 'agile', 'scrum', 'jira', 'figma', 'ui/ux',
  'react native', 'flutter', 'android', 'ios',
  'terraform', 'ansible', 'jenkins', 'github actions', 'ci/cd',
  'elasticsearch', 'kafka', 'rabbitmq',
];

// ─── Section splitter ─────────────────────────────────────────────────────────

interface Section {
  key: string;
  lines: string[];
}

function splitIntoSections(lines: string[]): Section[] {
  const sections: Section[] = [{ key: 'header', lines: [] }];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const lower = trimmed.toLowerCase().replace(/[:\-–—]/g, '').trim();

    let matched = false;
    for (const [key, headings] of Object.entries(SECTION_HEADINGS)) {
      if (headings.some((h) => lower === h || lower.startsWith(h))) {
        sections.push({ key, lines: [] });
        matched = true;
        break;
      }
    }

    if (!matched) {
      sections[sections.length - 1].lines.push(trimmed);
    }
  }

  return sections;
}

// ─── Individual extractors ────────────────────────────────────────────────────

function extractEmail(text: string): string | undefined {
  return text.match(EMAIL_RE)?.[0];
}

function extractPhone(text: string): string | undefined {
  return text.match(PHONE_RE)?.[0]?.trim();
}

function extractName(headerLines: string[], email?: string): string | undefined {
  // Name is usually the first non-empty line that doesn't look like a URL/email/phone
  for (const line of headerLines.slice(0, 5)) {
    const t = line.trim();
    if (!t) continue;
    if (EMAIL_RE.test(t)) continue;
    if (PHONE_RE.test(t)) continue;
    if (URL_RE.test(t)) continue;
    if (email && t.includes(email)) continue;
    // Looks like a name if it's 2-5 words of mostly letters
    if (/^[A-Za-z][\w\s.'-]{2,60}$/.test(t) && t.split(/\s+/).length <= 5) {
      return t;
    }
  }
  return undefined;
}

function extractSummary(lines: string[]): string | undefined {
  const joined = lines.join(' ').trim();
  return joined.length > 20 ? joined.substring(0, MAX_SUMMARY_LENGTH) : undefined;
}

function extractSkills(lines: string[]): string[] {
  const found = new Set<string>();
  const fullText = lines.join(' ').toLowerCase();

  // Try to parse comma/pipe/newline separated list
  for (const line of lines) {
    const parts = line.split(/[,|•·▪◦\t]+/).map((p) => p.trim()).filter((p) => p.length > 1 && p.length < 40);
    for (const part of parts) {
      if (!/^\d+$/.test(part)) found.add(part);
    }
  }

  // Also capture known skills from vocabulary
  for (const skill of KNOWN_SKILLS) {
    if (fullText.includes(skill)) found.add(skill);
  }

  // Filter out junk (lines that are too long to be skill names)
  return Array.from(found)
    .filter((s) => s.length < 40 && !/^\d+$/.test(s))
    .slice(0, MAX_SKILLS_COUNT);
}

function extractEducation(
  lines: string[]
): ParsedResumeData['education'] {
  const education: NonNullable<ParsedResumeData['education']> = [];
  let current: Partial<{ institution: string; degree: string; year: string; cgpa: number }> | null = null;

  const DEGREE_KEYWORDS = /b\.?tech|b\.?e\b|bsc|b\.?sc|m\.?tech|m\.?e\b|mba|bca|mca|b\.?a\b|m\.?a\b|ph\.?d|bachelor|master|degree/i;
  const YEAR_RE = /\b(19|20)\d{2}\b/g;
  const YEAR_RANGE_RE = /\b((?:19|20)\d{2})\s*[-–—to]+\s*((?:19|20)\d{2}|present|current)\b/i;

  for (const line of lines) {
    if (!line.trim()) continue;

    const cgpaMatch = line.match(CGPA_RE);
    const yearRangeMatch = line.match(YEAR_RANGE_RE);
    const yearMatches = [...line.matchAll(YEAR_RE)].map((m) => m[0]);

    if (DEGREE_KEYWORDS.test(line)) {
      if (current?.institution) education.push(current as typeof education[0]);
      current = { degree: line.trim() };

      if (cgpaMatch) current.cgpa = parseFloat(cgpaMatch[1]);
      if (yearRangeMatch) {
        current.year = `${yearRangeMatch[1]} – ${yearRangeMatch[2]}`;
      } else if (yearMatches.length) {
        current.year = yearMatches[yearMatches.length - 1];
      }
    } else if (current && !current.institution) {
      // Next meaningful line is likely the institution
      current.institution = line.trim();
      if (cgpaMatch) current.cgpa = parseFloat(cgpaMatch[1]);
      if (yearRangeMatch) {
        current.year = `${yearRangeMatch[1]} – ${yearRangeMatch[2]}`;
      } else if (yearMatches.length) {
        current.year = yearMatches[yearMatches.length - 1];
      }
    } else if (current) {
      if (cgpaMatch && !current.cgpa) current.cgpa = parseFloat(cgpaMatch[1]);
      if (!current.year) {
        if (yearRangeMatch) {
          current.year = `${yearRangeMatch[1]} – ${yearRangeMatch[2]}`;
        } else if (yearMatches.length) {
          current.year = yearMatches[yearMatches.length - 1];
        }
      }
    }
  }

  if (current?.institution) education.push(current as typeof education[0]);

  return education;
}

function extractExperience(
  lines: string[]
): ParsedResumeData['experience'] {
  const experience: NonNullable<ParsedResumeData['experience']> = [];
  const DURATION_RE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*[\s,]*(?:19|20)\d{2}/i;

  let current: Partial<{ company: string; role: string; duration: string; description: string }> | null = null;
  const descLines: string[] = [];

  const flush = () => {
    if (current?.company || current?.role) {
      experience.push({
        company: current.company || 'Unknown',
        role: current.role || 'Engineer',
        duration: current.duration,
        description: descLines.join(' ').substring(0, 300) || undefined,
      });
    }
    descLines.length = 0;
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    const hasDuration = DURATION_RE.test(t) || /present|current/i.test(t);

    if (hasDuration && t.split(/\s+/).length < 15) {
      flush();
      current = { duration: t };
    } else if (current && !current.company && !current.role) {
      current.role = t;
    } else if (current && !current.company) {
      current.company = t;
    } else {
      descLines.push(t);
    }
  }
  flush();

  return experience;
}

function extractProjects(
  lines: string[]
): ParsedResumeData['projects'] {
  const projects: NonNullable<ParsedResumeData['projects']> = [];
  let current: Partial<{ name: string; description: string; technologies: string[] }> | null = null;
  const descLines: string[] = [];
  const techLines: string[] = [];

  const flush = () => {
    if (current?.name) {
      const techText = techLines.join(' ').toLowerCase();
      const techs = KNOWN_SKILLS.filter((s) => techText.includes(s));
      projects.push({
        name: current.name,
        description: descLines.join(' ').substring(0, 300) || undefined,
        technologies: techs.length ? techs : undefined,
      });
    }
    descLines.length = 0;
    techLines.length = 0;
  };

  const TECH_HEADING = /tech(?:nologies|nology|stack|s)?[:\s]|tools[:\s]|built with/i;

  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;

    // Project name heuristic: short line, not starting with bullet/number
    const isShortTitle = t.length < 80 && t.split(/\s+/).length <= 8 && !/^[-•·▪◦]/.test(t);

    if (isShortTitle && !current) {
      current = { name: t };
    } else if (isShortTitle && current && !descLines.length) {
      // Second short line could be a sub-title; treat as description
      descLines.push(t);
    } else if (isShortTitle && current && descLines.length > 2) {
      // New project starts
      flush();
      current = { name: t };
    } else if (TECH_HEADING.test(t)) {
      techLines.push(t);
    } else {
      descLines.push(t);
    }
  }
  flush();

  return projects.slice(0, MAX_PROJECTS_COUNT);
}

function extractCertifications(lines: string[]): string[] {
  return lines
    .map((l) => l.replace(/^[-•·▪◦\d.]+\s*/, '').trim())
    .filter((l) => l.length > 5 && l.length < 120)
    .slice(0, MAX_CERTIFICATIONS_COUNT);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseResumeText(text: string): ParsedResumeData {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0);

  const sections = splitIntoSections(lines);

  const headerSection = sections.find((s) => s.key === 'header') ?? { lines };
  const fullText = text;

  const email = extractEmail(fullText);
  const phone = extractPhone(fullText);
  const name = extractName(headerSection.lines, email);

  const skillsLines = sections.filter((s) => s.key === 'skills').flatMap((s) => s.lines);
  const eduLines = sections.filter((s) => s.key === 'education').flatMap((s) => s.lines);
  const expLines = sections.filter((s) => s.key === 'experience').flatMap((s) => s.lines);
  const projLines = sections.filter((s) => s.key === 'projects').flatMap((s) => s.lines);
  const summaryLines = sections.filter((s) => s.key === 'summary').flatMap((s) => s.lines);
  const certLines = sections.filter((s) => s.key === 'certifications').flatMap((s) => s.lines);

  // If no skills section, try extracting from full text
  const skills = skillsLines.length > 0
    ? extractSkills(skillsLines)
    : KNOWN_SKILLS.filter((s) => text.toLowerCase().includes(s)).slice(0, MAX_FALLBACK_SKILLS_COUNT);

  const education = extractEducation(eduLines) ?? [];
  const experience = expLines.length > 0 ? (extractExperience(expLines) ?? []) : [];
  const projects = projLines.length > 0 ? (extractProjects(projLines) ?? []) : [];
  const certifications = certLines.length > 0 ? extractCertifications(certLines) : [];
  const summary = summaryLines.length > 0 ? extractSummary(summaryLines) : undefined;

  return {
    name,
    email,
    phone,
    summary,
    skills: skills.length > 0 ? skills : undefined,
    education: education.length > 0 ? education : undefined,
    experience: experience.length > 0 ? experience : undefined,
    projects: projects.length > 0 ? projects : undefined,
    certifications: certifications.length > 0 ? certifications : undefined,
  };
}
