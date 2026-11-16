'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { toggleReelLikeAction } from '../actions';
import ReelCommentsModal from '@/app/components/ReelCommentsModal';

export default function ReelModal({ reels, initialIndex, onClose }: { reels: any[], initialIndex: number, onClose: () => void }) {
  const [activeComments, setActiveComments] = useState<{ reelId: number, comments: any[] } | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      containerRef.current.scrollTop = height * initialIndex;
    }
  }, [initialIndex]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const scrollPosition = container.scrollTop;
    const height = container.clientHeight;
    const newIndex = Math.round(scrollPosition / height);
    
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < reels.length) {
      setCurrentIndex(newIndex);
    }
  };

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentIndex) {
          video.play().catch(e => console.log("Autoplay:", e));
        } else {
          video.pause();
          video.currentTime = 0;
        }
      }
    });
  }, [currentIndex]);

  return (
    <div className="fixed inset-0 bg-black/95 z-[200] flex items-center justify-center backdrop-blur-md">
      <div className="relative w-full max-w-sm h-[90vh] bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        
        {/* Кнопка закрытия */}
        <button 
          onClick={() => {
            if (videoRefs.current[currentIndex]) videoRefs.current[currentIndex]?.pause();
            onClose();
          }} 
          className="absolute top-4 right-4 z-50 text-white/90 hover:text-white bg-white/10 hover:bg-white/20 p-2.5 rounded-full backdrop-blur-md transition shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Контейнер с вертикальной прокруткой */}
        <div 
          ref={containerRef}
          className="h-full w-full overflow-y-auto snap-y snap-mandatory scrollbar-hide"
          onScroll={handleScroll}
        >
          {reels.map((reel, index) => {
            const myLike = reel.my_vote === 'like';
            return (
              <div 
                key={reel.id} 
                className="snap-start h-full w-full flex items-center justify-center relative bg-black"
              >
                {/* Само видео */}
                <video 
                  ref={el => { videoRefs.current[index] = el; }}
                  src={reel.video_url} 
                  loop
                  playsInline
                  muted={index !== currentIndex} 
                  className="w-full h-full object-contain"
                  onClick={(e) => {
                    const video = e.currentTarget;
                    if (video.paused) video.play();
                    else video.pause();
                  }}
                />
                
                {/* Градиент для читаемости текста */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none"></div>

                {/* Инфо об авторе */}
                <div className="absolute top-6 left-4 right-16 flex items-center gap-3 z-10 pointer-events-none">
                  {reel.author_avatar ? (
                    <img src={reel.author_avatar} alt="ava" className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-md" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold border-2 border-white shadow-md">{reel.author_name[0]}</div>
                  )}
                  <Link href={`/profile/${reel.user_id}`} className="font-semibold text-white drop-shadow-md hover:underline pointer-events-auto text-sm">
                    {reel.author_name}
                  </Link>
                </div>

                {/* Описание */}
                <div className="absolute bottom-24 left-4 right-20 z-10 pointer-events-none">
                  <p className="text-white text-sm drop-shadow-md mb-2 line-clamp-4 leading-relaxed">{reel.description || 'Без описания'}</p>
                </div>

                {/* Кнопки лайков и комментов */}
                <div className="absolute bottom-24 right-3 z-10 flex flex-col gap-5 items-center">
                  <form action={toggleReelLikeAction} className="pointer-events-auto">
                    <input type="hidden" name="reel_id" value={reel.id} />
                    <button className="flex flex-col items-center gap-1.5 text-white drop-shadow-md group">
                      <div className={`p-3 rounded-full backdrop-blur-sm transition-all duration-300 ${myLike ? 'bg-red-500/30 text-red-500 scale-110' : 'bg-black/40 text-white group-hover:bg-black/60 group-hover:scale-105'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.32 4.625 3 7.5 3c1.53 0 3.03.748 4.004 1.978C12.48 3.748 13.98 3 15.51 3c2.875 0 5.25 2.32 5.25 5.25 0 3.924-2.438 7.11-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
                      </div>
                      <span className="text-xs font-bold drop-shadow-lg">{reel.likes_count}</span>
                    </button>
                  </form>

                  <button 
                    onClick={() => setActiveComments({ reelId: reel.id, comments: reel.comments })}
                    className="flex flex-col items-center gap-1.5 text-white drop-shadow-md pointer-events-auto group"
                  >
                    <div className="p-3 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-all duration-300 group-hover:scale-105">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
                    </div>
                    <span className="text-xs font-bold drop-shadow-lg">{reel.comments_count}</span>
                  </button>
                </div>

                {/* Подсказка для свайпа (только для первого видео) */}
                {index === 0 && currentIndex === 0 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-xs flex flex-col items-center animate-bounce pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" /></svg>
                    <span>Свайп вверх</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {activeComments && (
        <ReelCommentsModal 
          reelId={activeComments.reelId} 
          comments={activeComments.comments} 
          onClose={() => setActiveComments(null)} 
        />
      )}
    </div>
  );
}