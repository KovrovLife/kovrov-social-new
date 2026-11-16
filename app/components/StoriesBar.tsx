'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AddStoryButton from './AddStoryButton';

export default function StoriesBar({ currentUserId }: { currentUserId: number }) {
  const [stories, setStories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/stories')
      .then(res => res.json())
      .then(data => setStories(data))
      .catch(console.error);
  }, []);

  return (
    <div className="flex items-center gap-4 overflow-x-auto pb-4 mb-6 scrollbar-hide">
      <AddStoryButton />

      {stories.map((userStory) => {
        // Проверяем, есть ли непросмотренные истории у этого пользователя
        // (если в API есть флаг is_viewed, используем его; иначе считаем, что все новые)
        const hasUnviewed = userStory.stories.some((s: any) => !s.is_viewed);

        return (
          <Link 
            key={userStory.user_id} 
            href={`/stories/${userStory.stories[0].id}`} 
            className="flex flex-col items-center gap-1 shrink-0 group"
          >
            <div className={`w-16 h-16 rounded-full p-[2px] transition-transform group-hover:scale-105 ${
              hasUnviewed 
                ? 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600' 
                : 'bg-gray-300 dark:bg-gray-600'
            }`}>
              <div className="w-full h-full rounded-full border-2 border-white dark:border-gray-800 overflow-hidden bg-white">
                {userStory.author_avatar ? (
                  <img src={userStory.author_avatar} alt={userStory.author_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                    {userStory.author_name[0]}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium truncate w-16 text-center">
              {userStory.author_name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}