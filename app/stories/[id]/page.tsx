import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import StoryViewer from './StoryViewer';

export default async function StoryViewPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const storyId = Number(params.id);
  if (isNaN(storyId)) notFound();

  const story = (await db.get(`
    SELECT stories.*, users.name AS author_name, users.avatar_url AS author_avatar 
    FROM stories 
    JOIN users ON users.id = stories.user_id 
    WHERE stories.id = ?
  `, [storyId])) as any;

  if (!story) notFound();

  return <StoryViewer story={story} />;
}