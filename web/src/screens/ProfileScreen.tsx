import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useSnackbar } from 'notistack';
import { formatRupiah } from '../lib/format';
import type { Order } from '../types';
import {
  User as UserIcon,
  Edit,
  MapPin,
  CreditCard,
  Wallet,
  HelpCircle,
  Info,
  Bell,
  LogOut,
  ChevronRight,
  ReceiptText,
} from '../components/icons';

function Row({
  icon,
  label,
  sub,
  onClick,
  danger,
}: {
  icon: JSX.Element;
  label: string;
  sub?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 py-3.5 text-left">
      <span className="w-9 h-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className={`block text-sm font-medium ${danger ? 'text-error' : 'text-ink'}`}>
          {label}
        </span>
        {sub && <span className="block text-xs text-ink-secondary truncate">{sub}</span>}
      </span>
      <ChevronRight className="w-4 h-4 text-ink-secondary shrink-0" />
    </button>
  );
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const { data: walletData } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: () => API.wallet.get(user!.id),
    enabled: !!user,
  });
  const balance = walletData?.wallet?.balance ?? 0;

  const { data: ordersData } = useQuery({
    queryKey: ['orders'],
    queryFn: () => API.orders.list(),
  });
  const orders: Order[] = ordersData?.orders ?? [];

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => o.status === 'completed').length;
    const active = orders.filter(
      (o) =>
        o.status === 'processing' ||
        o.status === 'pending' ||
        o.status === 'shipping' ||
        o.status === 'bought',
    ).length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const successRate = total > 0 ? Math.round((completed / total) * 100) : 100;
    return { total, completed, active, cancelled, successRate };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ordersData?.orders]);

  const handleLogout = async () => {
    await logout();
    enqueueSnackbar('Kamu sudah keluar', { variant: 'info' });
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-0 bg-background pb-10">
      {/* Header burgundy lengkung */}
      <div className="bg-primary rounded-b-[28px] px-6 pt-8 pb-8 text-white">
        <div className="flex items-center gap-4">
          {user?.photoUrl ? (
            <img
              src={user.photoUrl}
              alt=""
              className="w-16 h-16 rounded-full object-cover border-2 border-white/40"
            />
          ) : (
            <span className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <UserIcon className="w-9 h-9 text-white" />
            </span>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold font-sans truncate">{user?.name}</h1>
            <p className="text-sm text-white/75 truncate">{user?.email}</p>
            <p className="text-xs text-white/60 mt-0.5">{user?.selectedArea ?? 'Kota Bekasi'}</p>
          </div>
          <button
            onClick={() => navigate('/profile/edit')}
            className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center shrink-0"
            aria-label="Edit profil"
          >
            <Edit className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Wallet ringkas */}
        <button
          onClick={() => navigate('/profile/payment')}
          className="mt-5 w-full bg-white/10 border border-white/20 rounded-2xl p-4 flex items-center justify-between"
        >
          <span className="flex items-center gap-2.5">
            <Wallet className="w-5 h-5 text-white" />
            <span className="text-left">
              <span className="block text-xs text-white/70">Saldo TruzziPay</span>
              <span className="block text-lg font-bold">{formatRupiah(balance)}</span>
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold">
            Top Up <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </button>
      </div>

      {/* Konten */}
      <div className="mx-auto max-w-lg px-6 mt-4 space-y-4">
        {/* Statistik Pesanan */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-bold text-ink flex items-center gap-1.5">
              <ReceiptText className="w-4 h-4 text-primary" /> Statistik Transaksi
            </span>
            <span className="text-xs font-semibold text-success">{stats.successRate}% Sukses</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-background rounded-xl p-2.5">
              <p className="text-xs text-ink-secondary">Total</p>
              <p className="text-base font-bold text-ink mt-0.5">{stats.total}</p>
            </div>
            <div className="bg-success/10 rounded-xl p-2.5">
              <p className="text-xs text-success font-medium">Selesai</p>
              <p className="text-base font-bold text-success mt-0.5">{stats.completed}</p>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-2.5">
              <p className="text-xs text-amber-700 font-medium">Proses</p>
              <p className="text-base font-bold text-amber-700 mt-0.5">{stats.active}</p>
            </div>
            <div className="bg-error/10 rounded-xl p-2.5">
              <p className="text-xs text-error font-medium">Batal</p>
              <p className="text-base font-bold text-error mt-0.5">{stats.cancelled}</p>
            </div>
          </div>
        </div>

        {/* Akun & Pembayaran */}
        <div className="card-pad divide-y divide-divider">
          <Row
            icon={<Edit className="w-5 h-5 text-primary" />}
            label="Edit Profil"
            sub="Ubah nama, nomor HP, dan foto profil"
            onClick={() => navigate('/profile/edit')}
          />
          <Row
            icon={<MapPin className="w-5 h-5 text-primary" />}
            label="Alamat Tersimpan"
            sub="Kelola alamat pengantaran & penjemputan"
            onClick={() => navigate('/profile/addresses')}
          />
          <Row
            icon={<CreditCard className="w-5 h-5 text-primary" />}
            label="Metode Pembayaran"
            sub="TruzziPay Wallet, QRIS, dan lainnya"
            onClick={() => navigate('/profile/payment')}
          />
        </div>

        {/* Bantuan & Pengaturan */}
        <div className="card-pad divide-y divide-divider">
          <Row
            icon={<Bell className="w-5 h-5 text-primary" />}
            label="Notifikasi"
            onClick={() => navigate('/profile/notifications')}
          />
          <Row
            icon={<HelpCircle className="w-5 h-5 text-primary" />}
            label="Pusat Bantuan & CS"
            sub="Hubungi layanan pelanggan Truzzi"
            onClick={() => navigate('/profile/help')}
          />
          <Row
            icon={<Info className="w-5 h-5 text-primary" />}
            label="Tentang Aplikasi"
            onClick={() => navigate('/profile/about')}
          />
        </div>

        {/* Keluar */}
        <div className="card-pad">
          <Row
            icon={<LogOut className="w-5 h-5 text-error" />}
            label="Keluar"
            danger
            onClick={handleLogout}
          />
        </div>

        <p className="text-center text-xs text-ink-secondary pt-2">Truzzi v1.0.0 — by Truzzi</p>
      </div>
    </div>
  );
}
