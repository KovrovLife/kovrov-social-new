import { db } from '@/lib/db';
import { registerAction } from '../actions';
import Link from 'next/link';

export default function Register({ searchParams }: { searchParams: { error?: string } }) {
  const dists = db.prepare('SELECT * FROM districts').all() as { id: number; name: string }[];
  
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Присоединяйтесь к <span className="text-emerald-600">КовровLife</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Создайте аккаунт, чтобы общаться с соседями и узнавать новости района.
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-xl p-8">
          {searchParams.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-6 text-center animate-pulse">
              {searchParams.error}
            </div>
          )}

          <form action={registerAction} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ваше имя</label>
              <input 
                name="name" 
                placeholder="Например, Иван" 
                required 
                className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ваш Email</label>
              <input 
                name="email" 
                type="email" 
                placeholder="example@mail.ru" 
                required 
                className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
              <input 
                name="password" 
                type="password" 
                placeholder="Минимум 6 символов" 
                required 
                className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ваш район</label>
              <select 
                name="district_id" 
                required 
                className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all cursor-pointer"
              >
                <option value="">Выберите район города</option>
                {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            <button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold rounded-xl px-4 py-3.5 shadow-lg shadow-emerald-500/30 transform active:scale-[0.98] transition-all mt-2">
              Создать аккаунт
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-emerald-600 font-semibold hover:underline">
              Войти
            </Link>
          </div>
        </div>

        {/* Политика */}
        <p className="text-center text-xs text-gray-400 mt-6 max-w-xs mx-auto">
          Регистрируясь, вы соглашаетесь с{' '}
          <Link href="/legal/terms" className="underline hover:text-emerald-500">Пользовательским соглашением</Link>{' '}
          и{' '}
          <Link href="/legal/privacy" className="underline hover:text-emerald-500">Политикой конфиденциальности</Link>.
        </p>
      </div>
    </div>
  );
}