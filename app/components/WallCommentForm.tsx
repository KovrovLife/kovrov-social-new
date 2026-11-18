'use client';

import { useState } from 'react';
import { addWallCommentAction } from '../actions';

export default function WallCommentForm({
  wallPostId,
  ownerId,
}: {
  wallPostId: number;
  ownerId: number;
}) {
  const [text, setText] = useState('');
  const emojis = ['😊', '😂', '😍', '👍', '🔥', '❤️'];

  const handleEmojiClick = (emoji: string) => {
    setText((prev) => prev + emoji);
  };

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[200] flex items-end sm:items-center justify-center backdrop-blur-sm"
      onClick={() => setText('')}
    >
      <div
        className="bg-white dark:bg-gray-800 w-full max-w-md h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h3 className="font-bold text-gray-900 dark:text-white">Комментарий к посту</h3>
          <button
            onClick={() => setText('')}
            className="text-gray-500 hover:text-gray-800 dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex gap-2">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="text-lg hover:scale-125 transition-transform p-0.5 cursor-pointer"
              >
                {emoji}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              name="body"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Написать комментарий..."
              required
              className="flex-1 border rounded-md px-2 py-1 text-sm focus:ring-1 focus:ring-emerald-500 outline-none bg-gray-50 dark:bg-gray-900 dark:text-white"
            />
            <button
              className="text-xs bg-gray-200 text-gray-700 font-medium px-3 py-1 rounded-md hover:bg-gray-300 transition"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}