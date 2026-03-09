import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateFitScore } from '@/lib/scoring/fitScore';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { opportunityId } = await request.json();
    if (!opportunityId) {
      return NextResponse.json({ error: 'opportunityId is required' }, { status: 400 });
    }

    const [opportunity, profile, activeResume] = await Promise.all([
      prisma.opportunity.findFirst({ where: { id: opportunityId, userId: session.user.id } }),
      prisma.profile.findUnique({ where: { userId: session.user.id } }),
      prisma.resume.findFirst({ where: { userId: session.user.id, isActive: true } }),
    ]);

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const parsedData = activeResume ? JSON.parse(activeResume.parsedData || '{}') : {};
    const jobSkills: string[] = JSON.parse(opportunity.skills || '[]');

    const result = calculateFitScore({
      resume: parsedData,
      cgpa: profile?.cgpa ?? null,
      jobSkills,
      jobRequirements: opportunity.requirements ?? undefined,
      jobTitle: opportunity.title,
      jobRole: opportunity.role ?? undefined,
    });

    // Persist the score
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { fitScore: result.score },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[FIT_SCORE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
