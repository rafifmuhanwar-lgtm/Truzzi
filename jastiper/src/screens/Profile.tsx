import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { UserCog, Bell, History, LifeBuoy, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { API } from '../lib/api';
import { formatRupiah } from '../lib/format';
import { useAuthStore } from '../store/auth';
import type { Earnings } from '../types';

/** Profil jastiper — persis profile_screen.dart: header, ringkasan pendapatan, menu, logout. */
export default function Profile() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, logout } = useAuthStore();

  const { data: earningsData } = useQuery<Earnings>({
    queryKey: ['jastiper-earnings'],
    queryFn: () => API.jastiper.earnings(),
  });
  const earnings: Earnings = earningsData ?? { hariIni: 0, bulanIni: 0, total: 0, saldo: 0 };

  async function handleLogout() {
    if (!window.confirm('Apakah kamu yakin ingin keluar?')) return;
    await logout();
    enqueueSnackbar('Sampai jumpa!', { variant: 'info' });
    navigate('/login', { replace: true });
  }

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-primary rounded-b-[28px] px-5 pt-6 pb-14">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-white/15 overflow-hidden flex items-center justify-center">
            {user?.photoUrl ? (
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xl font-bold">{(user?.name ?? 'K').charAt(0)}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold truncate">{user?.name}</p>
            <p className="text-white/70 text-small truncate">{user?.email}</p>
            <p className="text-white/70 text-small truncate">{user?.phone}</p>
            <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[11px]">
              {user?.vehicleType ?? '-'} • {user?.vehiclePlate ?? '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-8 space-y-4">
        {/* Ringkasan pendapatan */}
        <div className="card-pad space-y-3">
          <p className="font-semibold text-body">Ringkasan Pendapatan</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-btn bg-background p-3 text-center">
              <p className="text-small text-ink-secondary">Hari Ini</p>
              <p className="font-bold text-body2 mt-0.5">{formatRupiah(earnings.hariIni)}</p>
            </div>
            <div className="rounded-btn bg-background p-3 text-center">
              <p className="text-small text-ink-secondary">Bulan Ini</p>
              <p className="font-bold text-body2 mt-0.5">{formatRupiah(earnings.bulanIni)}</p>
            </div>
          </div>
          <div className="rounded-btn bg-primary/5 border border-primary/20 p-3 text-center">
            <p className="text-small text-ink-secondary">Total Keseluruhan</p>
            <p className="font-bold text-title mt-0.5 text-primary">
              {formatRupiah(earnings.total)}
            </p>
          </div>
          <button onClick={() => navigate('/profile/withdrawal')} className="btn-primary !h-11">
            Tarik Saldo
          </button>
        </div>

        {/* Menu */}
        <div className="card divide-y divide-divider overflow-hidden">
          <MenuItem
            to="/profile/edit"
            icon={<UserCog size={18} />}
            label="Edit Profil"
            sub="Ubah data diri dan kendaraan"
          />
          <MenuItem
            to="/notifications"
            icon={<Bell size={18} />}
            label="Notifikasi"
            sub="Kirim dan lihat riwayat notifikasi"
          />
          <MenuItem
            to="/profile/transactions"
            icon={<History size={18} />}
            label="Riwayat Transaksi"
            sub="Lihat daftar transaksi sebelumnya"
          />
          <MenuItem
            to="/profile/help"
            icon={<LifeBuoy size={18} />}
            label="Pusat Bantuan"
            sub="FAQ dan layanan bantuan"
          />
          <MenuItem
            to="/profile/settings"
            icon={<SettingsIcon size={18} />}
            label="Pengaturan"
            sub="Notifikasi, privasi dan keamanan"
          />
        </div>

        <button
          onClick={() => void handleLogout()}
          className="btn-outline !border-error/40 !text-error flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );
}

function MenuItem({
  to,
  icon,
  label,
  sub,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-background/60 transition-colors"
    >
      <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-body2">{label}</p>
        <p className="text-small text-ink-secondary truncate">{sub}</p>
      </div>
    </Link>
  );
}
