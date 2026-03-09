import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateRecommendations } from '@/lib/scoring/recommendations';

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

    const [opportunity, profile] = await Promise.all([
      prisma.opportunity.findFirst({ where: { id: opportunityId, userId: session.user.id } }),
      prisma.profile.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 });
    }

    const studentSkills: string[] = JSON.parse(profile?.skills || '[]');
    const jobSkills: string[] = JSON.parse(opportunity.skills || '[]');

    const result = generateRecommendations(
      studentSkills,
      jobSkills,
      opportunity.role || opportunity.title,
      opportunity.fitScore ?? 0
    );

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[RECOMMENDATIONS]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
