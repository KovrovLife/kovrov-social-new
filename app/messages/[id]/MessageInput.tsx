'use client';

import { useState, useRef } from 'react';
import { sendMessageAction, sendMediaMessageAction } from '../../actions';

export default function MessageInput({ otherUserId }: { otherUserId: number }) {
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [showEmojis, setShowEmojis] = useState(false);
  
  const videoInputRef = useRef<HTMLInputElement>(null);
  const emojis = ['😊', '😂', '😍', '👍', '🔥', '❤️', '🙏', '😮', '😢', '🤔'];

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    
    const formData = new FormData();
    formData.append('receiver_id', otherUserId.toString());
    formData.append('body', text);
    
    sendMessageAction(formData);
    setText('');
  };

  const handleMediaUpload = async (file: File, type: 'voice' | 'video') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    try {
      const res = await fetch('/api/upload-message', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const actionData = new FormData();
      actionData.append('receiver_id', otherUserId.toString());
      actionData.append('type', type);
      actionData.append('file_url', data.url);
      
      await sendMediaMessageAction(actionData);
      window.location.reload();
    } catch (err) {
      alert('Ошибка загрузки: ' + err);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const file = new File([blob], 'voice.webm', { type: 'audio/webm' });
        handleMediaUpload(file, 'voice');
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      alert('Не удалось получить доступ к микрофону');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
    }
  };

  return (
    <div className="p-3 border-t dark:border-gray-700 bg-white dark:bg-gray-800 relative">
      {showEmojis && (
        <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-lg p-2 shadow-lg flex flex-wrap gap-1 w-64 z-10">
          {emojis.map(e => (
            <button key={e} onClick={() => setText(prev => prev + e)} className="text-xl hover:scale-125 transition p-1">{e}</button>
          ))}
        </div>
      )}
      
      <form onSubmit={handleTextSubmit} className="flex items-center gap-2">
        <button type="button" onClick={() => setShowEmojis(!showEmojis)} className="text-gray-500 hover:text-emerald-600 p-2">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" /></svg>
        </button>
        
        <input 
          name="body" 
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Написать сообщение..." 
          className="flex-1 border dark:border-gray-600 rounded-full px-4 py-2 text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" 
        />
        
        <button type="button" onClick={isRecording ? stopRecording : startRecording} className={`p-2 rounded-full ${isRecording ? 'bg-red-100 text-red-600 animate-pulse' : 'text-gray-500 hover:text-emerald-600'}`} title={isRecording ? "Остановить запись" : "Голосовое"}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
        </button>

        <button type="button" onClick={() => videoInputRef.current?.click()} className="text-gray-500 hover:text-emerald-600 p-2" title="Видео-кружок">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" /></svg>
        </button>

        <input type="file" accept="video/*" capture="environment" ref={videoInputRef} className="hidden" onChange={(e) => {
          if (e.target.files?.[0]) handleMediaUpload(e.target.files[0], 'video');
        }} />

        <button type="submit" className="bg-emerald-600 text-white text-sm font-medium px-4 py-2 rounded-full hover:bg-emerald-700 transition">
          Отправить
        </button>
      </form>
    </div>
  );
}