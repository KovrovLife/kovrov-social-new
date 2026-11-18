import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';



export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get('file') as File | null;
  
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
  }

  const isVideo = file.type.startsWith('video');
  const extension = isVideo ? '.mp4' : '.jpg';
  const filename = `story-${Date.now()}-${Math.random().toString(36).substring(7)}${extension}`;
  const url = await uploadToS3(file, filename);

  return NextResponse.json({ url, type: isVideo ? 'video' : 'photo' });
}