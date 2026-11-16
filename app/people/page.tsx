import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { formatOnlineStatus } from '@/lib/status';
import { sendFriendRequest } from '../actions';

export const dynamic = 'force-dynamic';

export default function PeoplePage({ searchParams }: { searchParams: { q?: string; dist?: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');
  
  const query = searchParams.q || '';
  const distId = searchParams.dist || '';

  // Получаем список районов для фильтра
  const districts = db.prepare('SELECT * FROM districts').all() as any[];

  // Строим SQL-запрос в зависимости от фильтров
  let sql = `
    SELECT u.id, u.name, u.avatar_url, u.last_seen, d.name as district_name 
    FROM users u 
    JOIN districts d ON u.district_id = d.id
    WHERE u.id != ? AND u.is_blocked = 0
  `;
  const params: (string | number)[] = [userId];

  if (query) {
    sql += ' AND u.name LIKE ?';
    params.push(`%${query}%`);
  }
  if (distId) {
    sql += ' AND u.district_id = ?';
    params.push(Number(distId));
  }
  sql += ' ORDER BY u.last_seen DESC LIMIT 50';

  const users = db.prepare(sql).all(...params) as any[];

  // Получаем связи текущего пользователя, чтобы знать, кто уже в друзьях / кому отправлена заявка
  const myFriendships = db.prepare(`
    SELECT friend_id, status FROM friends WHERE user_id = ?
    UNION
    SELECT user_id, status FROM friends WHERE friend_id = ?
  `).all(userId, userId) as any[];

  const friendshipMap = new Map();
  myFriendships.forEach(f => {
    const otherId = f.friend_id || f.user_id;
    friendshipMap.set(otherId, f.status);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Люди
        </h1>
      </div>

      {/* Форма поиска и фильтров */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border dark:border-gray-700 shadow-sm">
        <form className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            name="q" 
            defaultValue={query} 
            placeholder="Поиск по имени..." 
            className="flex-1 border dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
          />
          <select 
            name="dist" 
            defaultValue={distId} 
            className="border dark:border-gray-600 rounded-xl px-4 py-2.5 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="">Все районы</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <button className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm">
            Найти
          </button>
        </form>
      </div>

      {/* Список пользователей */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => {
          const status = formatOnlineStatus(u.last_seen);
          const friendshipStatus = friendshipMap.get(u.id);

          return (
            <div key={u.id} className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 shadow-sm flex flex-col items-center text-center hover:shadow-md transition">
              <Link href={`/profile/${u.id}`} className="relative mb-3">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="ava" className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm" />
                ) : (
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-2xl shadow-sm">{u.name[0].toUpperCase()}</div>
                )}
                {status.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </Link>
              
              <Link href={`/profile/${u.id}`} className="font-bold text-gray-900 dark:text-white hover:text-emerald-600 transition truncate w-full">
                {u.name}
              </Link>
              <p className="text-xs text-gray-500 mb-1">📍 {u.district_name}</p>
              <p className={`text-[10px] font-medium mb-3 ${status.isOnline ? 'text-emerald-600' : 'text-gray-400'}`}>
                {status.text}
              </p>

              <div className="flex gap-2 w-full mt-auto">
                <Link href={`/messages/${u.id}`} className="flex-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition font-medium text-center">
                  Написать
                </Link>
                
                {friendshipStatus === 'accepted' ? (
                  <span className="flex-1 text-xs bg-emerald-50 text-emerald-700 py-1.5 rounded-lg font-medium text-center border border-emerald-100">
                    В друзьях
                  </span>
                ) : friendshipStatus === 'pending' ? (
                  <span className="flex-1 text-xs bg-gray-100 text-gray-500 py-1.5 rounded-lg font-medium text-center">
                    Заявка
                  </span>
                ) : (
                  <form action={sendFriendRequest} className="flex-1">
                    <input type="hidden" name="target_id" value={u.id} />
                    <button className="w-full text-xs bg-emerald-600 text-white py-1.5 rounded-lg hover:bg-emerald-700 transition font-medium shadow-sm">
                      + В друзья
                    </button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {users.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border dark:border-gray-700 text-gray-500">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">Никого не нашли.</p>
          <p className="text-sm mt-1">Попробуйте изменить запрос или фильтр по району.</p>
        </div>
      )}
    </div>
  );
}