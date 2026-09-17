import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { API } from '../lib/api';
import { formatRupiah, formatOrderDateShort, orderTypeLabel } from '../lib/format';
import type { Order, Withdrawal } from '../types';

/** Riwayat transaksi — persis transaction_history_screen.dart: 2 seksi. */
export default function TransactionHistory() {
  const navigate = useNavigate();

  const { data: wdData } = useQuery<{ withdrawals: Withdrawal[] }>({
    queryKey: ['jastiper-withdrawals'],
    queryFn: () => API.jastiper.withdrawals(),
  });
  const { data: mineData } = useQuery<{ orders: Order[] }>({
    queryKey: ['jastiper-mine'],
    queryFn: () => API.jastiper.myOrders(),
  });

  const withdrawals = wdData?.withdrawals ?? [];
  const doneOrders = (mineData?.orders ?? []).filter(
    (o) => o.statusText === 'Pesanan Selesai' || o.status === 'completed',
  );

  const statusChip = (s: string) =>
    s === 'approved'
      ? { label: 'Disetujui', cls: 'bg-success/10 text-success' }
      : s === 'rejected'
        ? { label: 'Ditolak', cls: 'bg-error/10 text-error' }
        : { label: 'Menunggu', cls: 'bg-warning/10 text-warning' };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold">Riwayat Transaksi</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6 max-w-lg mx-auto pb-8">
        {/* Penarikan saldo */}
        <section>
          <h2 className="font-semibold text-body mb-3">Penarikan Saldo</h2>
          {withdrawals.length === 0 ? (
            <p className="text-small text-ink-secondary py-4 text-center">Belum ada penarikan saldo</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const chip = statusChip(w.status);
                return (
                  <div key={w.$id ?? w.id} className="card-pad flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold text-body2">{formatRupiah(w.amount)}</p>
                      <p className="text-small text-ink-secondary truncate">
                        {w.bankName} • {w.accountNumber}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold ${chip.cls}`}>{chip.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Pesanan selesai */}
        <section>
          <h2 className="font-semibold text-body mb-3">Pesanan Selesai</h2>
          {doneOrders.length === 0 ? (
            <p className="text-small text-ink-secondary py-4 text-center">Belum ada pesanan selesai</p>
          ) : (
            <div className="space-y-3">
              {doneOrders.map((o) => {
                const isJastip = (o.orderType ?? o.type) === 'jastip';
                const belanja = isJastip
                  ? (o.totalBelanjaStruk != null ? Number(o.totalBelanjaStruk) : Number(o.danaBelanja ?? 0))
                  : 0;
                const ongkir = Number(o.ongkir ?? 0);
                const totalEarned = ongkir + belanja;

                return (
                  <div key={o.$id ?? o.id} className="card-pad space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-body2 truncate">{o.title}</p>
                        <p className="text-small text-ink-secondary">
                          {orderTypeLabel(o.orderType ?? o.type)} • {formatOrderDateShort(o.createdAt)}
                        </p>
                      </div>
                      <span className="shrink-0 font-bold text-body2 text-success">
                        +{formatRupiah(totalEarned)}
                      </span>
                    </div>

                    {/* Rincian Penghasilan */}
                    <div className="pt-2 border-t border-divider/60 space-y-1 text-xs text-ink-secondary">
                      {isJastip && belanja > 0 && (
                        <div className="flex justify-between">
                          <span>Dana Belanja (Reimburse):</span>
                          <span className="font-medium text-ink">{formatRupiah(belanja)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Ongkir / Jastip Fee:</span>
                        <span className="font-medium text-ink">{formatRupiah(ongkir)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-primary pt-0.5">
                        <span>Total Masuk ke Saldo:</span>
                        <span>{formatRupiah(totalEarned)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

