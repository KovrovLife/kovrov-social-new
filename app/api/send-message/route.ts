import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export async function POST(req: Request) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { receiverId, body } = await req.json();
    
    if (!receiverId || !body || !body.trim()) {
      return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
    }

    db.run('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)', [userId, receiverId, body.trim()]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}