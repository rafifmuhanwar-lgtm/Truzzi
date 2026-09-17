import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package, TrendingUp, History, Target, ShieldCheck, Rocket } from 'lucide-react';
import { API } from '../lib/api';
import { formatRupiah } from '../lib/format';
import { useAuthStore } from '../store/auth';
import type { Earnings, Order } from '../types';

/** Home jastiper — persis home_screen.dart: header burgundy + toggle online, saldo, stats, menu pintas, info terkini. */
export default function Home() {
  const navigate = useNavigate();
  const { user, setUser } = useAuthStore();
  const [toggling, setToggling] = useState(false);

  const { data: earningsData } = useQuery<Earnings>({
    queryKey: ['jastiper-earnings'],
    queryFn: () => API.jastiper.earnings(),
    refetchInterval: 5000,
  });
  const { data: availData } = useQuery<{ orders: Order[] }>({
    queryKey: ['jastiper-available'],
    queryFn: () => API.jastiper.availableOrders(),
    refetchInterval: 5000,
  });

  async function toggleOnline() {
    if (!user) return;
    setToggling(true);
    try {
      await API.jastiper.setOnline(!user.isOnline);
      setUser({ ...user, isOnline: !user.isOnline });
    } finally {
      setToggling(false);
    }
  }

  const availableCount = availData?.orders.length ?? 0;
  const earnings: Earnings = earningsData ?? { hariIni: 0, bulanIni: 0, total: 0, saldo: 0 };

  return (
    <div className="pb-8 bg-background min-h-screen">
      {/* Clean Burgundy Header */}
      <div className="bg-[#7F1D3A] px-5 pt-7 pb-14 rounded-b-[24px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white/10 overflow-hidden flex items-center justify-center font-bold text-white text-base">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                (user?.name ?? 'K').charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-white/60 text-[11px] leading-tight font-medium">Mitra Driver</p>
              <h2 className="text-white text-base font-semibold leading-snug">{user?.name}</h2>
            </div>
          </div>

          {/* Toggle Online/Offline */}
          <button
            onClick={() => void toggleOnline()}
            disabled={toggling}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              user?.isOnline ? 'bg-emerald-600 text-white' : 'bg-black/25 text-white/80'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${user?.isOnline ? 'bg-white' : 'bg-white/40'}`} />
            {user?.isOnline ? 'Online' : 'Offline'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 -mt-8 space-y-4">
        {/* Saldo & Quick Stats Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-200/80">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <div>
              <span className="text-xs text-stone-500 font-medium">Total Saldo</span>
              <p className="text-2xl font-bold text-stone-900 tracking-tight mt-0.5">
                {formatRupiah(earnings.saldo)}
              </p>
            </div>
            <button
              onClick={() => navigate('/main?tab=orders')}
              className="px-3 py-1 rounded-full bg-[#7F1D3A]/10 text-[#7F1D3A] text-xs font-semibold"
            >
              {availableCount} Order
            </button>
          </div>

          {/* Mini Stats Grid */}
          <div className="grid grid-cols-3 gap-2 pt-3 text-center">
            <div>
              <p className="text-[11px] text-stone-500">Hari Ini</p>
              <p className="text-xs font-semibold text-stone-800 mt-0.5">{formatRupiah(earnings.hariIni)}</p>
            </div>
            <div className="border-x border-stone-100">
              <p className="text-[11px] text-stone-500">Bulan Ini</p>
              <p className="text-xs font-semibold text-stone-800 mt-0.5">{formatRupiah(earnings.bulanIni)}</p>
            </div>
            <div>
              <p className="text-[11px] text-stone-500">Poin</p>
              <p className="text-xs font-semibold text-stone-800 mt-0.5">600</p>
            </div>
          </div>
        </div>

        {/* Shortcuts / Menu Utama */}
        <div className="grid grid-cols-4 gap-2.5">
          <MenuButton
            icon={<Package size={20} className="text-[#7F1D3A]" />}
            label="Pesanan"
            onClick={() => navigate('/main?tab=orders')}
          />
          <MenuButton
            icon={<TrendingUp size={20} className="text-emerald-700" />}
            label="Pendapatan"
            onClick={() => navigate('/main?tab=profile')}
          />
          <MenuButton
            icon={<Rocket size={20} className="text-amber-600" />}
            label="Jastip"
            onClick={() => navigate('/main?tab=jastip')}
          />
          <MenuButton
            icon={<History size={20} className="text-stone-700" />}
            label="Riwayat"
            onClick={() => navigate('/profile/transactions')}
          />
        </div>

        {/* Target & Tips Ringkas */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-stone-900 flex items-center gap-1.5">
              <Target size={15} className="text-[#7F1D3A]" /> Target Mingguan
            </h3>
            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Bonus Rp100.000
            </span>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Selesaikan minimal 50 order minggu ini untuk mengklaim tambahan bonus saldo.
          </p>
        </div>

        {/* Tips Kerja */}
        <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200/70 flex items-start gap-3">
          <ShieldCheck size={18} className="text-stone-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-medium text-stone-800">Tips Keselamatan</p>
            <p className="text-[11px] text-stone-500 leading-relaxed mt-0.5">
              Selalu kenakan helm dan patuhi batas kecepatan selama proses pengantaran barang titipan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl p-3 border border-stone-200/80 flex flex-col items-center justify-center gap-1.5 active:bg-stone-50 transition-colors shadow-2xs"
    >
      {icon}
      <span className="text-[11px] font-medium text-stone-800">{label}</span>
    </button>
  );
}

