import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resume = await prisma.resume.findFirst({
      where: { userId: session.user.id, isActive: true },
    });

    if (!resume) {
      return NextResponse.json({ resume: null });
    }

    return NextResponse.json({
      resume: {
        ...resume,
        parsedData: JSON.parse(resume.parsedData || '{}'),
      },
    });
  } catch (error) {
    console.error('[RESUME_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { filename, originalName, parsedData } = body;

    if (!filename || !originalName) {
      return NextResponse.json({ error: 'filename and originalName are required' }, { status: 400 });
    }

    // Mark all existing resumes as inactive
    await prisma.resume.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false },
    });

    const resume = await prisma.resume.create({
      data: {
        userId: session.user.id,
        filename,
        originalName,
        parsedData: JSON.stringify(parsedData || {}),
        isActive: true,
      },
    });

    // Update profile skills from parsed resume
    if (parsedData?.skills && Array.isArray(parsedData.skills)) {
      await prisma.profile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          skills: JSON.stringify(parsedData.skills),
        },
        update: {
          skills: JSON.stringify(parsedData.skills),
        },
      });
    }

    return NextResponse.json({
      resume: {
        ...resume,
        parsedData: parsedData || {},
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[RESUME_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
