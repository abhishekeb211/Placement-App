import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const opportunitySelect = {
  id: true,
  title: true,
  company: true,
  role: true,
  location: true,
  deadline: true,
  status: true,
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.application.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const body = await request.json();
    const { status, notes, outcome, appliedAt } = body;

    const application = await prisma.application.update({
      where: { id },
      data: {
        ...(status !== undefined && { status }),
        ...(notes !== undefined && { notes: notes ?? null }),
        ...(outcome !== undefined && { outcome: outcome ?? null }),
        ...(appliedAt !== undefined && { appliedAt: appliedAt ? new Date(appliedAt) : null }),
      },
      include: { opportunity: { select: opportunitySelect } },
    });

    return NextResponse.json({ application });
  } catch (error) {
    console.error('[APPLICATION_PATCH]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const existing = await prisma.application.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await prisma.application.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[APPLICATION_DELETE]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
