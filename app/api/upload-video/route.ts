import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/lib/s3';



export async function POST(req: Request) {
  const data = await req.formData();
  const file = data.get('video') as File | null;
  
  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'Файл не загружен' }, { status: 400 });
  }

  const filename = `reel-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`;
  const url = await uploadToS3(file, filename);

  return NextResponse.json({ url });
}