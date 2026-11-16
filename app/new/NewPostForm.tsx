'use client';

import { useState, useRef } from 'react';
import { createPostAction } from '../actions';

export default function NewPostForm({ cats, dists, defaultDistrictId }: { cats: any[], dists: any[], defaultDistrictId: number }) {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const form = e.currentTarget;
    const title = (form.elements.namedItem('title') as HTMLInputElement).value;
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement).value;
    const districtId = (form.elements.namedItem('district_id') as HTMLSelectElement).value;

    if (!selectedCategory) {
      setError('Выберите категорию');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. Загружаем файлы на сервер
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));

      let photoUrls: string[] = [];
      if (files.length > 0) {
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        const uploadData = await uploadRes.json();
        photoUrls = uploadData.urls || [];
      }

      // 2. Создаем пост
      await createPostAction(title, body, Number(selectedCategory), Number(districtId), photoUrls);
    } catch (err: any) {
      setError(err.message || 'Ошибка при создании объявления');
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm p-3 rounded-xl border border-red-200 dark:border-red-800">
          ⚠️ {error}
        </div>
      )}
      
      {/* Заголовок */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Заголовок</label>
        <input 
          name="title" 
          placeholder="Например: Отдам диван в хорошем состоянии" 
          required 
          className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition" 
        />
      </div>
      
      {/* Описание */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Описание</label>
        <textarea 
          name="body" 
          placeholder="Расскажите подробнее о вашем объявлении..." 
          required 
          rows={5} 
          className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition resize-none" 
        />
      </div>

      {/* Категории (плитки) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Категория</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {cats.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedCategory(c.id.toString())}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition border ${
                selectedCategory === c.id.toString()
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-700'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <input type="hidden" name="category_id" value={selectedCategory} required />
      </div>

      {/* Район */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Район</label>
        <select 
          name="district_id" 
          required 
          defaultValue={defaultDistrictId} 
          className="w-full border dark:border-gray-600 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition cursor-pointer"
        >
          {dists.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Фотографии */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Фотографии</label>
        
        <input type="file" accept="image/*" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
            {previews.map((src, idx) => (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border dark:border-gray-600 group">
                <img src={src} alt="preview" className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removePhoto(idx)} 
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <button 
          type="button" 
          onClick={() => fileInputRef.current?.click()} 
          className="flex flex-col items-center justify-center gap-2 w-full py-8 border-2 border-dashed border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition font-medium"
        >
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          </div>
          <span className="text-sm">{previews.length === 0 ? 'Добавить фото' : 'Добавить еще фото'}</span>
          <span className="text-xs text-gray-400">Можно выбрать несколько</span>
        </button>
      </div>
      
      {/* Кнопка отправки */}
      <button 
        disabled={isSubmitting} 
        className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-xl px-4 py-3.5 font-bold shadow-lg shadow-emerald-500/30 transform active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
      >
        {isSubmitting ? (
          <>
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Публикуем...
          </>
        ) : (
          'Опубликовать'
        )}
      </button>
    </form>
  );
}