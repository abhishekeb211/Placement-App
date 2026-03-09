import type { RecommendationResult, SkillRecommendation } from '@/types';

const ROLE_PROJECT_SUGGESTIONS: Record<string, string[]> = {
  'software engineer': [
    'Build a RESTful API with Node.js/Express',
    'Create a full-stack web app with React and a backend',
    'Contribute to open-source projects on GitHub',
  ],
  'frontend': [
    'Build a responsive portfolio website',
    'Create a React/Next.js application with state management',
    'Build UI components with Storybook',
  ],
  'backend': [
    'Build a microservices architecture',
    'Create a database-driven REST API',
    'Implement authentication/authorization system',
  ],
  'data scientist': [
    'Kaggle competition participation',
    'Build an ML model and deploy as API',
    'End-to-end data pipeline project',
  ],
  'machine learning': [
    'Implement and compare ML algorithms from scratch',
    'Fine-tune a pre-trained LLM for specific task',
    'Build a recommendation system',
  ],
  'devops': [
    'Set up CI/CD pipeline with GitHub Actions',
    'Deploy containerized application with Kubernetes',
    'Infrastructure as Code with Terraform',
  ],
  'mobile': [
    'Build a cross-platform mobile app with React Native/Flutter',
    'Publish an app to Play Store/App Store',
    'Implement push notifications and offline support',
  ],
  'default': [
    'Build a portfolio project demonstrating your key skills',
    'Contribute to open-source projects',
    'Create a technical blog or YouTube channel',
  ],
};

function getProjectSuggestions(role: string): string[] {
  const roleLower = role.toLowerCase();
  for (const [key, suggestions] of Object.entries(ROLE_PROJECT_SUGGESTIONS)) {
    if (roleLower.includes(key)) return suggestions;
  }
  return ROLE_PROJECT_SUGGESTIONS['default'];
}

export function generateRecommendations(
  studentSkills: string[],
  jobSkills: string[],
  jobRole: string,
  fitScore: number
): RecommendationResult {
  const studentSkillsLower = studentSkills.map((s) => s.toLowerCase());
  const missingSkills = jobSkills.filter(
    (skill) =>
      !studentSkillsLower.some(
        (ss) => ss.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ss)
      )
  );

  const recommendations: SkillRecommendation[] = missingSkills.map((skill, index) => {
    let priority: 'critical' | 'useful' | 'optional';
    if (index < Math.ceil(missingSkills.length * 0.4)) {
      priority = 'critical';
    } else if (index < Math.ceil(missingSkills.length * 0.7)) {
      priority = 'useful';
    } else {
      priority = 'optional';
    }

    return {
      skill,
      priority,
      reason:
        priority === 'critical'
          ? `Core requirement for ${jobRole} — most employers expect this`
          : priority === 'useful'
          ? `Commonly required alongside other skills in ${jobRole} roles`
          : `Nice-to-have skill that differentiates candidates for ${jobRole}`,
    };
  });

  let readinessLabel: string;
  if (fitScore >= 80) {
    readinessLabel = 'Ready Now';
  } else if (fitScore >= 60) {
    readinessLabel = 'Almost Ready';
  } else if (fitScore >= 40) {
    readinessLabel = 'Needs Improvement';
  } else {
    readinessLabel = 'Low Fit Currently';
  }

  return {
    readinessLabel,
    score: fitScore,
    recommendations,
    suggestedProjects: getProjectSuggestions(jobRole),
  };
}
