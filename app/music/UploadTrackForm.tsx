'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UploadTrackForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      setError('Выберите файл');
      setIsUploading(false);
      return;
    }

    try {
      // 1. Загружаем файл
      const uploadRes = await fetch('/api/upload-track', {
        method: 'POST',
        body: formData,
      });
      
      const uploadData = await uploadRes.json();
      if (uploadData.error) throw new Error(uploadData.error);

      // 2. Сохраняем в базу
      const trackData = new FormData();
      trackData.append('title', formData.get('title') as string);
      trackData.append('artist', formData.get('artist') as string);
      trackData.append('file_url', uploadData.url);

      const res = await fetch('/api/tracks', {
        method: 'POST',
        body: trackData,
      });

      if (!res.ok) throw new Error('Ошибка сохранения трека');

      // 3. Обновляем страницу (чтобы увидеть новый трек)
      router.refresh();
      (e.target as HTMLFormElement).reset();
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 shadow-sm">
      <h2 className="text-lg font-bold mb-3 text-gray-900 dark:text-white">Загрузить трек</h2>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input name="title" placeholder="Название" required className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        <input name="artist" placeholder="Исполнитель" required className="border dark:border-gray-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-white" />
        <input type="file" name="file" accept="audio/*" required className="text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
        
        <button 
          disabled={isUploading}
          className="sm:col-span-3 bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-md hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isUploading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Загрузка...
            </>
          ) : 'Загрузить'}
        </button>
      </form>
    </div>
  );
}