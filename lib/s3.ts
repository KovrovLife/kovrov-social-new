import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function uploadToS3(file: File, filename: string): Promise<string> {
  const bucket = 'kovrov-life-uploads';
  const endpoint = 'https://twcstorage.ru';
  const region = 'ru-1';
  const accessKeyId = (process.env.S3_ACCESS_KEY || '').trim();
  const secretAccessKey = (process.env.S3_SECRET_KEY || '').trim();

  if (!accessKeyId || !secretAccessKey) {
    throw new Error('Не заданы ключи S3_ACCESS_KEY или S3_SECRET_KEY');
  }

  const s3Client = new S3Client({
    region,
    endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  await s3Client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: filename,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
    })
  );

  return endpoint + '/' + bucket + '/' + filename;
}
