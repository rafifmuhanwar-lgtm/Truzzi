import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { API } from '../lib/api';
import { formatRupiah, formatTimeAgo } from '../lib/format';
import type { Order } from '../types';
import {
  Search,
  X,
  Inbox,
  MessageCircle,
  Eye,
  Star,
  Flag,
  Navigation,
  Calendar,
} from '../components/icons';

type Filter = 'all' | 'pending' | 'processing' | 'bought' | 'shipping' | 'completed' | 'cancelled';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'pending', label: 'Pending' },
  { id: 'processing', label: 'Diproses' },
  { id: 'bought', label: 'Dibeli' },
  { id: 'shipping', label: 'Kirim' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Batal' },
];

function StatusPill({ order }: { order: Order }) {
  const status = order.status;
  const configs: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    pending: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', label: 'Pending' },
    processing: { bg: 'bg-info/15', text: 'text-info', dot: 'bg-info', label: 'Diproses' },
    bought: { bg: 'bg-primary/10', text: 'text-primary', dot: 'bg-primary', label: 'Dibeli' },
    shipping: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', label: 'Pengiriman' },
    completed: { bg: 'bg-success/15', text: 'text-success', dot: 'bg-success', label: 'Selesai' },
    cancelled: { bg: 'bg-error/15', text: 'text-error', dot: 'bg-error', label: 'Dibatalkan' },
    waiting_confirmation: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      dot: 'bg-amber-500',
      label: 'Menunggu Konfirmasi',
    },
  };
  const c = configs[status] ?? {
    bg: 'bg-ink-secondary/10',
    text: 'text-ink-secondary',
    dot: 'bg-ink-secondary',
    label: status,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={`text-[11px] font-semibold ${c.text} truncate max-w-[120px]`}>
        {c.label}
      </span>
    </span>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const map: Record<string, { title: string; desc: string }> = {
    all: { title: 'Tidak Ada Pesanan', desc: 'Belum ada transaksi yang sesuai dengan pencarian.' },
    pending: { title: 'Belum Ada Pesanan Pending', desc: 'Mulai pesanan jastip pertamamu!' },
    processing: {
      title: 'Tidak Ada Pesanan Diproses',
      desc: 'Semua pesanan sudah diproses atau belum ada yang baru.',
    },
    bought: { title: 'Tidak Ada Pesanan Dibeli', desc: 'Belum ada pesanan dalam tahap pembelian.' },
    shipping: { title: 'Tidak Ada Pengiriman', desc: 'Semua pesanan sudah dikirim atau selesai.' },
    completed: {
      title: 'Belum Ada Riwayat Selesai',
      desc: 'Pesanan yang selesai akan muncul di sini.',
    },
    cancelled: {
      title: 'Belum Ada Pesanan Dibatalkan',
      desc: 'Belum ada pesanan yang dibatalkan.',
    },
  };
  const m = map[filter] ?? map.all;
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <Inbox className="w-20 h-20 text-ink-secondary/40" />
      <h3 className="mt-4 font-bold text-ink">{m.title}</h3>
      <p className="mt-1 text-sm text-ink-secondary max-w-xs">{m.desc}</p>
    </div>
  );
}

function RatingStars({ rating, count }: { rating?: number; count?: number }) {
  const r = rating ?? 0;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-3.5 h-3.5 ${star <= Math.round(r) ? 'text-amber-400 fill-amber-400' : 'text-border'}`}
        />
      ))}
      {count !== undefined && (
        <span className="text-[10px] text-ink-secondary ml-1">({count})</span>
      )}
    </div>
  );
}

function OrderCard({
  order,
  onReview,
  onReport,
}: {
  order: Order;
  onReview: (order: Order) => void;
  onReport: (order: Order) => void;
}) {
  const navigate = useNavigate();
  const isFinished = order.status === 'completed' || order.status === 'cancelled';

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold">
          {order.serviceName}
        </span>
        <StatusPill order={order} />
      </div>
      <div className="flex items-center justify-between gap-2 mt-3">
        <p className="font-bold truncate text-[15px]">{order.title}</p>
        <span className="text-xs text-ink-secondary/80 font-medium shrink-0">
          {formatTimeAgo(order.createdAt)}
        </span>
      </div>
      {order.description && (
        <p className="text-xs text-ink-secondary mt-1 line-clamp-2">{order.description}</p>
      )}

      <div className="h-px bg-divider my-3" />

      <div className="flex items-center gap-3">
        {order.jastiperAvatar ? (
          <img
            src={order.jastiperAvatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-border"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs">
            👤
          </span>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-ink-secondary font-medium truncate block">
            Jastiper: {order.jastiperName || 'Mencari Jastiper...'}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2.5">
        <span className="text-sm font-bold text-primary">{formatRupiah(order.totalAmount)}</span>
        {order.status === 'completed' && (
          <div className="flex items-center gap-1">
            {order.reviewRating || order.jastiperRating ? (
              <RatingStars
                rating={order.reviewRating || order.jastiperRating!}
                count={order.reviewRating || order.jastiperRating!}
              />
            ) : (
              <button
                onClick={() => onReview(order)}
                className="text-[11px] font-bold text-primary hover:underline"
              >
                Beri Ulasan
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-3.5">
        {order.status === 'waiting_confirmation' ? (
          <button
            onClick={() => navigate(`/order/confirm?id=${order.id}`)}
            className="flex-1 !h-10 text-xs font-semibold rounded-xl bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
          >
            📦 Konfirmasi Penerimaan
          </button>
        ) : isFinished ? (
          <>
            <button
              onClick={() => onReport(order)}
              className="w-10 h-10 rounded-xl border border-error/30 text-error flex items-center justify-center shrink-0 hover:bg-error/5 active:scale-95 transition-all"
              title="Laporkan Masalah"
              aria-label="Lapor"
            >
              <Flag className="w-4 h-4 text-error" />
            </button>
            <button
              onClick={() => navigate(`/order/detail?id=${order.id}`, { state: { order } })}
              className="btn-primary flex-1 !h-10 text-xs font-semibold"
            >
              <Eye className="w-4 h-4 mr-1.5 inline" /> Detail
            </button>
          </>
        ) : (
          <>
            {order.status !== 'cancelled' && order.jastiperId && (
              <button
                onClick={() =>
                  navigate(`/chat/room?roomId=${order.id}`, {
                    state: {
                      room: {
                        id: order.id,
                        senderName: order.jastiperName ?? 'Jastiper',
                        avatarUrl: order.jastiperAvatar ?? '',
                        lastMessage: order.title,
                        lastMessageTime: order.createdAt,
                        unreadCount: 0,
                        isOnline: true,
                        lastSeenText: 'Aktif',
                        serviceType: order.serviceName,
                        isSupport: false,
                        orderStatus: order.status,
                      },
                    },
                  })
                }
                className="btn-outline flex-1 !h-10 text-xs font-semibold"
              >
                <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Chat
              </button>
            )}
            <button
              onClick={() => navigate(`/order/detail?id=${order.id}`, { state: { order } })}
              className="btn-primary flex-1 !h-10 text-xs font-semibold"
            >
              <Eye className="w-4 h-4 mr-1.5 inline" /> Detail
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrderList() {
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const searchParams = new URLSearchParams(location.search);
  const urlFilter = searchParams.get('filter') as Filter | null;
  const urlDate = searchParams.get('date') ?? '';

  const [filter, setFilter] = useState<Filter>(urlFilter ?? 'all');
  const [q, setQ] = useState('');
  const [dateFrom, setDateFrom] = useState(urlDate);
  const [dateTo, setDateTo] = useState('');

  // Review Modal State
  const [reviewOrder, setReviewOrder] = useState<Order | null>(null);
  const [rating, setRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Report Modal State
  const [reportOrder, setReportOrder] = useState<Order | null>(null);
  const [reportReason, setReportReason] = useState('Barang Rusak / Tidak Sesuai');
  const [reportDetail, setReportDetail] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);

  useEffect(() => {
    if (urlFilter && FILTERS.find((f) => f.id === urlFilter)) {
      setTimeout(() => setFilter(urlFilter), 0);
    }
  }, [location.search, urlFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', filter],
    queryFn: () => API.orders.list({ status: filter !== 'all' ? [filter] : undefined }),
    staleTime: 30000,
  });
  const orders: Order[] = data?.orders ?? [];

  const filtered = orders.filter((o) => {
    if (
      filter !== 'all' &&
      o.status !== filter &&
      !(filter === 'completed' && o.status === 'cancelled') &&
      !(filter === 'shipping' && o.status === 'waiting_confirmation')
    )
      return false;
    const query = q.trim().toLowerCase();
    if (query) {
      const hay = [o.id, o.title, o.serviceName, o.jastiperName ?? '', o.description]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (dateFrom) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (orderDate < dateFrom) return false;
    }
    if (dateTo) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      if (orderDate > dateTo) return false;
    }
    return true;
  });

  const submitReview = async () => {
    if (!reviewOrder) return;
    if (rating === 0) {
      enqueueSnackbar('Silakan pilih jumlah bintang ulasan!', { variant: 'warning' });
      return;
    }
    setSubmittingReview(true);
    try {
      await API.orders.review(reviewOrder.id, { rating, comment: reviewComment });
      enqueueSnackbar('Ulasan berhasil dikirim! Terima kasih ⭐', { variant: 'success' });
      setReviewOrder(null);
      setRating(0);
      setReviewComment('');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['jastipers'] });
    } catch {
      enqueueSnackbar('Gagal mengirim ulasan', { variant: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const submitReport = async () => {
    if (!reportOrder) return;
    setSubmittingReport(true);
    try {
      await API.orders.report(reportOrder.id, { reason: reportReason, details: reportDetail });
      enqueueSnackbar('Laporan Anda telah diteruskan ke Customer Service Truzzi.', {
        variant: 'info',
      });
      setReportOrder(null);
      setReportDetail('');
      qc.invalidateQueries({ queryKey: ['orders'] });
    } catch {
      enqueueSnackbar('Gagal mengirim laporan', { variant: 'error' });
    } finally {
      setSubmittingReport(false);
    }
  };

  return (
    <div className="min-h-0 bg-background pb-10">
      {/* Header burgundy lengkung */}
      <div
        className="bg-primary rounded-b-[28px] px-5 pt-6 pb-4"
        style={{ boxShadow: '0 5px 15px rgba(127,29,58,0.25)' }}
      >
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-white font-sans">Pesanan Saya</h1>
          <p className="text-sm text-white/85 mt-0.5">
            Pantau pesanan aktif &amp; riwayat transaksi
          </p>
          <div className="mt-3 bg-white rounded-[14px] flex items-center px-3.5 py-2.5">
            <Search className="w-[18px] h-[18px] text-ink-secondary mr-2 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nomor order, layanan, atau jastiper..."
              className="w-full bg-transparent text-sm placeholder:text-ink-secondary/60 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Hapus">
                <X className="w-4 h-4 text-ink-secondary" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-5 mt-4 flex gap-2 overflow-x-auto no-scrollbar max-w-lg mx-auto">
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-colors ${
                active
                  ? 'bg-primary text-white font-bold'
                  : 'bg-surface border border-border text-ink'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Filter Tanggal */}
      <div className="px-5 mt-3 flex gap-2 max-w-lg mx-auto">
        <div className="flex-1 flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
          <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-transparent text-[11px] text-ink focus:outline-none flex-1"
          />
        </div>
        <div className="flex-1 flex items-center gap-1 bg-surface rounded-lg px-2.5 py-1.5 border border-border">
          <Calendar className="w-3.5 h-3.5 text-ink-secondary" />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-transparent text-[11px] text-ink focus:outline-none flex-1"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
            }}
            className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs text-ink-secondary"
          >
            Reset
          </button>
        )}
      </div>

      {/* Rekomendasi jastipper */}
      {filter === 'completed' && (
        <div className="px-5 mt-4 max-w-lg mx-auto">
          <div className="bg-primary/5 rounded-2xl p-4 border border-primary/15">
            <div className="flex items-center gap-2">
              <Navigation className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold text-ink">Rekomendasi Jastipper Favorit</p>
                <p className="text-[11px] text-ink-secondary">
                  Berdasarkan kepuasan &amp; riwayat pesananmu
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {[
                { name: 'Andi Saputra', area: 'Kota Bekasi', rating: 4.9 },
                { name: 'Budi Rahman', area: 'Kab. Bekasi', rating: 4.8 },
                { name: 'Citra Lestari', area: 'Kota Bekasi', rating: 4.7 },
              ].map((j) => (
                <button
                  key={j.name}
                  onClick={() => navigate('/jastip')}
                  className="shrink-0 bg-white rounded-xl p-2.5 border border-border text-left shadow-2xs hover:border-primary/40 transition-colors"
                >
                  <p className="text-xs font-bold text-ink">{j.name}</p>
                  <p className="text-[10px] text-ink-secondary">
                    {j.area} · ⭐ {j.rating}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* List pesanan */}
      <div className="px-5 pt-4 pb-8 space-y-4 max-w-lg mx-auto">
        {isLoading ? (
          <p className="text-center text-sm text-ink-secondary py-10">Memuat pesanan...</p>
        ) : filtered.length === 0 ? (
          <EmptyState filter={filter} />
        ) : (
          filtered.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              onReview={(ord) => {
                setRating(0);
                setReviewComment('');
                setReviewOrder(ord);
              }}
              onReport={(ord) => setReportOrder(ord)}
            />
          ))
        )}
      </div>

      {/* Review Modal */}
      {reviewOrder && (
        <div
          className="fixed inset-0 z-[1600] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setReviewOrder(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-modal animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-ink">Beri Ulasan Pesanan</h3>
            <p className="text-xs text-ink-secondary mt-0.5">{reviewOrder.title}</p>

            <div className="flex justify-center gap-2.5 my-5">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = rating > 0 && star <= rating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 focus:outline-none transition-transform active:scale-125 hover:scale-110"
                    aria-label={`Beri ${star} bintang`}
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        isFilled ? 'text-amber-400 fill-amber-400' : 'text-gray-300 stroke-[1.5]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Ceritakan pengalaman belanja jastip Anda..."
              rows={3}
              className="w-full rounded-xl border border-border p-3 text-sm focus:outline-none focus:border-primary resize-none"
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setReviewOrder(null)}
                className="btn-outline flex-1 !h-11 text-xs"
              >
                Batal
              </button>
              <button
                disabled={submittingReview}
                onClick={submitReview}
                className="btn-primary flex-1 !h-11 text-xs"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {reportOrder && (
        <div
          className="fixed inset-0 z-[1600] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setReportOrder(null)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl p-6 shadow-modal animate-in fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-error flex items-center gap-1.5">
              <Flag className="w-5 h-5 text-error" /> Laporkan Kendala Pesanan
            </h3>
            <p className="text-xs text-ink-secondary mt-0.5">
              {reportOrder.title} · #{reportOrder.id.slice(0, 8)}
            </p>

            <div className="mt-4 space-y-2">
              <label className="text-xs font-semibold text-ink block">Kategori Masalah:</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-xl border border-border p-2.5 text-sm bg-white focus:outline-none focus:border-primary"
              >
                <option value="Barang Rusak / Tidak Sesuai">Barang Rusak / Tidak Sesuai</option>
                <option value="Jastiper Tidak Merespon">Jastiper Tidak Merespon</option>
                <option value="Harga Struk Berbeda Jauh">Harga Struk Berbeda Jauh</option>
                <option value="Pesanan Belum Sampai">Pesanan Belum Sampai</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-xs font-semibold text-ink block">Detail Keluhan:</label>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value)}
                placeholder="Jelaskan kendala yang Anda alami secara rinci..."
                rows={3}
                className="w-full rounded-xl border border-border p-3 text-sm focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setReportOrder(null)}
                className="btn-outline flex-1 !h-11 text-xs"
              >
                Batal
              </button>
              <button
                disabled={submittingReport}
                onClick={submitReport}
                className="btn-primary flex-1 !h-11 text-xs !bg-error hover:!bg-error/90"
              >
                {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
