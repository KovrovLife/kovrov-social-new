'use server';
import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { setSession, clearSession, getUserId } from '@/lib/auth';
import { uploadToS3 } from '@/lib/s3';
import fs from 'fs';
import path from 'path';
import { revalidatePath } from 'next/cache';

export async function registerAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const districtId = Number(formData.get('district_id') || 0);
  
  if (name.length < 2 || password.length < 6 || !districtId) {
    redirect('/register?error=' + encodeURIComponent('Проверьте поля'));
  }
  if (!email || !email.includes('@')) {
    redirect('/register?error=' + encodeURIComponent('Введите корректный Email'));
  }

  const existsName = await db.get('SELECT id FROM users WHERE name = ?', [name]);
  if (existsName) redirect('/register?error=' + encodeURIComponent('Имя занято'));

  const existsEmail = await db.get('SELECT id FROM users WHERE email = ?', [email]);
  if (existsEmail) redirect('/register?error=' + encodeURIComponent('Этот Email уже используется'));

  const hash = bcrypt.hashSync(password, 10);
  const isAdmin = name === 'KovrovLife' ? 1 : 0;
  
  const info = await db.run(
    'INSERT INTO users (name, email, password_hash, district_id, is_admin) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [name, email, hash, districtId, isAdmin]
  );
  
  setSession(Number(info.rows[0].id));
  redirect('/');
}

export async function loginAction(formData: FormData) {
  const login = String(formData.get('name') || '').trim();
  const password = String(formData.get('password') || '');
  
  const user = await db.get('SELECT * FROM users WHERE name = ? OR email = ?', [login, login]) as any;
  
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    redirect('/login?error=' + encodeURIComponent('Неверные данные'));
  }
  setSession(user.id);
  redirect('/');
}

export async function logoutAction() { clearSession(); redirect('/'); }

export async function updateProfileAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const birthday = String(formData.get('birthday') || '').trim();
  const work = String(formData.get('work') || '').trim();
  const statusText = String(formData.get('status_text') || '').trim();
  const districtId = Number(formData.get('district_id') || 0);
  if (districtId) {
    await db.run(
      'UPDATE users SET birthday = ?, work = ?, status_text = ?, district_id = ? WHERE id = ?',
      [birthday, work, statusText, districtId, userId]
    );
  }
  redirect('/profile/' + userId);
}

export async function updateCoverAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const color = formData.get('color') as string;
  const photo = formData.get('cover_image') as File | null;
  let coverUrl = color;

  if (photo && photo.size > 0) {
    const filename = 'cover-' + userId + '-' + Date.now() + '-' + photo.name.replace(/\s+/g, '_');
    coverUrl = await uploadToS3(photo, filename);
  }

  await db.run('UPDATE users SET cover_url = ? WHERE id = ?', [coverUrl, userId]);
  redirect('/profile/' + userId);
}

export async function updateAvatarAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photo = formData.get('avatar') as File | null;
  if (photo && photo.size > 0) {
    const filename = 'avatar-' + userId + '-' + Date.now() + '-' + photo.name.replace(/\s+/g, '_');
    const avatarUrl = await uploadToS3(photo, filename);
    await db.run('UPDATE users SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
  }
  redirect('/profile/' + userId);
}

export async function uploadGalleryPhotoAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photo = formData.get('photo') as File | null;
  if (photo && photo.size > 0) {
    const filename = 'gallery-' + userId + '-' + Date.now() + '-' + photo.name.replace(/\s+/g, '_');
    const photoUrl = await uploadToS3(photo, filename);
    await db.run('INSERT INTO gallery_photos (user_id, photo_url) VALUES (?, ?)', [userId, photoUrl]);
  }
  redirect('/profile/' + userId + '?tab=photos');
}

export async function createPostAction(
  title: string, 
  body: string, 
  categoryId: number, 
  districtId: number, 
  photoUrls: string[]
) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  if (!title || !body || !categoryId || !districtId) {
    throw new Error('Заполните обязательные поля');
  }

  const info = await db.run(
    'INSERT INTO posts (user_id, category_id, district_id, title, body) VALUES (?, ?, ?, ?, ?) RETURNING id',
    [userId, categoryId, districtId, title, body]
  );
  const postId = Number(info.rows[0].id);

  if (photoUrls && photoUrls.length > 0) {
    let isFirst = true;
    for (const url of photoUrls) {
      await db.run('INSERT INTO post_photos (post_id, photo_url) VALUES (?, ?)', [postId, url]);
      if (isFirst) {
        await db.run('UPDATE posts SET photo_url = ? WHERE id = ?', [url, postId]);
        isFirst = false;
      }
    }
  }

  redirect('/post/' + postId);
}

export async function updatePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const title = String(formData.get('title') || '').trim();
  const body = String(formData.get('body') || '').trim();
  const photo = formData.get('photo') as File | null;

  const post = await db.get('SELECT * FROM posts WHERE id = ?', [postId]) as any;
  if (!post || post.user_id !== userId) redirect('/');

  let photoUrl = post.photo_url;

  if (photo && photo.size > 0) {
    const filename = Date.now() + '-' + photo.name.replace(/\s+/g, '_');
    photoUrl = await uploadToS3(photo, filename);
    
    await db.run('DELETE FROM post_photos WHERE post_id = ?', [postId]);
    await db.run('INSERT INTO post_photos (post_id, photo_url) VALUES (?, ?)', [postId, photoUrl]);
  }

  await db.run(
    'UPDATE posts SET title = ?, body = ?, photo_url = ?, updated_at = NOW() WHERE id = ?',
    [title, body, photoUrl, postId]
  );
  redirect('/post/' + postId);
}

export async function toggleLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const existing = await db.get('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]) as any;
  
  if (existing) {
    if (existing.type === 'like') await db.run('DELETE FROM likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE likes SET type = 'like' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, 'like')", [userId, postId]);
    const post = await db.get('SELECT user_id FROM posts WHERE id = ?', [postId]) as any;
    if (post && post.user_id !== userId) {
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'like_post', ?)", [post.user_id, userId, postId]);
    }
  }
  revalidatePath('/');
}
export async function toggleDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const existing = await db.get('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]) as any;
  if (existing) {
    if (existing.type === 'dislike') await db.run('DELETE FROM likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE likes SET type = 'dislike' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO likes (user_id, post_id, type) VALUES (?, ?, 'dislike')", [userId, postId]);
  }
  revalidatePath('/');
}

export async function togglePhotoLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));
  const existing = await db.get('SELECT * FROM photo_likes WHERE user_id = ? AND photo_id = ?', [userId, photoId]) as any;
  if (existing) {
    if (existing.type === 'like') await db.run('DELETE FROM photo_likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE photo_likes SET type = 'like' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO photo_likes (user_id, photo_id, type) VALUES (?, ?, 'like')", [userId, photoId]);
  }
  revalidatePath('/photo/' + photoId);
}

export async function togglePhotoDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));
  const existing = await db.get('SELECT * FROM photo_likes WHERE user_id = ? AND photo_id = ?', [userId, photoId]) as any;
  if (existing) {
    if (existing.type === 'dislike') await db.run('DELETE FROM photo_likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE photo_likes SET type = 'dislike' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO photo_likes (user_id, photo_id, type) VALUES (?, ?, 'dislike')", [userId, photoId]);
  }
  revalidatePath('/photo/' + photoId);
}

export async function closePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id') || 0);
  await db.run("UPDATE posts SET status = 'closed' WHERE id = ? AND user_id = ?", [postId, userId]);
  redirect('/post/' + postId);
}

export async function reportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id') || 0);
  const reason = String(formData.get('reason') || '').trim();
  await db.run('INSERT INTO reports (post_id, user_id, reason) VALUES (?, ?, ?)', [postId, userId, reason]);
  redirect('/post/' + postId + '?reported=1');
}

export async function addCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    await db.run('INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)', [postId, userId, body]);
    const post = await db.get('SELECT user_id FROM posts WHERE id = ?', [postId]) as any;
    if (post && post.user_id !== userId) {
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_post', ?)", [post.user_id, userId, postId]);
    }
  }
  redirect('/post/' + postId);
}

export async function addReplyCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('post_id'));
  const parentId = Number(formData.get('parent_id'));
  const body = String(formData.get('body') || '').trim();
  
  if (body) {
    await db.run('INSERT INTO comments (post_id, user_id, parent_id, body) VALUES (?, ?, ?, ?)', [postId, userId, parentId, body]);
    const post = await db.get('SELECT user_id FROM posts WHERE id = ?', [postId]) as any;
    if (post && post.user_id !== userId) {
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_post', ?)", [post.user_id, userId, postId]);
    }
    const parentComment = await db.get('SELECT user_id FROM comments WHERE id = ?', [parentId]) as any;
    if (parentComment && parentComment.user_id !== userId) {
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'reply_comment', ?)", [parentComment.user_id, userId, postId]);
    }
  }
  redirect('/post/' + postId);
}

export async function addPhotoCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) throw new Error('Unauthorized');
  
  const photoId = Number(formData.get('photo_id'));
  const body = String(formData.get('body') || '').trim();
  
  if (body) {
    await db.run('INSERT INTO photo_comments (photo_id, user_id, body) VALUES (?, ?, ?)', [photoId, userId, body]);
    const photo = await db.get('SELECT user_id FROM gallery_photos WHERE id = ?', [photoId]) as any;
    if (photo && photo.user_id !== userId) {
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_photo', ?)", [photo.user_id, userId, photoId]);
    }
  }
  return { success: true };
}

export async function sendMessageAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const receiverId = Number(formData.get('receiver_id'));
  const body = String(formData.get('body') || '').trim();
  if (body && userId !== receiverId) {
    await db.run('INSERT INTO messages (sender_id, receiver_id, body) VALUES (?, ?, ?)', [userId, receiverId, body]);
  }
  redirect('/messages/' + receiverId);
}

export async function markMessagesAsRead(receiverId: number, senderId: number) {
  await db.run('UPDATE messages SET is_read = 1 WHERE receiver_id = ? AND sender_id = ?', [receiverId, senderId]);
}

export async function deletePostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = await db.get('SELECT name FROM users WHERE id = ?', [userId]) as any;
  if (!me || me.name !== 'KovrovLife') redirect('/');
  const postId = Number(formData.get('post_id') || 0);
  await db.run('DELETE FROM reports WHERE post_id = ?', [postId]);
  await db.run('DELETE FROM posts WHERE id = ?', [postId]);
  redirect('/admin');
}

export async function dismissReportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = await db.get('SELECT name FROM users WHERE id = ?', [userId]) as any;
  if (!me || me.name !== 'KovrovLife') redirect('/');
  const reportId = Number(formData.get('report_id') || 0);
  await db.run('DELETE FROM reports WHERE id = ?', [reportId]);
  redirect('/admin');
}

export async function sendFriendRequest(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const targetId = Number(formData.get('target_id'));
  
  if (userId !== targetId) {
    const existing = await db.get('SELECT * FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)', [userId, targetId, targetId, userId]);
    
    if (!existing) {
      await db.run('INSERT INTO friends (user_id, friend_id) VALUES (?, ?)', [userId, targetId]);
      await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'friend_request', ?)", [targetId, userId, userId]);
    }
  }
  redirect('/profile/' + targetId);
}

export async function acceptFriendRequest(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const requestId = Number(formData.get('request_id'));
  const request = await db.get('SELECT * FROM friends WHERE id = ?', [requestId]) as any;
  
  if (request && request.friend_id === userId) {
    await db.run("UPDATE friends SET status = 'accepted' WHERE id = ?", [requestId]);
    await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'friend_accept', ?)", [request.user_id, userId, userId]);
    
    redirect('/profile/' + request.user_id);
  }
  
  redirect('/');
}

export async function reportUserAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const targetId = Number(formData.get('target_id'));
  const reason = String(formData.get('reason') || '').trim();
  if (userId !== targetId && reason) {
    await db.run('INSERT INTO user_reports (user_id, reason) VALUES (?, ?)', [targetId, reason]);
  }
  redirect('/profile/' + targetId + '?reported=1');
}

export async function dismissUserReportAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = await db.get('SELECT name FROM users WHERE id = ?', [userId]) as any;
  if (!me || me.name !== 'KovrovLife') redirect('/');
  const reportId = Number(formData.get('report_id') || 0);
  await db.run('DELETE FROM user_reports WHERE id = ?', [reportId]);
  redirect('/admin');
}

export async function toggleAdminAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const me = await db.get('SELECT name FROM users WHERE id = ?', [userId]) as any;
  if (!me || me.name !== 'KovrovLife') redirect('/');
  const targetId = Number(formData.get('target_id'));
  const targetUser = await db.get('SELECT is_admin, name FROM users WHERE id = ?', [targetId]) as any;
  if (targetUser && targetUser.name !== 'KovrovLife') {
    const newStatus = targetUser.is_admin === 1 ? 0 : 1;
    await db.run('UPDATE users SET is_admin = ? WHERE id = ?', [newStatus, targetId]);
  }
  redirect('/profile/' + targetId);
}
export async function createWallPostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const ownerId = Number(formData.get('owner_id'));
  const body = String(formData.get('body') || '').trim();
  if (body && ownerId) {
    await db.run('INSERT INTO wall_posts (owner_id, author_id, body) VALUES (?, ?, ?)', [ownerId, userId, body]);
  }
  redirect('/profile/' + ownerId);
}

export async function toggleWallLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const existing = await db.get('SELECT * FROM wall_likes WHERE user_id = ? AND wall_post_id = ?', [userId, wallPostId]) as any;
  if (existing) {
    if (existing.type === 'like') await db.run('DELETE FROM wall_likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE wall_likes SET type = 'like' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO wall_likes (user_id, wall_post_id, type) VALUES (?, ?, 'like')", [userId, wallPostId]);
  }
  revalidatePath('/profile');
}

export async function toggleWallDislikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const existing = await db.get('SELECT * FROM wall_likes WHERE user_id = ? AND wall_post_id = ?', [userId, wallPostId]) as any;
  if (existing) {
    if (existing.type === 'dislike') await db.run('DELETE FROM wall_likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE wall_likes SET type = 'dislike' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO wall_likes (user_id, wall_post_id, type) VALUES (?, ?, 'dislike')", [userId, wallPostId]);
  }
  revalidatePath('/profile');
}

export async function addWallCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const wallPostId = Number(formData.get('wall_post_id'));
  const ownerId = Number(formData.get('owner_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    await db.run('INSERT INTO wall_comments (wall_post_id, user_id, body) VALUES (?, ?, ?)', [wallPostId, userId, body]);
    const post = await db.get('SELECT owner_id, author_id FROM wall_posts WHERE id = ?', [wallPostId]) as any;
    if (post) {
      if (post.owner_id !== userId) {
        await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_wall', ?)", [post.owner_id, userId, wallPostId]);
      } else if (post.author_id !== userId && post.author_id !== post.owner_id) {
        await db.run("INSERT INTO notifications (user_id, sender_id, type, target_id) VALUES (?, ?, 'comment_wall', ?)", [post.author_id, userId, wallPostId]);
      }
    }
  }
  redirect('/profile/' + ownerId);
}

export async function deleteWallPostAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const postId = Number(formData.get('wall_post_id'));
  const ownerId = Number(formData.get('owner_id'));
  const post = await db.get('SELECT * FROM wall_posts WHERE id = ?', [postId]) as any;
  if (post && (post.author_id === userId || post.owner_id === userId)) {
    await db.run('DELETE FROM wall_posts WHERE id = ?', [postId]);
  }
  redirect('/profile/' + ownerId);
}

export async function markNotificationsReadAction() {
  const userId = getUserId();
  if (!userId) redirect('/login');
  await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
  redirect('/notifications');
}

export async function createReelAction(description: string, videoUrl: string) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  if (!videoUrl) throw new Error('Видео не загружено');

  await db.run('INSERT INTO reels (user_id, video_url, description) VALUES (?, ?, ?)', [userId, videoUrl, description]);
  redirect('/reels');
}

export async function toggleReelLikeAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const reelId = Number(formData.get('reel_id'));
  const existing = await db.get('SELECT * FROM reel_likes WHERE user_id = ? AND reel_id = ?', [userId, reelId]) as any;
  
  if (existing) {
    if (existing.type === 'like') await db.run('DELETE FROM reel_likes WHERE id = ?', [existing.id]);
    else await db.run("UPDATE reel_likes SET type = 'like' WHERE id = ?", [existing.id]);
  } else {
    await db.run("INSERT INTO reel_likes (user_id, reel_id, type) VALUES (?, ?, 'like')", [userId, reelId]);
  }
  revalidatePath('/reels');
}

export async function createStoryAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  
  const mediaUrl = String(formData.get('mediaUrl') || '');
  const mediaType = String(formData.get('mediaType') || 'photo');

  if (!mediaUrl) throw new Error('Файл не загружен');

  await db.run('INSERT INTO stories (user_id, media_url, media_type) VALUES (?, ?, ?)', [userId, mediaUrl, mediaType]);
  redirect('/');
}

export async function addReelCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const reelId = Number(formData.get('reel_id'));
  const body = String(formData.get('body') || '').trim();
  if (body) {
    await db.run('INSERT INTO reel_comments (reel_id, user_id, body) VALUES (?, ?, ?)', [reelId, userId, body]);
  }
  redirect('/reels');
}

export async function uploadTrackAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const title = String(formData.get('title') || '').trim();
  const artist = String(formData.get('artist') || '').trim();
  const file = formData.get('file') as File | null;

  if (!title || !artist || !file || file.size === 0) {
    throw new Error('Заполните название, исполнителя и выберите файл');
  }

  const filename = 'track-' + userId + '-' + Date.now() + '-' + file.name.replace(/\s+/g, '_');
  const fileUrl = await uploadToS3(file, filename);

  await db.run('INSERT INTO tracks (user_id, title, artist, file_url) VALUES (?, ?, ?, ?)', [userId, title, artist, fileUrl]);
  redirect('/music');
}

export async function addTrackToMyMusicAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const trackId = Number(formData.get('track_id'));
  
  const existing = await db.get('SELECT * FROM user_tracks WHERE user_id = ? AND track_id = ?', [userId, trackId]);
  if (!existing) {
    await db.run('INSERT INTO user_tracks (user_id, track_id) VALUES (?, ?)', [userId, trackId]);
  }
  redirect('/music');
}

export async function removeTrackFromMyMusicAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const trackId = Number(formData.get('track_id'));
  
  await db.run('DELETE FROM user_tracks WHERE user_id = ? AND track_id = ?', [userId, trackId]);
  redirect('/music');
}

export async function deletePhotoCommentAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) throw new Error('Unauthorized');
  const commentId = Number(formData.get('comment_id'));
  
  const comment = await db.get('SELECT * FROM photo_comments WHERE id = ?', [commentId]) as any;
  if (comment && comment.user_id === userId) {
    await db.run('DELETE FROM photo_comments WHERE id = ?', [commentId]);
  }
  return { success: true };
}

export async function deleteGalleryPhotoAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  const photoId = Number(formData.get('photo_id'));

  const photo = await db.get('SELECT * FROM gallery_photos WHERE id = ? AND user_id = ?', [photoId, userId]) as any;
  
  if (photo) {
    if (photo.photo_url.startsWith('/uploads')) {
      const filePath = path.join(process.cwd(), 'public', photo.photo_url);
      try {
        await fs.promises.unlink(filePath);
      } catch (e) {
        console.error("Не удалось удалить файл с диска:", e);
      }
    }
    
    await db.run('DELETE FROM gallery_photos WHERE id = ?', [photoId]);
  }

  redirect('/profile/' + userId + '?tab=photos');
}

export async function toggleBlockUserAction(formData: FormData) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  
  const me = await db.get('SELECT name, is_admin FROM users WHERE id = ?', [userId]) as any;
  if (!me || me.is_admin !== 1) redirect('/');
  
  const targetId = Number(formData.get('target_id'));
  const reason = String(formData.get('reason') || '').trim();
  
  const targetUser = await db.get('SELECT is_blocked, name FROM users WHERE id = ?', [targetId]) as any;
  if (targetUser && targetUser.name !== 'KovrovLife') {
    const newStatus = targetUser.is_blocked === 1 ? 0 : 1;
    await db.run('UPDATE users SET is_blocked = ?, block_reason = ? WHERE id = ?', [newStatus, newStatus === 1 ? reason : null, targetId]);
  }
  
  redirect('/admin?tab=all-users');
}
