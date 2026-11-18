import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function NotificationsPage({ searchParams }: { searchParams: { filter?: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const filter = searchParams.filter || 'all';

  let sql = `
    SELECT n.*, u.name AS sender_name, u.avatar_url AS sender_avatar 
    FROM notifications n
    JOIN users u ON u.id = n.sender_id
    WHERE n.user_id = ?
  `;
  if (filter === 'unread') {
    sql += ' AND n.is_read = 0';
  }
  sql += ' ORDER BY n.created_at DESC LIMIT 50';

  const notifications = (await db.all(sql, [userId])) as any[];

  if (filter === 'all') {
    await db.run('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [userId]);
  }

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: any[] } = {
    'Сегодня': [],
    'Вчера': [],
    'Ранее': []
  };

  notifications.forEach(n => {
    const date = new Date(n.created_at);
    if (date.toDateString() === today.toDateString()) {
      groups['Сегодня'].push(n);
    } else if (date.toDateString() === yesterday.toDateString()) {
      groups['Вчера'].push(n);
    } else {
      groups['Ранее'].push(n);
    }
  });

  const getIcon = (type: string) => {
    switch (type) {
      case 'like_post':
      case 'like_photo':
      case 'like_wall':
        return { icon: '👍', color: 'bg-emerald-100 text-emerald-600' };
      case 'comment_post':
      case 'comment_photo':
      case 'comment_wall':
        return { icon: '💬', color: 'bg-blue-100 text-blue-600' };
      case 'friend_request':
      case 'friend_accept':
        return { icon: '👥', color: 'bg-purple-100 text-purple-600' };
      default:
        return { icon: '🔔', color: 'bg-gray-100 text-gray-600' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Уведомления
        </h1>
        
        <div className="flex gap-2">
          <Link 
            href="/notifications?filter=all" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'all' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Все
          </Link>
          <Link 
            href="/notifications?filter=unread" 
            className={`px-4 py-2 rounded-xl text-sm font-medium transition ${filter === 'unread' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            Непрочитанные
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="font-medium">У вас пока нет уведомлений.</p>
            <p className="text-sm mt-1">Здесь будут появляться лайки, комментарии и заявки в друзья.</p>
          </div>
        ) : (
          <div>
            {Object.entries(groups).map(([groupName, groupItems]) => {
              if (groupItems.length === 0) return null;
              
              return (
                <div key={groupName}>
                  <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    {groupName}
                  </div>
                  <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                    {groupItems.map((n) => {
                      let text = '';
                      let link = '#';
                      
                      if (n.type === 'like_post') { text = 'лайкнул ваше объявление'; link = `/post/${n.target_id}`; }
                      if (n.type === 'comment_post') { text = 'оставил комментарий к вашему объявлению'; link = `/post/${n.target_id}`; }
                      if (n.type === 'comment_photo') { text = 'оставил комментарий к вашей фотографии'; link = `/photo/${n.target_id}`; }
                      if (n.type === 'comment_wall') { text = 'оставил запись на вашей стене'; link = `/profile/${n.user_id}`; }
                      if (n.type === 'friend_request') { text = 'хочет добавить вас в друзья'; link = `/profile/${n.sender_id}`; }
                      if (n.type === 'friend_accept') { text = 'принял вашу заявку в друзья'; link = `/profile/${n.sender_id}`; }

                      const iconData = getIcon(n.type);

                      return (
                        <li key={n.id} className={`p-4 flex items-start gap-3 transition ${n.is_read === 0 ? 'bg-emerald-50/30 dark:bg-emerald-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}>
                          <div className="relative shrink-0">
                            <Link href={`/profile/${n.sender_id}`}>
                              {n.sender_avatar ? (
                                <img src={n.sender_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{n.sender_name[0]}</div>
                              )}
                            </Link>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-gray-800 ${iconData.color}`}>
                              {iconData.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                              <Link href={`/profile/${n.sender_id}`} className="font-semibold hover:text-emerald-600 transition">{n.sender_name}</Link>{' '}
                              {text}
                            </p>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                              {new Date(n.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <Link href={link} className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 text-gray-600 dark:text-gray-300 px-3 py-1.5 rounded-lg transition font-medium shrink-0">
                            Перейти
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
