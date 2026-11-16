'use client';

import { useState } from 'react';
import PhotoModal from './PhotoModal';
import { deleteGalleryPhotoAction } from '../../actions';

export default function PhotoGallery({ photos, isMe }: { photos: any[], isMe: boolean }) {
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group aspect-square">
            {/* Фото (клик открывает модалку) */}
            <button 
              onClick={() => setSelectedPhotoId(photo.id)}
              className="block w-full h-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-900 cursor-pointer"
            >
              <img src={photo.photo_url} alt="Фото" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8 text-white opacity-80">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </button>

            {/* Кнопка удаления (видна только владельцу и только при наведении) */}
            {isMe && (
              <form action={deleteGalleryPhotoAction} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <input type="hidden" name="photo_id" value={photo.id} />
                <button 
                  className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition"
                  title="Удалить фото"
                  onClick={(e) => {
                    if (!confirm('Вы уверены, что хотите удалить это фото?')) {
                      e.preventDefault();
                    }
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </form>
            )}
          </div>
        ))}
      </div>

      {selectedPhotoId && (
        <PhotoModal 
          photoId={selectedPhotoId} 
          onClose={() => setSelectedPhotoId(null)} 
        />
      )}
    </>
  );
}