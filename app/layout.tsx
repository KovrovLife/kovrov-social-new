import './globals.css';
import Link from 'next/link';
import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { logoutAction } from './actions';
import { Inter } from 'next/font/google';
import type { Viewport } from 'next';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from 'next-themes';
import NotificationCenter from './components/NotificationCenter';
import ThemeToggle from './components/ThemeToggle';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });
export const metadata = {
  title: 'КовровLife',
  description: 'Городская соцсеть города Ковров',
  manifest: '/manifest.webmanifest',
};
export const viewport: Viewport = {
  themeColor: '#10b981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const bottomNavItems = [
  { key: 'home', label: 'Главная', icon: 'M11 15h.01M15 10a5 5 0 01-10 0 5 5 0 0110 0z', path: '/' },
  { key: 'reels', label: 'Рилсы', icon: 'M12 19l9 2-9-.5L23 22l-2-3-2 3h-2.8l-.5.3L12 19zM5 13a2 2 0 100-4 2 2 0 000 4zM19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14-2a4 4 0 01-4 4 4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v14a4 4 0 01-4 4z', path: '/reels' },
  { key: 'new', label: 'Новое', icon: 'M12 5v.01M12a1 1 0 110 2 1 1 0 010-2zm0 12a1 1 0 100 2 1 1 0 010-2zm0-8a1 1 0 100-2 1 1 0 010 2z', path: '/new' },
  { key: 'music', label: 'Музыка', icon: 'M8.75 5a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zM5 12a2 2 0 100-4 2 2 0 000 4zm3.5 3.5a.75.75 0 000-1.5.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5zm5 0a.75.75 0 000-1.5.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5zM15.75 5a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zm3.75 6.75a.75.75 0 000-1.5.75.75 0 00-.75.75v5a.75.75 0 001.5 0v-5zm0-8a.75.75 0 000-1.5.75.75 0 00-.75.75v13a.75.75 0 001.5 0v-5z', path: '/music' },
  { key: 'profile', label: 'Профиль', icon: 'M16 7a4 4 0 10-8 0 4 4 0 008 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', path: '/profile/[[id]]' },
];

const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const userId = getUserId();
  const user = userId
    ? ((await db.get('SELECT id, name, avatar_url, is_admin, is_blocked, block_reason FROM users WHERE id = ?', [userId])) as any)
    : undefined;

  // ПРОВЕРКА НА БЛОКИРОВКУ
  if (user && user.is_blocked === 1) {
    return (
      <html lang="ru">
        <body className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center border dark:border-gray-700">
            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Аккаунт заблокирован</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {user.block_reason ? `Причина: ${user.block_reason}` : 'Ваш аккаунт был заблокирован администратором за нарушение правил.'}
            </p>
            <p className="text-sm text-gray-400">Если вы считаете, что это ошибка, свяжитесь с поддержкой.</p>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="ru" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col min-h-screen transition-colors duration-300 ${isMobile ? 'pb-0' : 'pb-16'}`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>

          {isMobile && (
            <nav
              className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t dark:border-gray-700 z-50 flex justify-around items-center py-2 pb-safe"
            >
              {bottomNavItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.path}
                  className="flex flex-col items-center text-gray-500 dark:text-gray-400 hover:text-emerald-500 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-6 h-6 mb-1"
                  >
                    <path d={item.icon} />
                  </svg>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {!isMobile && (
            <>
            <header className="bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-800 dark:to-teal-900 text-white shadow-md sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-3xl mx-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3">
              
              <Link href="/" className="flex items-center gap-2 group shrink-0">
                <div className="bg-white text-emerald-600 rounded-xl p-1 sm:p-1.5 shadow-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>
                </div>
                <span className="text-lg sm:text-xl tracking-tight flex items-baseline">
                  <span className="font-light hidden sm:inline">Ковров</span>
                  <span className="font-extrabold">Life</span>
                </span>
              </Link>
              
              <div className="flex-1" />
              
              {user ? (
                <>
                  {user.is_admin === 1 && (
                    <Link href="/admin" className="hidden lg:block text-sm font-medium bg-emerald-700/50 hover:bg-emerald-700 px-3 py-1.5 rounded-full transition whitespace-nowrap">
                      Админка
                    </Link>
                  )}
                  
                  <Link href="/people" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-90"><path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 18a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" /></svg>
                    <span className="hidden md:block">Люди</span>
                  </Link>

                  <Link href="/reels" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90"><path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zm4.125 3.375a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06L12.44 12 8.625 8.185a.75.75 0 010-1.06z" /></svg>
                    <span className="hidden md:block">Рилсы</span>
                  </Link>

                  <Link href="/music" className="hidden sm:flex items-center gap-1.5 text-sm font-medium bg-emerald-600/30 hover:bg-emerald-600/60 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 opacity-90"><path fillRule="evenodd" d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z" clipRule="evenodd" /></svg>
                    <span className="hidden md:block">Музыка</span>
                  </Link>

                  <NotificationCenter />

                  <ThemeToggle />

                  <Link href={`/profile/${user.id}`} className="flex items-center gap-2 hover:bg-emerald-600/50 p-1 rounded-full transition shrink-0">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Аватар" className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-white text-emerald-600 flex items-center justify-center font-bold text-sm shadow-sm">{user.name[0].toUpperCase()}</div>
                    )}
                    <span className="hidden md:block text-sm font-medium pr-2">{user.name}</span>
                  </Link>

                  <form action={logoutAction} className="hidden sm:block"><button className="text-sm text-emerald-100 hover:text-white ml-1 whitespace-nowrap">Выйти</button></form>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium hover:text-emerald-100 transition whitespace-nowrap">Войти</Link>
                  <Link href="/register" className="text-sm bg-white text-emerald-600 px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-full font-medium hover:bg-emerald-50 transition whitespace-nowrap">Регистрация</Link>
                  <ThemeToggle />
                </>
              )}
            </div>
          </header>
          </>)}
          
          <main className="pt-20">{children}</main>

          <ScrollToTop />

        </ThemeProvider>
      </body>
    </html>
  );
}