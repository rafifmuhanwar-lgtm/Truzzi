import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store/notifications';
import { formatTimeAgo } from '../lib/format';
import { ArrowLeft, Bell, CheckCheck } from '../components/icons';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, load, markRead, markAllRead, loading } = useNotificationStore();

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (n: (typeof notifications)[number]) => {
    void markRead(n.id);
    if (n.routeName === '/chat/room' && n.routeExtra) {
      navigate(`/chat/room?roomId=${n.routeExtra}`);
    } else if (n.routeName === '/tracking') {
      navigate(n.routeExtra ? `/tracking?id=${n.routeExtra}` : '/tracking');
    } else if (n.routeName === '/order/detail') {
      navigate(n.routeExtra ? `/order/detail?id=${n.routeExtra}` : '/order/detail');
    } else if (n.routeName === '/profile/payment') {
      navigate('/profile/payment');
    } else if (n.routeName) {
      navigate(n.routeName);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base flex-1">Notifikasi</h1>
        <button onClick={() => void markAllRead()} className="text-xs text-primary font-semibold inline-flex items-center gap-1">
          <CheckCheck className="w-4 h-4" /> Tandai semua
        </button>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-4">
        {loading && notifications.length === 0 ? (
          <p className="text-center text-sm text-ink-secondary py-12">Memuat notifikasi...</p>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center">
              <Bell className="w-10 h-10 text-ink-secondary/40" />
            </span>
            <h3 className="mt-4 font-bold">Belum ada notifikasi</h3>
            <p className="mt-1 text-sm text-ink-secondary">Notifikasi pesanan dan promo akan muncul di sini.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => open(n)}
                className={`w-full card p-4 text-left ${!n.isRead ? 'border-primary/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${n.isRead ? 'bg-transparent' : 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-secondary">{n.category}</span>
                      <span className="text-xs text-ink-secondary shrink-0">{formatTimeAgo(n.createdAt)}</span>
                    </div>
                    <p className="font-semibold text-sm mt-1">{n.title}</p>
                    <p className="text-[13px] text-ink-secondary mt-0.5 leading-relaxed">{n.body}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}