import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserId();
  if (!userId) return NextResponse.json({ count: 0 });

  const result = (await db.get('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId])) as { count: number };
  return NextResponse.json({ count: result.count });
}