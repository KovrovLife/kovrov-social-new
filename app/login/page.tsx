import { loginAction } from '../actions';
import Link from 'next/link';

export default function Login({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Логотип и заголовок */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl mb-4 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            С возвращением в <span className="text-blue-600">КовровLife</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Войдите, чтобы продолжить общение с соседями.
          </p>
        </div>

        {/* Форма */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl shadow-xl p-8">
          {searchParams.error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-6 text-center animate-pulse">
              {searchParams.error}
            </div>
          )}

          <form action={loginAction} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Имя или Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">👤</span>
                <input 
                  name="name" 
                  placeholder="Введите имя или email" 
                  required 
                  className="w-full border dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Пароль</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔒</span>
                <input 
                  name="password" 
                  type="password" 
                  placeholder="••••••••" 
                  required 
                  className="w-full border dark:border-gray-600 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-all" 
                />
              </div>
            </div>

            <button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl px-4 py-3.5 shadow-lg shadow-blue-500/30 transform active:scale-[0.98] transition-all mt-2">
              Войти
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:underline">
              Зарегистрироваться
            </Link>
          </div>
        </div>

        {/* Политика */}
        <p className="text-center text-xs text-gray-400 mt-6 max-w-xs mx-auto">
          Входя в аккаунт, вы соглашаетесь с{' '}
          <Link href="/legal/terms" className="underline hover:text-blue-500">Пользовательским соглашением</Link>{' '}
          и{' '}
          <Link href="/legal/privacy" className="underline hover:text-blue-500">Политикой конфиденциальности</Link>.
        </p>
      </div>
    </div>
  );
}