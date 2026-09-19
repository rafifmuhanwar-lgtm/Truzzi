import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import { formatRoomTime } from '../lib/format';
import type { ChatRoom } from '../types';
import { Search, MessageCircle, X } from '../components/icons';

function Avatar({ room }: { room: ChatRoom }) {
  return (
    <span className="relative shrink-0">
      {room.avatarUrl ? (
        <img
          src={room.avatarUrl}
          alt=""
          className="w-11 h-11 rounded-full object-cover border border-gray-200"
        />
      ) : (
        <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary text-base">
          👤
        </span>
      )}
    </span>
  );
}

export default function ChatList() {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const { data, isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => API.chat.rooms(),
  });
  const rooms: ChatRoom[] = data?.rooms ?? [];

  const filtered = rooms.filter((r) => {
    // Hide support chats
    if (r.isSupport) return false;

    // Search query
    const query = q.trim().toLowerCase();
    if (query) {
      const hay =
        `${r.id} ${r.senderName} ${r.serviceType} ${r.orderTitle ?? ''} ${r.lastMessage}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });

  const totalUnread = rooms.reduce((acc, r) => acc + (r.unreadCount || 0), 0);

  return (
    <div className="min-h-0 bg-background pb-10">
      {/* Header burgundy melengkung */}
      <div
        className="bg-primary rounded-b-[28px] px-5 pt-6 pb-5"
        style={{ boxShadow: '0 5px 15px rgba(127,29,58,0.25)' }}
      >
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-white font-sans">Pesan &amp; Obrolan</h1>
              <p className="text-sm text-white/85 mt-0.5">Hubungi jastiper</p>
            </div>
            {totalUnread > 0 && (
              <span className="px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold">
                {totalUnread} Baru
              </span>
            )}
          </div>
          <div className="mt-3 bg-white rounded-full flex items-center px-4 py-2.5">
            <Search className="w-[18px] h-[18px] text-ink-secondary mr-2 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama jastiper..."
              className="w-full bg-transparent text-sm placeholder:text-ink-secondary/60 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Hapus">
                <X className="w-4 h-4 text-ink-secondary" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 px-4 pb-8 space-y-2 max-w-lg mx-auto">
        {isLoading ? (
          <p className="text-center text-xs text-gray-400 py-12">Memuat obrolan...</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <MessageCircle className="w-12 h-12 text-gray-300 stroke-[1.5]" />
            <p className="mt-3 font-semibold text-gray-800 text-sm">Belum ada obrolan</p>
            <p className="text-xs text-gray-400 mt-0.5">Pesan dari jastiper akan muncul di sini</p>
          </div>
        ) : (
          filtered.map((room) => (
            <button
              key={room.id}
              onClick={() => navigate(`/chat/room?roomId=${room.id}`, { state: { room } })}
              className="w-full bg-white rounded-2xl border border-gray-150 p-3.5 flex items-center gap-3 text-left hover:border-primary/40 active:scale-[0.99] transition-all shadow-xs"
            >
              <Avatar room={room} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <p className="font-semibold text-sm text-gray-900 truncate">{room.senderName}</p>
                </div>
                <p className="text-xs text-gray-500 mt-1 truncate font-normal">
                  {room.lastMessage}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span className="text-[11px] font-medium text-ink-secondary">
                  {formatRoomTime(room.lastMessageTime)}
                </span>
                {room.unreadCount > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
