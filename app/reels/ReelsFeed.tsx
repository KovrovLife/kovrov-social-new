'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toggleReelLikeAction } from '../actions';
import ReelModal from './ReelModal';

export default function ReelsFeed({ reels, userId }: { reels: any[], userId: number }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  return (
    <>
      {/* Лента превью */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {reels.length === 0 && <p className="col-span-full text-center text-gray-500 py-10">Пока нет видео. Загрузите первое!</p>}
        
        {reels.map((reel, index) => (
          <div 
            key={reel.id} 
            className="relative aspect-[9/16] bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer group"
            onClick={() => {
              setInitialIndex(index);
              setIsModalOpen(true);
            }}
          >
            {/* Превью (можно использовать постер, если есть, но мы покажем просто видео без звука) */}
            <video src={reel.video_url} className="w-full h-full object-cover" muted />
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-3">
              <p className="text-white text-xs font-semibold line-clamp-2">{reel.description || 'Без описания'}</p>
              <div className="flex items-center gap-2 mt-2">
                {reel.author_avatar ? <img src={reel.author_avatar} alt="ava" className="w-5 h-5 rounded-full object-cover border border-white" /> : <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-[10px] text-white font-bold">{reel.author_name[0]}</div>}
                <span className="text-white text-[10px] font-medium">{reel.author_name}</span>
              </div>
            </div>

            <div className="absolute top-2 right-2 bg-black/40 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.32 4.625 3 7.5 3c1.53 0 3.03.748 4.004 1.978C12.48 3.748 13.98 3 15.51 3c2.875 0 5.25 2.32 5.25 5.25 0 3.924-2.438 7.11-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
              {reel.likes_count}
            </div>
          </div>
        ))}
      </div>

      {/* Модальное окно для просмотра */}
      {isModalOpen && (
        <ReelModal 
          reels={reels} 
          initialIndex={initialIndex} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}