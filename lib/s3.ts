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

export async function uploadToS3(file: File, filename: string): Promise<string> {
  const bucket = process.env.S3_BUCKET || 'kovrov-life-uploads';
  const endpoint = process.env.S3_ENDPOINT || 'https://twcstorage.ru';
  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      ACL: 'public-read',
    })
  );

  return `${endpoint}/${bucket}/${filename}`;
}
