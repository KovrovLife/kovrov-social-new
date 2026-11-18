import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function GET(req: Request) {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const chatId = Number(searchParams.get('chatId'));
  if (!chatId) return NextResponse.json({ error: 'Bad Request' }, { status: 400 });

  db.run('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?', [userId, chatId]);
  
  return NextResponse.json({ success: true });
}