import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatRupiah } from '../lib/format';
import type { Wallet, TopUpTransaction, Escrow } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, ShieldCheck } from '../components/icons';

export default function PaymentMethods() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: walletData } = useQuery({
    queryKey: ['wallet', user?.id],
    queryFn: () => API.wallet.get(user!.id),
    enabled: !!user,
  });
  const wallet: Wallet = walletData?.wallet;

  const { data: topupsData } = useQuery({
    queryKey: ['wallet-topups', user?.id],
    queryFn: () => API.wallet.topups(user!.id),
    enabled: !!user,
  });
  const topups: TopUpTransaction[] = topupsData?.topups ?? [];

  const { data: escrowsData } = useQuery({
    queryKey: ['wallet-escrows', user?.id],
    queryFn: () => API.wallet.escrows(user!.id),
    enabled: !!user,
  });
  const escrows: Escrow[] = escrowsData?.escrows ?? [];

  const { data: withdrawalsData } = useQuery({
    queryKey: ['wallet-withdrawals', user?.id],
    queryFn: () => API.wallet.withdrawals(user!.id),
    enabled: !!user,
  });
  const withdrawals: any[] = withdrawalsData?.withdrawals ?? [];

  const hasHistory =
    (wallet?.totalTopUp ?? 0) > 0 || (wallet?.totalSpent ?? 0) > 0 || withdrawals.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Pembayaran</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-4 pb-10">
        {/* Wallet card */}
        <div
          className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #7F1D3A, #5A1228)' }}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-sm">TruzziPay Wallet</span>
            <span className="px-2 py-1 rounded-lg bg-white/20 text-xs font-bold">Utama</span>
          </div>
          <div className="mt-5">
            <p className="text-[11px] text-white/70">Saldo Tersedia</p>
            <p className="text-2xl font-bold mt-0.5">{formatRupiah(wallet?.balance ?? 0)}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate('/wallet/topup')}
              className="py-2.5 rounded-xl bg-white text-primary font-bold text-xs hover:bg-slate-100 transition-colors shadow-2xs"
            >
              + Top Up Saldo
            </button>
            <button
              onClick={() => navigate('/wallet/withdraw')}
              className="py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs backdrop-blur-md transition-colors border border-white/30"
            >
              Tarik Saldo
            </button>
          </div>
        </div>

        {/* Riwayat Penarikan Saldo */}
        {withdrawals.length > 0 && (
          <div className="card-pad space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Riwayat Penarikan</h3>
            </div>
            <div className="space-y-2.5 divide-y divide-slate-100">
              {withdrawals.slice(0, 10).map((w) => (
                <div
                  key={w.id || w.$id}
                  className="pt-2.5 first:pt-0 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-ink">
                      {w.bankName?.toUpperCase() || 'PENARIKAN'} ·{' '}
                      <span className="font-medium text-slate-500">{w.accountNumber}</span>
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(w.createdAt || Date.now()).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-extrabold text-error">-{formatRupiah(w.amount)}</p>
                    <span
                      className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        w.status === 'completed' || w.status === 'success'
                          ? 'bg-emerald-100 text-emerald-800'
                          : w.status === 'rejected' || w.status === 'failed'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {w.status === 'completed' || w.status === 'success'
                        ? 'Berhasil'
                        : w.status === 'rejected' || w.status === 'failed'
                          ? 'Gagal'
                          : 'Diproses (1x24 Jam)'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Riwayat transaksi */}
        <div className="card-pad">
          <h3 className="font-bold text-sm mb-3">Riwayat Transaksi</h3>
          {hasHistory ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Total Top Up</span>
                <span className="font-semibold text-success flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" /> {formatRupiah(wallet?.totalTopUp ?? 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ink-secondary">Total Terpakai</span>
                <span className="font-semibold text-error flex items-center gap-1">
                  <TrendingDown className="w-4 h-4" /> {formatRupiah(wallet?.totalSpent ?? 0)}
                </span>
              </div>
              {escrows.length > 0 && <div className="h-px bg-divider my-1" />}
              {escrows.slice(0, 5).map((e) => (
                <div key={e.$id ?? e.id} className="flex justify-between text-sm">
                  <span className="text-ink-secondary truncate">Escrow · {e.serviceType}</span>
                  <span className="font-semibold">{formatRupiah(e.amount)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-3 text-center">
              <p className="text-sm text-ink-secondary">Belum ada transaksi</p>
              <p className="text-xs text-ink-secondary mt-0.5">
                Top Up saldo pertama kamu untuk mulai transaksi
              </p>
              <button
                onClick={() => navigate('/wallet/topup')}
                className="btn-outline mt-4 !h-10 !text-sm"
              >
                Top Up Sekarang
              </button>
            </div>
          )}
        </div>

        {/* Top up history */}
        {topups.length > 0 && (
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-3">Riwayat Top Up</h3>
            <div className="space-y-2">
              {topups.slice(0, 10).map((t) => (
                <div key={t.$id ?? t.id} className="flex items-center justify-between text-sm">
                  <span className="text-ink-secondary">
                    {new Date(t.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {t.paymentMethod.toUpperCase()}
                  </span>
                  <span
                    className={`font-semibold ${t.status === 'success' || t.status === 'completed' ? 'text-success' : t.status === 'failed' ? 'text-error' : 'text-warning'}`}
                  >
                    {t.status === 'success' || t.status === 'completed' ? '+' : ''}
                    {formatRupiah(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info escrow */}
        <p className="text-xs text-ink-secondary text-center leading-relaxed px-4">
          <ShieldCheck className="w-4 h-4 inline mr-1 text-primary" />
          Semua transaksi diamankan dengan sistem escrow dan enkripsi SSL.
        </p>
      </div>
    </div>
  );
}
