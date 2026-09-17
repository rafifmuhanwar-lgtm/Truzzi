import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, ReceiptText, MessageCircle, Heart, User } from '../components/icons';
import { useNotificationStore } from '../store/notifications';
import HomeScreen from './HomeScreen';
import OrderList from './OrderList';
import ChatList from './ChatList';
import FavoriteScreen from './FavoriteScreen';
import ProfileScreen from './ProfileScreen';

const TABS = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'orders', label: 'Pesanan', icon: ReceiptText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'favorite', label: 'Favorite', icon: Heart },
  { id: 'profile', label: 'Profil', icon: User },
];

/**
 * Shell utama 4 tab — pakai URL search param (?tab=home|orders|chat|profile)
 * agar tab persist saat navigasi keluar/masuk.
 * Layout: h-dvh flex-col → area konten flex-1 overflow-y-auto (scroll di dalam),
 * bottom nav di bawah TETAP terlihat (tidak ikut scroll).
 */
export default function MainShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const tabId = params.get('tab') ?? 'home';
  const tabIndex = TABS.findIndex((t) => t.id === tabId);

  function goTab(i: number) {
    navigate(`/main?tab=${TABS[i].id}`, { replace: true });
  }

  const { data: roomData } = useQuery({ queryKey: ['chat-rooms'], queryFn: () => API.chat.rooms(), refetchInterval: 8000 });
  
  const hasUnreadChat = (roomData?.rooms ?? []).some((r: any) => (r.unreadCount || 0) > 0);

  const { load } = useNotificationStore();

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 15000);
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="h-dvh flex flex-col bg-background">
      {/* Konten scrollable — masing-masing tab punya scroll sendiri */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div style={{ display: tabIndex === 0 ? undefined : 'none' }}>
          <HomeScreen />
        </div>
        <div style={{ display: tabIndex === 1 ? undefined : 'none' }}>
          <OrderList />
        </div>
        <div style={{ display: tabIndex === 2 ? undefined : 'none' }}>
          <ChatList />
        </div>
        <div style={{ display: tabIndex === 3 ? undefined : 'none' }}>
          <FavoriteScreen />
        </div>
        <div style={{ display: tabIndex === 4 ? undefined : 'none' }}>
          <ProfileScreen />
        </div>
      </div>

      {/* Bottom navigation — fixed, tidak ikut scroll */}
      <nav className="bg-white border-t border-divider shadow-nav pb-[env(safe-area-inset-bottom)] shrink-0">
        <div className="max-w-lg mx-auto grid grid-cols-5">
          {TABS.map((t, i) => {
            const Icon = t.icon;
            const active = i === tabIndex;
            return (
              <button
                key={t.id}
                onClick={() => goTab(i)}
                className="flex flex-col items-center gap-1 py-2.5 active:bg-background transition-colors relative"
                aria-label={t.label}
              >
                <div className="relative">
                  <Icon className={`w-6 h-6 ${active ? 'text-primary' : 'text-ink-secondary'}`} strokeWidth={active ? 2.4 : 2} />
                  {t.id === 'chat' && hasUnreadChat && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-error border border-white"></span>
                    </span>
                  )}
                </div>
                <span className={`text-[11px] ${active ? 'text-primary font-semibold' : 'text-ink-secondary'}`}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}