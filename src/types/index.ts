// TypeScript types for Placement App entities

export type OpportunityStatus =
  | 'NEW'
  | 'OPENED'
  | 'IN_PROGRESS'
  | 'APPLIED'
  | 'MISSED'
  | 'SHORTLISTED'
  | 'TEST_RECEIVED'
  | 'INTERVIEW_SCHEDULED'
  | 'REJECTED'
  | 'SELECTED';

export type ReminderType = 'IMMEDIATE' | 'DAILY' | 'SIX_HOUR' | 'HOURLY' | 'THIRTY_MIN';
export type ReminderStatus = 'PENDING' | 'SENT' | 'SKIPPED' | 'CANCELLED';
export type NotificationType = 'OPPORTUNITY' | 'REMINDER' | 'SYSTEM';

export interface User {
  id: string;
  name?: string | null;
  email: string;
  emailVerified?: Date | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Profile {
  id: string;
  userId: string;
  phone?: string | null;
  college?: string | null;
  degree?: string | null;
  year?: number | null;
  cgpa?: number | null;
  skills: string[];
  bio?: string | null;
  linkedinUrl?: string | null;
  githubUrl?: string | null;
  portfolioUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Resume {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  parsedData: ParsedResumeData;
  isActive: boolean;
  uploadedAt: Date;
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  skills?: string[];
  education?: Array<{
    institution: string;
    degree: string;
    year?: string;
    cgpa?: number;
  }>;
  experience?: Array<{
    company: string;
    role: string;
    duration?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description?: string;
    technologies?: string[];
  }>;
  certifications?: string[];
  summary?: string;
}

export interface Opportunity {
  id: string;
  userId: string;
  title: string;
  company: string;
  role?: string | null;
  location?: string | null;
  deadline?: Date | null;
  salaryRange?: string | null;
  sourceEmail?: string | null;
  extractedLinks: string[];
  requirements?: string | null;
  skills: string[];
  status: OpportunityStatus;
  fitScore?: number | null;
  atsScore?: number | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Reminder {
  id: string;
  userId: string;
  opportunityId: string;
  scheduledAt: Date;
  sentAt?: Date | null;
  type: ReminderType;
  status: ReminderStatus;
  createdAt: Date;
  opportunity?: Opportunity;
}

export interface Notification {
  id: string;
  userId: string;
  opportunityId?: string | null;
  title: string;
  body: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  opportunity?: Opportunity | null;
}

export interface Application {
  id: string;
  userId: string;
  opportunityId: string;
  status: string;
  notes?: string | null;
  appliedAt?: Date | null;
  outcome?: string | null;
  createdAt: Date;
  updatedAt: Date;
  opportunity?: Opportunity;
}

export interface FitScoreResult {
  score: number;
  breakdown: {
    skillOverlap: number;
    cgpaEligibility: number;
    experienceRelevance: number;
    keywordMatch: number;
  };
  matchedSkills: string[];
  missingSkills: string[];
  suggestions: string[];
}

export interface ATSScoreResult {
  score: number;
  breakdown: {
    keywordCoverage: number;
    sectionCompleteness: number;
    actionVerbs: number;
    measurableOutcomes: number;
  };
  tips: string[];
}

export interface SkillRecommendation {
  skill: string;
  priority: 'critical' | 'useful' | 'optional';
  reason: string;
}

export interface RecommendationResult {
  readinessLabel: string;
  score: number;
  recommendations: SkillRecommendation[];
  suggestedProjects: string[];
}

export interface DetectedOpportunity {
  title: string;
  company: string;
  role?: string;
  deadline?: Date;
  salaryRange?: string;
  location?: string;
  skills: string[];
  requirements?: string;
  applicationLink?: string;
  extractedLinks: string[];
  isJobRelated: boolean;
  confidence: number;
}
