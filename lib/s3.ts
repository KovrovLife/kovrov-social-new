import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadToS3(file: File, filename: string): Promise<string> {
  const s3Client = new S3Client({
    region: 'ru-1',
    endpoint: 'https://s3.twcstorage.ru',
    credentials: {
      accessKeyId: (process.env.S3_ACCESS_KEY || '').trim(),
      secretAccessKey: (process.env.S3_SECRET_KEY || '').trim(),
    },
    forcePathStyle: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: 'kovrov-life-uploads',
      Key: filename,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    })
  );

  return 'https://s3.twcstorage.ru/kovrov-life-uploads/' + filename;
}
