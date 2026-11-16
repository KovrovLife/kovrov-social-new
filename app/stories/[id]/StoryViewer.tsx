'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function StoryViewer({ story }: { story: any }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Длительность показа истории — 15 секунд
    const DURATION = 15000; 
    const INTERVAL = 50;
    const step = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          // Закрываем историю или переходим на главную
          window.location.href = '/'; 
          return 100;
        }
        return prev + step;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-[200] flex items-center justify-center md:p-10">
      <div className="relative w-full h-full md:max-w-sm md:h-[85vh] bg-black md:rounded-lg overflow-hidden shadow-2xl flex flex-col">
        
        {/* Полоса прогресса */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2 bg-gradient-to-b from-black/60 to-transparent">
          <div className="h-1 w-full bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-75 ease-linear" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Шапка */}
        <div className="absolute top-6 left-0 right-0 p-4 z-10 flex items-center gap-3">
          {story.author_avatar ? (
            <img src={story.author_avatar} alt="ava" className="w-8 h-8 rounded-full object-cover border-2 border-white" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">{story.author_name[0]}</div>
          )}
          <div>
            <p className="text-white font-semibold text-sm shadow-sm">{story.author_name}</p>
            <p className="text-white/70 text-xs">{story.created_at}</p>
          </div>
          <Link href="/" className="ml-auto text-white/80 hover:text-white p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </Link>
        </div>

        {/* Медиа */}
        <div className="flex-1 flex items-center justify-center bg-black">
          {story.media_type === 'video' ? (
            <video src={story.media_url} autoPlay loop playsInline className="w-full h-full object-contain" />
          ) : (
            <img src={story.media_url} alt="story" className="w-full h-full object-contain" />
          )}
        </div>
      </div>
    </div>
  );
}