import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Info, ShoppingBag, Tag, CheckCheck } from 'lucide-react';
import { API } from '../lib/api';
import { formatNotifTimeAgo } from '../lib/format';
import type { AppNotification } from '../types';

/** Ikon per kategori — persis notification_screen.dart. */
function categoryIcon(category: string) {
  if (category === 'Pesanan')
    return { icon: <ShoppingBag size={18} />, cls: 'bg-primary/10 text-primary' };
  if (category === 'Promo & Info')
    return { icon: <Tag size={18} />, cls: 'bg-warning/10 text-warning' };
  if (category === 'Sistem & Akun')
    return { icon: <Info size={18} />, cls: 'bg-blue-500/10 text-blue-600' };
  return { icon: <Bell size={18} />, cls: 'bg-ink-secondary/10 text-ink-secondary' };
}

/** Notifikasi jastiper — persis notification_screen.dart. */
export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data } = useQuery<{ notifications: AppNotification[] }>({
    queryKey: ['notifications'],
    queryFn: () => API.notifications.list(),
    refetchInterval: 15000,
  });
  const notifications = data?.notifications ?? [];
  const unread = notifications.filter((n) => !n.isRead);

  async function markRead(n: AppNotification) {
    if (n.isRead) return;
    await API.notifications.read(n.$id ?? n.id);
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  async function markAll() {
    await API.notifications.readAll();
    void queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white rounded-full hover:bg-white/10"
            >
              <ArrowLeft size={22} />
            </button>
            <h1 className="text-white font-semibold">Notifikasi</h1>
          </div>
          {unread.length > 0 && (
            <button
              onClick={() => void markAll()}
              className="p-2 text-white rounded-full hover:bg-white/10"
              aria-label="Tandai semua dibaca"
            >
              <CheckCheck size={20} />
            </button>
          )}
        </div>
      </div>

      <div className="px-5 py-5 space-y-2 max-w-lg mx-auto pb-8">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <p className="font-semibold text-ink">Belum ada notifikasi</p>
            <p className="text-small text-ink-secondary mt-1">Notifikasi akan muncul di sini</p>
          </div>
        ) : (
          notifications.map((n) => {
            const { icon, cls } = categoryIcon(n.category);
            return (
              <button
                key={n.$id ?? n.id}
                onClick={() => void markRead(n)}
                className={`w-full card-pad flex gap-3 text-left transition-colors ${
                  n.isRead ? '' : 'border-primary/40 bg-primary/[0.03]'
                }`}
              >
                <span
                  className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${cls}`}
                >
                  {icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-body2 truncate ${n.isRead ? '' : 'font-bold'}`}>
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-ink-secondary">
                      {formatNotifTimeAgo(n.createdAt)}
                    </span>
                  </div>
                  <p className="text-small text-ink-secondary mt-0.5 line-clamp-2">{n.body}</p>
                </div>
                {!n.isRead && <span className="shrink-0 h-2 w-2 rounded-full bg-primary mt-1.5" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

