import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { detectOpportunityFromEmail } from '@/lib/emailDetection';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, body: emailBody } = body as { subject?: string; body?: string };

    if (!emailBody || typeof emailBody !== 'string') {
      return NextResponse.json({ error: 'Email body is required' }, { status: 400 });
    }

    const detected = detectOpportunityFromEmail(
      typeof subject === 'string' ? subject : '',
      emailBody,
    );

    return NextResponse.json({ opportunity: detected });
  } catch (error) {
    console.error('[EMAIL_DETECT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
