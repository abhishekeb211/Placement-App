import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { parseResumeText } from '@/lib/resumeParser';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

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

async function extractTextFromFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    return result.text ?? '';
  }

  if (name.endsWith('.docx') || name.endsWith('.doc')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value ?? '';
  }

  return '';
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const contentType = request.headers.get('content-type') ?? '';

    let filename: string;
    let originalName: string;
    let parsedData: ReturnType<typeof parseResumeText>;

    if (contentType.includes('multipart/form-data')) {
      // New flow: actual file upload → server-side parsing
      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword'];
      const allowedExts = /\.(pdf|docx|doc)$/i;
      if (!allowedTypes.includes(file.type) && !allowedExts.test(file.name)) {
        return NextResponse.json({ error: 'Only PDF and Word documents are supported' }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: 'File size must be less than 5 MB' }, { status: 400 });
      }

      const rawText = await extractTextFromFile(file);
      if (!rawText.trim()) {
        return NextResponse.json({ error: 'Could not extract text from the file. Please ensure it is not a scanned image.' }, { status: 422 });
      }

      parsedData = parseResumeText(rawText);
      originalName = file.name;
      filename = file.name.replace(/\s+/g, '_');
    } else {
      // Legacy JSON flow (kept for backwards compatibility)
      const body = await request.json();
      filename = body.filename;
      originalName = body.originalName;
      parsedData = body.parsedData ?? {};

      if (!filename || !originalName) {
        return NextResponse.json({ error: 'filename and originalName are required' }, { status: 400 });
      }
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
        parsedData: JSON.stringify(parsedData),
        isActive: true,
      },
    });

    // Update profile skills from parsed resume
    if (parsedData?.skills && Array.isArray(parsedData.skills) && parsedData.skills.length > 0) {
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
        parsedData,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('[RESUME_POST]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
