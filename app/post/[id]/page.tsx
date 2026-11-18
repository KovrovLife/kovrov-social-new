import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { notFound } from 'next/navigation';
import { closePostAction, reportAction, toggleLikeAction, toggleDislikeAction, addReplyCommentAction } from '../../actions';
import Link from 'next/link';
import UserBadge from '@/app/components/UserBadge';
import CommentForm from './CommentForm';
import EditPostForm from './EditPostForm';

export const dynamic = 'force-dynamic';

export default async function PostPage({ params, searchParams }: { params: { id: string }; searchParams: { reported?: string; edit?: string } }) {
  const userId = getUserId();
  const postId = Number(params.id);
  if (isNaN(postId)) notFound();

  const post = (await db.get(`
    SELECT posts.*, categories.name AS cat_name, categories.slug AS cat_slug, districts.name AS dist_name, users.id AS author_id, users.name AS author, users.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND type = 'like') as likes_count,
    (SELECT COUNT(*) FROM likes WHERE post_id = posts.id AND type = 'dislike') as dislikes_count
    FROM posts 
    JOIN categories ON categories.id = posts.category_id 
    JOIN districts ON districts.id = posts.district_id 
    JOIN users ON users.id = posts.user_id 
    WHERE posts.id = ?
  `, [postId])) as any;

  if (!post) return <div className="text-center py-20 text-gray-500">Объявление не найдено</div>;

  const postPhotos = (await db.all('SELECT photo_url FROM post_photos WHERE post_id = ?', [postId])) as { photo_url: string }[];
  const myVoteRow = userId ? ((await db.get('SELECT type FROM likes WHERE post_id = ? AND user_id = ?', [postId, userId])) as any) : null;
  const myVote = myVoteRow?.type || null;
  
  const allComments = (await db.all(`
    SELECT comments.*, users.name AS author, users.avatar_url AS author_avatar 
    FROM comments 
    JOIN users ON users.id = comments.user_id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at ASC
  `, [postId])) as any[];

  const rootComments = allComments.filter(c => !c.parent_id);
  const getReplies = (parentId: number) => allComments.filter(c => c.parent_id === parentId);

  const isAuthor = userId === post.user_id;
  const closed = post.status === 'closed';
  const isEditing = isAuthor && searchParams.edit === 'true';

  const similarPosts = (await db.all(`
    SELECT id, title, photo_url, created_at FROM posts 
    WHERE category_id = ? AND id != ? AND status = 'active' 
    ORDER BY created_at DESC LIMIT 4
  `, [post.category_id, post.id])) as any[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <article className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-8 space-y-5 shadow-sm">
        {closed && (
          <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-xl inline-block font-medium text-sm">
            🔒 Объявление закрыто
          </div>
        )}
        
        {isEditing ? (
          <EditPostForm post={post} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <Link href={`/?cat=${post.cat_slug}`} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full font-medium hover:bg-emerald-100 transition">
                {post.cat_name}
              </Link>
              <span className="flex items-center gap-1">📍 {post.dist_name}</span>
              <span>•</span>
              <div className="flex items-center gap-2">
                {post.author_avatar ? <img src={post.author_avatar} alt="ava" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px] font-bold">{post.author[0]}</div>}
                {userId && userId !== post.author_id ? <UserBadge userId={post.author_id} name={post.author} /> : <span className="font-medium text-gray-700 dark:text-gray-300">{post.author}</span>}
              </div>
              <span>•</span>
              <span>{new Date(post.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
              {post.updated_at && <span className="text-gray-400">(ред.)</span>}
            </div>
            
            <h1 className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white break-words leading-tight">{post.title}</h1>
            
            {postPhotos.length > 0 ? (
              <div className="space-y-3">
                <a href={postPhotos[0].photo_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 group">
                  <img src={postPhotos[0].photo_url} alt={post.title} className="w-full max-h-[500px] object-contain group-hover:scale-[1.02] transition duration-500" />
                </a>
                {postPhotos.length > 1 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {postPhotos.slice(1).map((photo, idx) => (
                      <a href={photo.photo_url} target="_blank" rel="noopener noreferrer" key={idx} className="block aspect-square rounded-lg overflow-hidden border dark:border-gray-600 hover:opacity-80 transition">
                        <img src={photo.photo_url} alt="" className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ) : post.photo_url ? (
              <a href={post.photo_url} target="_blank" rel="noopener noreferrer" className="block rounded-xl overflow-hidden border dark:border-gray-600 bg-gray-50 dark:bg-gray-900 group">
                <img src={post.photo_url} alt={post.title} className="w-full max-h-[500px] object-contain group-hover:scale-[1.02] transition duration-500" />
              </a>
            ) : null}

            <p className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed break-words text-sm sm:text-base">{post.body}</p>
            
            <div className="pt-5 border-t dark:border-gray-700 flex flex-wrap items-center gap-3">
              <div className="flex gap-2 sm:gap-3">
                <form action={toggleLikeAction}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${myVote === 'like' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                    👍 {post.likes_count}
                  </button>
                </form>
                <form action={toggleDislikeAction}>
                  <input type="hidden" name="post_id" value={post.id} />
                  <button className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition ${myVote === 'dislike' ? 'bg-red-50 text-red-600 dark:bg-red-900/30' : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-red-50 hover:text-red-600'}`}>
                    👎 {post.dislikes_count}
                  </button>
                </form>
              </div>

              {isAuthor && !closed && (
                <div className="ml-auto flex gap-2">
                  <Link href={`/post/${post.id}?edit=true`} className="text-xs sm:text-sm border border-emerald-200 text-emerald-600 rounded-xl px-4 py-2 hover:bg-emerald-50 transition font-medium">Редактировать</Link>
                  <form action={closePostAction}>
                    <input type="hidden" name="post_id" value={post.id} />
                    <button className="text-xs sm:text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition font-medium">Закрыть</button>
                  </form>
                </div>
              )}
            </div>
          </>
        )}
      </article>
      {!isAuthor && userId && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-5 shadow-sm">
          {searchParams.reported ? (
            <p className="text-sm text-emerald-600 font-medium">Спасибо, жалоба отправлена модератору.</p>
          ) : (
            <form action={reportAction} className="flex flex-col sm:flex-row gap-2">
              <input type="hidden" name="post_id" value={post.id} />
              <input type="text" name="reason" required placeholder="Пожаловаться на объявление (укажите причину)..." className="flex-1 border dark:border-gray-600 rounded-xl px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-red-400" />
              <button className="text-xs sm:text-sm text-red-600 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 px-4 py-2 rounded-xl font-medium transition shrink-0">Пожаловаться</button>
            </form>
          )}
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Комментарии ({allComments.length})</h2>
        
        <div className="space-y-4 mb-6">
          {rootComments.length === 0 && <p className="text-sm text-gray-500">Пока нет комментариев. Будьте первым!</p>}
          
          {rootComments.map((c) => {
            const replies = getReplies(c.id);
            return (
              <div key={c.id} className="space-y-2">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-xl border dark:border-gray-700 text-sm flex gap-3">
                  {c.author_avatar ? <img src={c.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" /> : <div className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold shrink-0 mt-0.5">{c.author[0]}</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <Link href={`/profile/${c.user_id}`} className="font-bold text-gray-800 dark:text-gray-200 hover:text-emerald-600">{c.author}</Link>
                      <span>{new Date(c.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{c.body}</p>
                    
                    {userId && (
                      <details className="mt-2">
                        <summary className="text-xs text-emerald-600 cursor-pointer hover:underline select-none">Ответить</summary>
                        <form action={addReplyCommentAction} className="mt-2 flex gap-2">
                          <input type="hidden" name="post_id" value={post.id} />
                          <input type="hidden" name="parent_id" value={c.id} />
                          <input type="text" name="body" required placeholder="Ваш ответ..." className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white outline-none" />
                          <button className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg hover:bg-emerald-700">Отправить</button>
                        </form>
                      </details>
                    )}
                  </div>
                </div>

                {replies.length > 0 && (
                  <div className="pl-6 sm:pl-10 space-y-2">
                    {replies.map((r) => (
                      <div key={r.id} className="bg-gray-50/70 dark:bg-gray-900/30 p-3 rounded-xl border dark:border-gray-700/70 text-sm flex gap-2.5">
                        {r.author_avatar ? <img src={r.author_avatar} alt="ava" className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" /> : <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{r.author[0]}</div>}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between text-xs text-gray-500 mb-1">
                            <Link href={`/profile/${r.user_id}`} className="font-bold text-gray-800 dark:text-gray-200 hover:text-emerald-600">{r.author}</Link>
                            <span>{new Date(r.created_at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words">{r.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {userId ? (
          <CommentForm postId={post.id} />
        ) : (
          <p className="text-sm text-gray-500 text-center py-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border dark:border-gray-700">
            <Link href="/login" className="text-emerald-600 font-medium hover:underline">Войдите</Link>, чтобы оставить комментарий.
          </p>
        )}
      </div>

      {similarPosts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="font-bold text-base mb-3 text-gray-900 dark:text-white">Похожие объявления</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {similarPosts.map((p) => (
              <Link key={p.id} href={`/post/${p.id}`} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group border dark:border-gray-700/50">
                {p.photo_url ? (
                  <img src={p.photo_url} alt={p.title} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 shrink-0 text-lg">📌</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-gray-900 dark:text-white truncate group-hover:text-emerald-600 transition">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(p.created_at).toLocaleDateString('ru-RU')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
