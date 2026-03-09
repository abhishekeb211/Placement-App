import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateATSScore } from '@/lib/scoring/atsScore';

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

    const [opportunity, activeResume] = await Promise.all([
      prisma.opportunity.findFirst({ where: { id: opportunityId, userId: session.user.id } }),
      prisma.resume.findFirst({ where: { userId: session.user.id, isActive: true } }),
    ]);

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const parsedData = activeResume ? JSON.parse(activeResume.parsedData || '{}') : {};
    const jobSkills: string[] = JSON.parse(opportunity.skills || '[]');

    const result = calculateATSScore(
      parsedData,
      opportunity.title,
      opportunity.requirements ?? undefined,
      jobSkills
    );

    // Persist the score
    await prisma.opportunity.update({
      where: { id: opportunityId },
      data: { atsScore: result.score },
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[ATS_SCORE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
