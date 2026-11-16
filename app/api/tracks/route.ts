import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ tracks: [], myTracks: [] });

  const tracks = db.prepare('SELECT * FROM tracks ORDER BY created_at DESC').all() as any[];
  
  const myTracks = db.prepare(`
    SELECT tracks.* 
    FROM user_tracks 
    JOIN tracks ON tracks.id = user_tracks.track_id 
    WHERE user_tracks.user_id = ?
    ORDER BY user_tracks.created_at DESC
  `).all(userId) as any[];

  return NextResponse.json({ tracks, myTracks });
}

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const data = await req.formData();
  const title = data.get('title') as string;
  const artist = data.get('artist') as string;
  const fileUrl = data.get('file_url') as string;

  if (!title || !artist || !fileUrl) {
    return NextResponse.json({ error: 'Не все поля заполнены' }, { status: 400 });
  }

  db.prepare('INSERT INTO tracks (user_id, title, artist, file_url) VALUES (?, ?, ?, ?)').run(userId, title, artist, fileUrl);

  return NextResponse.json({ success: true });
}