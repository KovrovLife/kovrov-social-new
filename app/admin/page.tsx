import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { deletePostAction, dismissReportAction, dismissUserReportAction, toggleAdminAction, toggleBlockUserAction } from '../actions';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }: { searchParams: { tab?: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const me = (await db.get('SELECT name, is_admin FROM users WHERE id = ?', [userId])) as any;
  
  if (me.is_admin !== 1) {
    return <div className="text-center py-20 text-red-600 font-bold">Доступ запрещен. Вы не администратор.</div>;
  }

  const currentTab = searchParams.tab || 'posts';

  const postReports = (await db.all(`
    SELECT r.id as report_id, r.reason, r.created_at, p.id as post_id, p.title, p.status, u.name as reporter, u.avatar_url as reporter_avatar
    FROM reports r JOIN posts p ON r.post_id = p.id JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`)) as any[];

  const userReports = (await db.all(`
    SELECT r.id as report_id, r.reason, r.created_at, u.id as target_id, u.name as target_name, u.avatar_url as target_avatar
    FROM user_reports r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC`)) as any[];

  const allUsers = (await db.all(`
    SELECT id, name, avatar_url, email, is_admin, is_blocked, block_reason, created_at FROM users ORDER BY created_at DESC`)) as any[];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Админ-панель
        </h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      {/* Вкладки */}
      <div className="flex flex-wrap gap-2">
        <Link 
          href="/admin?tab=posts" 
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentTab === 'posts' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          Жалобы на посты ({postReports.length})
        </Link>
        <Link 
          href="/admin?tab=users" 
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentTab === 'users' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          Жалобы на пользователей ({userReports.length})
        </Link>
        <Link 
          href="/admin?tab=all-users" 
          className={`px-4 py-2 rounded-xl text-sm font-medium transition ${currentTab === 'all-users' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
        >
          Все пользователи ({allUsers.length})
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Вкладка: Жалобы на посты */}
        {currentTab === 'posts' && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {postReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Жалоб на объявления нет.</div>
            ) : (
              postReports.map((r) => (
                <div key={r.report_id} className="p-5 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      {r.reporter_avatar ? <img src={r.reporter_avatar} className="w-6 h-6 rounded-full" /> : <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">{r.reporter[0]}</div>}
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{r.reporter}</span>
                      <span className="text-xs text-gray-400">• {r.created_at}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${r.status === 'closed' ? 'bg-gray-100 text-gray-600' : 'bg-emerald-100 text-emerald-700'}`}>
                      {r.status === 'closed' ? 'Закрыто' : 'Активно'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50">
                    <span className="font-semibold text-red-600">Причина:</span> {r.reason}
                  </p>
                  <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border dark:border-gray-700">
                    <span className="text-gray-500">Объявление:</span>
                    <Link href={`/post/${r.post_id}`} className="font-semibold text-emerald-600 hover:underline truncate" target="_blank">{r.title}</Link>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <form action={deletePostAction}>
                      <input type="hidden" name="post_id" value={r.post_id} />
                      <button className="text-xs bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition shadow-sm">Удалить пост</button>
                    </form>
                    <form action={dismissReportAction}>
                      <input type="hidden" name="report_id" value={r.report_id} />
                      <button className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Отклонить</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Вкладка: Жалобы на пользователей */}
        {currentTab === 'users' && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {userReports.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Жалоб на пользователей нет.</div>
            ) : (
              userReports.map((r) => (
                <div key={r.report_id} className="p-5 space-y-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                  <div className="flex justify-between items-start">
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg border border-red-100 dark:border-red-900/50 w-full">
                      <span className="font-semibold text-red-600">Причина:</span> {r.reason}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg border dark:border-gray-700">
                    <span className="text-gray-500">На пользователя:</span>
                    <Link href={`/profile/${r.target_id}`} className="font-semibold text-emerald-600 hover:underline flex items-center gap-1">
                      {r.target_avatar && <img src={r.target_avatar} className="w-5 h-5 rounded-full" />}
                      {r.target_name}
                    </Link>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <form action={dismissUserReportAction}>
                      <input type="hidden" name="report_id" value={r.report_id} />
                      <button className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition">Отклонить</button>
                    </form>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Вкладка: Все пользователи (с блокировкой) */}
        {currentTab === 'all-users' && (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {allUsers.map((u) => (
              <div key={u.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                <div className="flex items-center gap-3">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">{u.name[0]}</div>}
                  <div>
                    <Link href={`/profile/${u.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-emerald-600 flex items-center gap-2">
                      {u.name}
                      {u.is_admin === 1 && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">Админ</span>}
                      {u.is_blocked === 1 && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">Заблокирован</span>}
                    </Link>
                    <p className="text-xs text-gray-500">{u.email || 'Email не указан'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 items-center">
                  <form action={toggleAdminAction}>
                    <input type="hidden" name="target_id" value={u.id} />
                    <button className={`text-xs px-4 py-2 rounded-lg font-medium transition border ${u.is_admin === 1 ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}>
                      {u.is_admin === 1 ? 'Снять права' : 'Выдать права'}
                    </button>
                  </form>
                  
                  {u.name !== 'KovrovLife' && (
                    <form action={toggleBlockUserAction} className="flex items-center gap-1">
                      <input type="hidden" name="target_id" value={u.id} />
                      {u.is_blocked === 0 && (
                        <input type="text" name="reason" placeholder="Причина блокировки" required className="text-xs border dark:border-gray-600 rounded-lg px-2 py-1.5 w-32 bg-white dark:bg-gray-900" />
                      )}
                      <button className={`text-xs px-4 py-2 rounded-lg font-medium transition border ${u.is_blocked === 1 ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-red-600 text-white border-red-600 hover:bg-red-700'}`}>
                        {u.is_blocked === 1 ? 'Разблокировать' : 'Заблокировать'}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}