'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { addTrackToMyMusicAction, removeTrackFromMyMusicAction } from '../actions';
import UploadTrackForm from './UploadTrackForm';

export default function MusicPage() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [myTracks, setMyTracks] = useState<any[]>([]);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement>(null);

  const fetchTracks = async () => {
    const res = await fetch('/api/tracks');
    const data = await res.json();
    setTracks(data.tracks || []);
    setMyTracks(data.myTracks || []);
  };

  useEffect(() => {
    fetchTracks();
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, currentTrack]);

  const togglePlay = (track: any) => {
    if (currentTrack?.id === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        audioRef.current?.play();
        setIsPlaying(true);
      }
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        audioRef.current?.play();
      }, 100);
    }
  };

  const playNext = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  };

  const playPrev = () => {
    if (!currentTrack || tracks.length === 0) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrack(tracks[prevIndex]);
    setIsPlaying(true);
    setTimeout(() => audioRef.current?.play(), 100);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-32">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span className="w-2 h-6 bg-emerald-500 rounded-full"></span> Музыка
        </h1>
        <Link href="/" className="text-emerald-600 hover:underline text-sm font-medium">← На главную</Link>
      </div>

      <UploadTrackForm />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Все треки */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span> Все треки
          </h2>
          <div className="space-y-1">
            {tracks.length === 0 && <p className="text-sm text-gray-500 p-2">Пока нет треков.</p>}
            {tracks.map((track) => (
              <div key={track.id} className={`flex items-center justify-between p-2 rounded-xl transition ${currentTrack?.id === track.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => togglePlay(track)} className="text-emerald-600 hover:text-emerald-700 shrink-0 relative">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{track.title}</p>
                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                  </div>
                </div>
                <form action={addTrackToMyMusicAction} className="shrink-0">
                  <input type="hidden" name="track_id" value={track.id} />
                  <button className="text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 px-2 py-1 rounded-lg transition font-medium">+ В мои</button>
                </form>
              </div>
            ))}
          </div>
        </div>

        {/* Мои треки */}
        <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-2xl p-4 shadow-sm">
          <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-emerald-500 rounded-full"></span> Мои аудиозаписи
          </h2>
          <div className="space-y-1">
            {myTracks.length === 0 && <p className="text-sm text-gray-500 p-2">Вы еще не добавили ни одного трека.</p>}
            {myTracks.map((track) => (
              <div key={track.id} className={`flex items-center justify-between p-2 rounded-xl transition ${currentTrack?.id === track.id ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => togglePlay(track)} className="text-emerald-600 hover:text-emerald-700 shrink-0 relative">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      {currentTrack?.id === track.id && isPlaying ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                      )}
                    </div>
                  </button>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-gray-900 dark:text-white">{track.title}</p>
                    <p className="text-xs text-gray-500 truncate">{track.artist}</p>
                  </div>
                </div>
                <form action={removeTrackFromMyMusicAction} className="shrink-0">
                  <input type="hidden" name="track_id" value={track.id} />
                  <button className="text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-2 py-1 rounded-lg transition font-medium">Удалить</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Плеер */}
      {currentTrack && (
        <div className="fixed bottom-16 left-0 right-0 md:bottom-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t dark:border-gray-800 px-4 py-3 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-[100]">
          <audio 
            ref={audioRef} 
            src={currentTrack.file_url} 
            onTimeUpdate={handleTimeUpdate}
            onEnded={playNext}
            onLoadedMetadata={handleTimeUpdate}
          />
          
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center gap-4 mb-2">
              <div className="flex items-center gap-2">
                <button onClick={playPrev} className="text-gray-500 hover:text-emerald-600 transition p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.75 19.5l-7.5-7.5 7.5-7.5m-6 15L5.25 12l7.5-7.5" />
                  </svg>
                </button>
                
                <button onClick={() => togglePlay(currentTrack)} className="text-emerald-600 p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-full hover:bg-emerald-100 transition shrink-0">
                  {isPlaying ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z" clipRule="evenodd" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clipRule="evenodd" /></svg>
                  )}
                </button>
                
                <button onClick={playNext} className="text-gray-500 hover:text-emerald-600 transition p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 4.5l7.5 7.5-7.5 7.5m6-15l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate text-gray-900 dark:text-white">{currentTrack.title}</p>
                <p className="text-xs text-gray-500 truncate">{currentTrack.artist}</p>
              </div>
              
              <div className="flex items-center gap-2 w-24">
                <input 
                  type="range" 
                  min={0} 
                  max={1} 
                  step={0.01}
                  value={volume} 
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
                />
              </div>

              <div className="text-xs text-gray-500 font-medium hidden sm:block">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 w-8 text-right">{formatTime(currentTime)}</span>
              <input 
                type="range" 
                min={0} 
                max={duration || 0} 
                value={currentTime} 
                onChange={handleSeek}
                className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-emerald-600"
              />
              <span className="text-[10px] text-gray-400 w-8">{formatTime(duration)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}