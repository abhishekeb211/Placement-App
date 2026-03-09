import type { DetectedOpportunity } from '@/types';

const JOB_KEYWORDS = [
  'job', 'opportunity', 'opening', 'vacancy', 'hiring', 'recruitment', 'apply',
  'position', 'role', 'internship', 'fresher', 'campus', 'placement', 'offer',
  'joining', 'onboarding', 'interview', 'assessment', 'shortlist', 'selected',
];

const TECH_SKILLS = [
  'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'go', 'rust', 'ruby',
  'react', 'next.js', 'vue', 'angular', 'node.js', 'express', 'fastapi', 'django',
  'spring', 'html', 'css', 'tailwind', 'sql', 'mongodb', 'postgresql', 'mysql',
  'redis', 'docker', 'kubernetes', 'aws', 'gcp', 'azure', 'git', 'linux',
  'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'pandas', 'numpy',
  'data analysis', 'power bi', 'tableau', 'excel', 'communication', 'teamwork',
  'problem solving', 'leadership', 'agile', 'scrum', 'jira', 'figma', 'ui/ux',
];

function extractDate(text: string): Date | undefined {
  const datePatterns = [
    /deadline[:\s]+([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i,
    /apply by[:\s]+([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i,
    /last date[:\s]+([A-Z][a-z]+ \d{1,2},?\s*\d{4})/i,
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,
    /([A-Z][a-z]+ \d{1,2},?\s*\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsed = new Date(match[1]);
      if (!isNaN(parsed.getTime()) && parsed > new Date()) {
        return parsed;
      }
    }
  }
  return undefined;
}

function extractSalary(text: string): string | undefined {
  const salaryPatterns = [
    /(?:ctc|salary|package|stipend)[:\s]*(?:rs\.?|inr|₹|\$)?\s*(\d+(?:[.,]\d+)?(?:\s*(?:lpa|lakh|lakhs|k|per annum|\/month|pm))?)/i,
    /(?:₹|\$|inr)\s*(\d+(?:[.,]\d+)?\s*(?:lpa|lakh|k)?)/i,
    /(\d+(?:\.\d+)?\s*(?:lpa|lakh|lakhs))/i,
  ];

  for (const pattern of salaryPatterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return undefined;
}

function extractLinks(text: string): string[] {
  const urlPattern = /https?:\/\/[^\s<>"]+/gi;
  const matches = text.match(urlPattern) || [];
  const unique = Array.from(new Set(matches));
  return unique.slice(0, 5);
}

function extractSkills(text: string): string[] {
  const textLower = text.toLowerCase();
  return TECH_SKILLS.filter((skill) => textLower.includes(skill));
}

function extractCompany(text: string): string {
  const patterns = [
    /(?:from|at|by|@)\s+([A-Z][A-Za-z\s&.]+(?:Inc|Ltd|LLC|Corp|Technologies|Solutions|Systems)?)/,
    /([A-Z][A-Za-z\s&.]+(?:Inc|Ltd|LLC|Corp|Technologies|Solutions|Systems))\s+(?:is hiring|invites)/i,
    /company[:\s]+([A-Z][A-Za-z\s&.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return 'Unknown Company';
}

function extractRole(text: string): string | undefined {
  const rolePatterns = [
    /(?:role|position|opening)[:\s]+([A-Za-z\s]+(?:Engineer|Developer|Analyst|Designer|Manager|Lead|Intern|Associate)?)/i,
    /hiring\s+(?:for\s+)?([A-Za-z\s]+(?:Engineer|Developer|Analyst|Designer|Manager|Lead|Intern|Associate))/i,
    /([A-Za-z\s]+(?:Engineer|Developer|Analyst|Designer|Manager|Lead|Intern|Associate))\s+(?:at|@)/i,
  ];

  for (const pattern of rolePatterns) {
    const match = text.match(pattern);
    if (match && match[1].length < 60) return match[1].trim();
  }
  return undefined;
}

function extractLocation(text: string): string | undefined {
  const patterns = [
    /location[:\s]+([A-Za-z\s,]+)/i,
    /(?:based in|at)\s+([A-Za-z\s]+(?:,\s*[A-Za-z]+)?)/i,
    /(remote|hybrid|on-?site|bangalore|mumbai|delhi|hyderabad|pune|chennai|kolkata)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1].trim();
  }
  return undefined;
}

export function detectOpportunityFromEmail(
  subject: string,
  body: string
): DetectedOpportunity {
  const fullText = `${subject}\n${body}`;
  const textLower = fullText.toLowerCase();

  const isJobRelated = JOB_KEYWORDS.some((kw) => textLower.includes(kw));
  const matchedKeywords = JOB_KEYWORDS.filter((kw) => textLower.includes(kw));
  const confidence = Math.min(1, matchedKeywords.length / 3);

  const role = extractRole(fullText);
  const company = extractCompany(fullText);
  const deadline = extractDate(fullText);
  const salaryRange = extractSalary(fullText);
  const location = extractLocation(fullText);
  const skills = extractSkills(fullText);
  const extractedLinks = extractLinks(fullText);
  const applicationLink = extractedLinks.find(
    (link) => link.includes('apply') || link.includes('form') || link.includes('job')
  );

  const title = role
    ? `${role} at ${company}`
    : subject.length > 60
    ? subject.substring(0, 60) + '...'
    : subject;

  return {
    title,
    company,
    role,
    deadline,
    salaryRange,
    location,
    skills,
    requirements: body.substring(0, 500),
    applicationLink,
    extractedLinks,
    isJobRelated,
    confidence,
  };
}
