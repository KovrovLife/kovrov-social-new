import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const photoId = Number(searchParams.get('id'));
  if (!photoId) return NextResponse.json({ error: 'No ID' }, { status: 400 });

  const photo = (await db.get(
    `SELECT gallery_photos.*, users.name AS author_name, users.avatar_url AS author_avatar
     FROM gallery_photos
     JOIN users ON users.id = gallery_photos.user_id
     WHERE gallery_photos.id = ?`,
    [photoId]
  )) as any;

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const likesCountRow = (await db.get(
    'SELECT COUNT(*) as c FROM photo_likes WHERE photo_id = ? AND type = ?',
    [photoId, 'like']
  )) as any;
  const likesCount = likesCountRow?.c || 0;

  const dislikesCountRow = (await db.get(
    'SELECT COUNT(*) as c FROM photo_likes WHERE photo_id = ? AND type = ?',
    [photoId, 'dislike']
  )) as any;
  const dislikesCount = dislikesCountRow?.c || 0;

  const myVoteRow = (await db.get(
    'SELECT type FROM photo_likes WHERE photo_id = ? AND user_id = ?',
    [photoId, userId]
  )) as any;
  const myVote = myVoteRow?.type || null;

  const comments = (await db.all(
    `SELECT photo_comments.*, users.name AS author_name, users.avatar_url AS author_avatar
     FROM photo_comments
     JOIN users ON users.id = photo_comments.user_id
     WHERE photo_comments.photo_id = ?
     ORDER BY photo_comments.created_at ASC`,
    [photoId]
  )) as any[];

  return NextResponse.json({
    photo,
    likesCount,
    dislikesCount,
    myVote,
    comments,
  });
}