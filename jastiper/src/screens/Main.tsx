import { useLocation } from 'react-router-dom';
import { Home as HomeIcon, ClipboardList, MessageSquare, User, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import Home from './Home';
import Orders from './Orders';
import ChatList from './ChatList';
import Profile from './Profile';
import JastipDashboard from './JastipDashboard';

const TABS = [
  { key: 'home', label: 'Beranda', icon: HomeIcon },
  { key: 'orders', label: 'Pesanan', icon: ClipboardList },
  { key: 'jastip', label: 'Jastip', icon: ShoppingBag },
  { key: 'chat', label: 'Pesan', icon: MessageSquare },
  { key: 'profile', label: 'Profil', icon: User },
];

/** Main shell 5 tab — Beranda / Pesanan / Jastip / Pesan / Profil. */
export default function Main() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const tab = params.get('tab') ?? 'home';

  const { data: roomData } = useQuery({ queryKey: ['chat-rooms'], queryFn: () => API.chat.rooms(), refetchInterval: 8000 });
  
  const hasUnreadChat = (roomData?.rooms ?? []).some((r: any) => (r.unreadCount || 0) > 0);

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto relative pb-[84px]">
      {tab === 'home' && <Home />}
      {tab === 'orders' && <Orders />}
      {tab === 'jastip' && <JastipDashboard />}
      {tab === 'chat' && <ChatList />}
      {tab === 'profile' && <Profile />}

      {/* Bottom nav fixed */}
      <nav className="fixed bottom-0 inset-x-0 z-30 max-w-lg mx-auto bg-white border-t border-divider shadow-nav">
        <div className="grid grid-cols-5 h-[68px] pb-2">
          {TABS.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <Link
                key={t.key}
                to={`/main?tab=${t.key}`}
                className={`flex flex-col items-center justify-center gap-0.5 text-small transition-colors relative ${
                  active ? 'text-primary font-semibold' : 'text-ink-secondary'
                }`}
              >
                <div className="relative">
                  <Icon size={active ? 23 : 21} strokeWidth={active ? 2.4 : 2} />
                  {t.key === 'chat' && hasUnreadChat && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-error border border-white"></span>
                    </span>
                  )}
                </div>
                <span className={active ? 'text-[10px] font-bold' : 'text-[10px]'}>{t.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
