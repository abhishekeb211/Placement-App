import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, email: true, image: true },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills || '[]'),
      },
      user,
    });
  } catch (error) {
    console.error('[PROFILE_GET]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phone, college, degree, year, cgpa, skills, bio, linkedinUrl, githubUrl, portfolioUrl } = body;

    const profileData: Record<string, unknown> = {};
    if (phone !== undefined) profileData.phone = phone;
    if (college !== undefined) profileData.college = college;
    if (degree !== undefined) profileData.degree = degree;
    if (year !== undefined) profileData.year = year ? parseInt(year) : null;
    if (cgpa !== undefined) profileData.cgpa = cgpa ? parseFloat(cgpa) : null;
    if (skills !== undefined) profileData.skills = JSON.stringify(Array.isArray(skills) ? skills : []);
    if (bio !== undefined) profileData.bio = bio;
    if (linkedinUrl !== undefined) profileData.linkedinUrl = linkedinUrl;
    if (githubUrl !== undefined) profileData.githubUrl = githubUrl;
    if (portfolioUrl !== undefined) profileData.portfolioUrl = portfolioUrl;

    const [profile] = await prisma.$transaction([
      prisma.profile.upsert({
        where: { userId: session.user.id },
        create: { userId: session.user.id, ...profileData, skills: profileData.skills as string || '[]' },
        update: profileData,
      }),
    ]);

    if (name !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { name },
      });
    }

    return NextResponse.json({
      profile: {
        ...profile,
        skills: JSON.parse(profile.skills || '[]'),
      },
    });
  } catch (error) {
    console.error('[PROFILE_PUT]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
