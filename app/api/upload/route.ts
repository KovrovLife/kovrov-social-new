import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ru-1',
  endpoint: process.env.S3_ENDPOINT || 'https://twcstorage.ru',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const files = data.getAll('photos') as File[];

    const urls: string[] = [];
    const bucket = process.env.S3_BUCKET || 'kovrov-life-uploads';
    const endpoint = process.env.S3_ENDPOINT || 'https://twcstorage.ru';

    for (const file of files) {
      if (file.size > 0) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/\s+/g, '_')}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: filename,
            Body: buffer,
            ContentType: file.type || 'application/octet-stream',
            ACL: 'public-read',
          })
        );

        urls.push(`${endpoint}/${bucket}/${filename}`);
      }
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error('Ошибка загрузки в S3:', error);
    return NextResponse.json({ error: 'Не удалось загрузить файлы' }, { status: 500 });
  }
}
