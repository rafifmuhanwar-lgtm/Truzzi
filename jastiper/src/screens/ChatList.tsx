import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Headset } from 'lucide-react';
import { API } from '../lib/api';
import { formatRoomTime } from '../lib/format';
import type { ChatRoom } from '../types';

/** Daftar pesan — persis chat_list_screen.dart: room turunan order + CS. */
export default function ChatList() {
  const { data } = useQuery<{ rooms: ChatRoom[] }>({
    queryKey: ['chat-rooms'],
    queryFn: () => API.chat.rooms(),
    refetchInterval: 8000,
  });
  const rooms = (data?.rooms ?? []).filter(r => !r.isSupport);



  return (
    <div className="px-5 py-5">
      <h1 className="text-display font-bold">Pesan</h1>
      <p className="text-small text-ink-secondary mt-0.5">Chat dengan pelanggan Anda</p>

      <div className="mt-4 space-y-2 pb-6">
        {rooms.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-ink">Belum ada pesan</p>
            <p className="text-small text-ink-secondary mt-1 whitespace-pre-line">
              {'Terima pesanan untuk mulai chat\ndengan pelanggan'}
            </p>
          </div>
        ) : (
          rooms.map((r) => <RoomRow key={r.id} room={r} />)
        )}
      </div>
    </div>
  );
}

function RoomRow({ room }: { room: ChatRoom }) {
  const isCs = room.isSupport;
  return (
    <Link
      to={isCs ? '/cs-chat' : `/chat/room?roomId=${room.id}`}
      className="card-pad flex items-center gap-3 hover:border-primary/40 transition-colors"
    >
      {isCs ? (
        <span className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Headset size={22} className="text-primary" />
        </span>
      ) : (
        <img src={room.avatarUrl} alt={room.senderName} className="w-12 h-12 rounded-full object-cover shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-body2 truncate">{room.senderName}</p>
        </div>
        <p className="text-xs text-ink-secondary mt-1 truncate">{room.lastMessage}</p>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-[11px] font-medium text-ink-secondary">{formatRoomTime(room.lastMessageTime)}</span>
        {room.unreadCount > 0 && (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
            {room.unreadCount}
          </span>
        )}
      </div>
    </Link>
  );
}
