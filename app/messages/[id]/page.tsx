import { db } from '@/lib/db';
import { getUserId } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { markMessagesAsRead } from '../../actions';
import Link from 'next/link';
import MessageInput from './MessageInput';

export const dynamic = 'force-dynamic';

export default function ChatPage({ params }: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) redirect('/login');

  const otherUserId = Number(params.id);
  if (isNaN(otherUserId) || otherUserId === userId) redirect('/messages');

  markMessagesAsRead(userId, otherUserId);

  const otherUser = db.prepare('SELECT name FROM users WHERE id = ?').get(otherUserId) as { name: string } | undefined;
  if (!otherUser) redirect('/messages');

  const messages = db.prepare(`
    SELECT * FROM messages 
    WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
    ORDER BY created_at ASC
  `).all(userId, otherUserId, otherUserId, userId) as any[];

  return (
    <div className="max-w-2xl mx-auto h-[75vh] flex flex-col bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-3">
        <Link href="/messages" className="text-gray-500 hover:text-emerald-600">←</Link>
        <span className="font-bold text-gray-900 dark:text-white">{otherUser.name}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
        {messages.length === 0 && <p className="text-center text-gray-400 text-sm mt-10">Начните диалог первым!</p>}
        {messages.map((m) => {
          const isMe = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-gray-800 border dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
                
                {m.type === 'text' && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                
                {m.type === 'voice' && (
                  <audio controls src={m.file_url} className="max-w-full h-10" />
                )}

                {m.type === 'video' && (
                  <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-emerald-300 shadow-md">
                    <video src={m.file_url} autoPlay loop playsInline className="w-full h-full object-cover" />
                  </div>
                )}

                <span className={`text-[10px] block mt-1 ${isMe ? 'text-emerald-200 text-right' : 'text-gray-400'}`}>
                  {m.created_at.split(' ')[1].slice(0,5)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <MessageInput otherUserId={otherUserId} />
    </div>
  );
}