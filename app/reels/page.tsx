import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ReelUploadForm from './ReelUploadForm';
import ReelsFeed from './ReelsFeed';

export const dynamic = 'force-dynamic';

export default async function ReelsPage() {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const reels = (await db.all(`
    SELECT reels.*, users.name AS author_name, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM reel_likes WHERE reel_id = reels.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM reel_comments WHERE reel_id = reels.id) as comments_count,
    (SELECT type FROM reel_likes WHERE reel_id = reels.id AND user_id = ?) as my_vote
    FROM reels 
    JOIN users ON users.id = reels.user_id 
    ORDER BY reels.created_at DESC
  `, [userId])) as any[];

  const reelsWithComments = await Promise.all(
    reels.map(async (reel) => {
      const comments = (await db.all(`
        SELECT reel_comments.*, users.name AS author_name, users.avatar_url AS author_avatar 
        FROM reel_comments 
        JOIN users ON users.id = reel_comments.user_id 
        WHERE reel_comments.reel_id = ? 
        ORDER BY reel_comments.created_at ASC
      `, [reel.id])) as any[];
      
      return { ...reel, comments };
    })
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Рилсы</h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      <ReelUploadForm />

      <ReelsFeed reels={reelsWithComments} userId={userId} />
    </div>
  );
}
