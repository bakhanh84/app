import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { auth } from '@/lib/auth';

const MAX_SIZES: Record<string, number> = {
  image: 10 * 1024 * 1024,   // 10MB
  audio: 50 * 1024 * 1024,   // 50MB
  video: 200 * 1024 * 1024,  // 200MB
  file:  20 * 1024 * 1024,   // 20MB
};

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

export async function POST(req: NextRequest) {
  // Allow non-authenticated uploads but tag with session if available
  const session = await auth();
  const userId = session?.user?.id || 'guest';

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  const mimeType = file.type || 'application/octet-stream';
  const category = getFileCategory(mimeType);
  const maxSize = MAX_SIZES[category];

  if (file.size > maxSize) {
    return NextResponse.json(
      { error: `File quá lớn. Tối đa ${maxSize / 1024 / 1024}MB cho ${category}` },
      { status: 413 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Create upload dir
  const uploadDir = join(process.cwd(), 'public', 'uploads', userId);
  await mkdir(uploadDir, { recursive: true });

  // Unique filename
  const ext = file.name.split('.').pop() || 'bin';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filepath = join(uploadDir, filename);

  await writeFile(filepath, buffer);

  const url = `/uploads/${userId}/${filename}`;

  return NextResponse.json({
    url,
    name: file.name,
    type: category,
    mimeType,
  });
}
