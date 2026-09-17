import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatRupiah } from '../lib/format';
import { type Order } from '../types';
import {
  ArrowLeft, RefreshCw, Search, User as UserIcon, MessageCircle,
  Store, MapPin, Check, Star,
} from '../components/icons';


export default function OrderDetail() {
  const { state } = useLocation() as { state?: { order?: Order } };
  const [params] = useSearchParams();
  const orderIdFromUrl = params.get('id') || params.get('orderId') || '';
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [order, setOrder] = useState<Order | null>(state?.order ?? null);
  const [loading, setLoading] = useState<boolean>(!state?.order && !!orderIdFromUrl);
  const [jastiper, setJastiper] = useState<{ name?: string; phone?: string; photoUrl?: string; rating?: number } | null>(null);


  useEffect(() => {
    if (orderIdFromUrl) {
      if (!order) setLoading(true);
      API.orders.get(orderIdFromUrl)
        .then((res) => {
          if (res?.order) setOrder(res.order);
        })
        .catch(() => undefined)
        .finally(() => setLoading(false));
    }
  }, [orderIdFromUrl]);

  // Real-time auto poll order status every 3 seconds
  useEffect(() => {
    const targetId = orderIdFromUrl || order?.id;
    if (!targetId) return;
    const interval = setInterval(async () => {
      try {
        const { order: fresh } = await API.orders.get(targetId);
        if (fresh) setOrder(fresh);
      } catch {
        // ignore
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderIdFromUrl, order?.id]);

  useEffect(() => {
    if (order?.jastiperId) {
      API.orders.jastiper(order.id).then(({ jastiper: c }) => setJastiper(c)).catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.jastiperId]);

  useEffect(() => {
    //
  }, [user?.id]);

  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const handleSubmitReview = async () => {
    if (!order) return;
    if (selectedRating === 0) {
      enqueueSnackbar('Silakan pilih jumlah bintang rating terlebih dahulu!', { variant: 'warning' });
      return;
    }
    setSubmittingReview(true);
    try {
      await API.orders.review(order.id, {
        rating: selectedRating,
        comment: reviewComment,
      });
      enqueueSnackbar(`Terima kasih atas ulasan bintang ${selectedRating} Anda! ⭐`, { variant: 'success' });
      setShowReviewModal(false);
      setSelectedRating(0);
      setReviewComment('');
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['jastipers'] });
      // Refresh data jastiper jika ada
      if (order.jastiperId) {
        API.orders.jastiper(order.id).then(({ jastiper: c }) => setJastiper(c)).catch(() => {});
      }
    } catch {
      enqueueSnackbar('Gagal menyimpan ulasan. Silakan coba lagi.', { variant: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) return <p className="p-6 text-center text-sm text-ink-secondary">Memuat pesanan...</p>;
  if (!order) return <p className="p-6 text-center text-sm text-ink-secondary">Pesanan tidak ditemukan</p>;

  const isJastip = order.orderType === 'jastip';
  const currentStep = getStep(order);

  const itemPrice = order.danaBelanja > 0 ? order.danaBelanja : Math.max(0, order.totalAmount - order.ongkir - order.biayaLayanan);
  const ongkirPrice = order.ongkir > 0 ? order.ongkir : 10000;
  const layananPrice = order.biayaLayanan > 0 ? order.biayaLayanan : 2000;

  const openChat = () => {
    if (order?.jastiperId) {
       navigate(`/chat/room?targetUserId=${order.jastiperId}`);
    } else {
       enqueueSnackbar('Belum ada jastiper yang mengambil pesanan ini.', { variant: 'info' });
    }
  };





  const refreshOrder = async () => {
    const { order: fresh } = await API.orders.get(order!.id);
    setOrder(fresh);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary px-4 py-3 flex items-center gap-3 sticky top-0 z-10 text-white">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-white" /></button>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{order.id}</p>
          <p className="text-xs text-white/80">{order.serviceName}</p>
        </div>
        <button onClick={refreshOrder} title="Refresh status" aria-label="Refresh"><RefreshCw className="w-5 h-5" /></button>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-5 py-4 space-y-4 pb-28">
        <div className="card-pad">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm">Status Pesanan</h3>
          </div>
          <div className="mt-4">
            <StepTimeline isJastip={isJastip} currentStep={currentStep} />
          </div>
        </div>



        <div className={`card-pad ${order.jastiperId ? 'border-primary/30' : ''}`}>
          <div className="flex items-center gap-3">
            {order.jastiperAvatar || jastiper?.photoUrl ? (
              <img src={order.jastiperAvatar || jastiper?.photoUrl} alt="" className="w-11 h-11 rounded-full object-cover" />
            ) : (
              <span className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center">
                {order.jastiperId ? <UserIcon className="w-5 h-5 text-primary" /> : <Search className="w-5 h-5 text-primary" />}
              </span>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm text-ink">{jastiper?.name || order.jastiperName || 'Mencari Jastiper...'}</p>
              {order.jastiperId ? (
                <div className="flex items-center gap-1 mt-0.5">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                  <span className="text-xs font-semibold text-ink">
                    {Number(jastiper?.rating ?? (order as any).jastiperRating ?? 0.0).toFixed(1)}
                  </span>
                  <span className="text-xs text-ink-secondary">· Mitra Jastiper</span>
                </div>
              ) : (
                <p className="text-xs text-ink-secondary mt-0.5">Mohon tunggu, jastiper sedang dicari...</p>
              )}
            </div>
            {order.jastiperId && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={openChat} className="p-2.5 rounded-full bg-primary active:scale-95 transition-transform" aria-label="Chat jastiper">
                  <MessageCircle className="w-4 h-4 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="card-pad">
          <h3 className="font-bold text-sm mb-3">Lokasi Pengantaran</h3>
          {!isJastip && (
            <>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-lg bg-primary/10 shrink-0"><Store className="w-4 h-4 text-primary" /></span>
                <div className="min-w-0">
                  <p className="text-xs text-ink-secondary">Lokasi Toko / Jemput</p>
                  <p className="text-sm font-medium line-clamp-1">{order.pickupAddress || '-'}</p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-border ml-[19px]" />
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-error/10 shrink-0"><MapPin className="w-4 h-4 text-error" /></span>
            <div className="min-w-0">
              <p className="text-xs text-ink-secondary">Tujuan Pengantaran</p>
              <p className="text-sm font-medium line-clamp-1">{order.deliveryAddress || '-'}</p>
            </div>
          </div>
        </div>

        <div className="card-pad">
          <h3 className="font-bold text-sm mb-2">Detail Barang / Pesanan</h3>
          <p className="font-bold text-[15px]">{order.title}</p>
          {order.description && <p className="text-[13px] text-ink-secondary mt-1 leading-relaxed whitespace-pre-line">{order.description}</p>}
        </div>

        {(!isJastip || Number(order.danaBelanja) > 0 || order.status === 'completed') && (
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-2">Rincian Biaya</h3>
            <div className="space-y-2 text-sm">
              {Number(order.danaBelanja) > 0 && (
                <div className="flex justify-between"><span className="text-ink-secondary">Harga Item (Dana Belanja)</span><span className="font-semibold">{formatRupiah(itemPrice)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-ink-secondary">Ongkos Kirim Jastiper</span><span className="font-semibold">{formatRupiah(ongkirPrice)}</span></div>
              <div className="flex justify-between"><span className="text-ink-secondary">Biaya Layanan</span><span className="font-semibold">{formatRupiah(layananPrice)}</span></div>
              {Number(order.voucherDiscount || 0) > 0 ? (
                <div className="flex justify-between text-success">
                  <span>Diskon Voucher ({order.voucherCode ?? 'PROMO'})</span>
                  <span className="font-semibold">-{formatRupiah(order.voucherDiscount)}</span>
                </div>
              ) : null}
              <div className="h-px bg-divider" />
              <div className="flex justify-between items-center">
                <span className="font-bold">Total Pembayaran</span>
                <span className="font-bold text-primary text-lg">{formatRupiah(order.totalAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {(order.strukImageUrl || order.deliveryProofUrl) && (
          <div className="card-pad">
            <h3 className="font-bold text-sm mb-2">Bukti Pesanan</h3>
            <div className="space-y-3">
              {order.strukImageUrl && (
                <BuktiItem
                  title={isJastip ? 'Foto Barang Dibeli' : 'Foto Pengambilan Barang'}
                  value={order.totalBelanjaStruk != null ? formatRupiah(order.totalBelanjaStruk) : undefined}
                  url={order.strukImageUrl}
                />
              )}
              {order.deliveryProofUrl && <BuktiItem title="Bukti Penerimaan" url={order.deliveryProofUrl} />}
            </div>
          </div>
        )}
      </div>

      {(order.status === 'completed' || order.status === 'cancelled' || order.status === 'waiting_confirmation') && (
        <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 border-t border-divider z-20">
          <div className="max-w-lg mx-auto">
            {order.status === 'completed' && (
              <div className="flex gap-2">
                <button className="btn-primary w-full" onClick={() => order.serviceName.includes('Jastip') ? navigate('/jastip') : enqueueSnackbar(`Memesan ulang ${order.serviceName}...`, { variant: 'info' })}>
                  Pesan Lagi
                </button>
              </div>
            )}
            {order.status === 'waiting_confirmation' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                  <span className="text-xl">📦</span>
                  <p className="text-xs text-amber-800">Jastiper telah menyelesaikan pesanan ini. Silakan konfirmasi penerimaan barang.</p>
                </div>
                <button
                  className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 active:scale-[0.98] transition-all"
                  onClick={() => navigate(`/order/confirm?id=${order.id}`)}
                >
                  📦 Konfirmasi Penerimaan & Beri Ulasan
                </button>
              </div>
            )}
            {order.status === 'cancelled' && (
              <button className="btn-primary" onClick={() => navigate(-1)}>Kembali ke Daftar Pesanan</button>
            )}
          </div>
        </div>
      )}

      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowReviewModal(false)}>
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-1">
              <h3 className="font-bold text-lg text-ink">Beri Ulasan Jastiper</h3>
              <p className="text-xs text-ink-secondary">Bagaimana pengalamanmu berbelanja dengan {jastiper?.name || order.jastiperName || 'Jastiper'}?</p>
            </div>

            <div className="flex justify-center gap-2.5 py-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = selectedRating > 0 && star <= selectedRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    className="p-1 focus:outline-none transform hover:scale-115 active:scale-95 transition-all"
                    aria-label={`Beri ${star} bintang`}
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        isFilled
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300 stroke-[1.5]'
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Tulis ulasan singkat (opsional)..."
              rows={3}
              className="w-full text-xs p-3 rounded-2xl border border-border focus:outline-none focus:border-primary resize-none bg-background"
            />

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="btn-outline flex-1 !h-10 text-xs font-semibold rounded-xl"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={submittingReview}
                onClick={handleSubmitReview}
                className="btn-primary flex-1 !h-10 text-xs font-bold rounded-xl disabled:opacity-50"
              >
                {submittingReview ? 'Menyimpan...' : 'Kirim Ulasan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function getStep(order: Order): number {
  const st = (order.statusText ?? '').toLowerCase();
  if (order.status === 'completed' || st.includes('pesanan selesai')) return 4;
  if (order.status === 'waiting_confirmation' || st.includes('menunggu konfirmasi')) return 3;
  if (st.includes('dalam perjalanan ke tujuan') || st.includes('barang dibeli') || st.includes('tugas selesai')) return 3;
  if (st.includes('sampai di lokasi') || st.includes('dibelikan') || st.includes('diambil')) return 2;
  if (st.includes('menuju lokasi') || st.includes('jemput') || st.includes('assigned') || order.jastiperId) return 1;
  return 0;
}

const JASTIP_STEPS = [
  { title: 'Pesanan Dibuat', sub: 'Sistem sedang mencari jastiper untuk Anda' },
  { title: 'Jastiper Menuju Toko', sub: 'Jastiper sedang dalam perjalanan ke lokasi pembelian' },
  { title: 'Sedang Dibelikan', sub: 'Jastiper membeli barang pesanan Anda' },
  { title: 'Dalam Perjalanan ke Customer', sub: 'Jastiper menuju lokasi pengantaran' },
  { title: 'Pesanan Selesai', sub: 'Barang telah diterima dengan baik' },
];
const SURUH_STEPS = [
  { title: 'Pesanan Dibuat', sub: 'Tugas berhasil dikirim ke jastiper' },
  { title: 'Jastiper Menuju Penjemputan', sub: 'Jastiper menuju lokasi yang ditentukan' },
  { title: 'Tugas Sedang Dilakukan', sub: 'Jastiper sedang menjalankan tugas' },
  { title: 'Dalam Perjalanan ke Tujuan', sub: 'Jastiper menuju lokasi tujuan' },
  { title: 'Pesanan Selesai', sub: 'Tugas telah selesai dilaksanakan' },
];

function StepTimeline({ isJastip, currentStep }: { isJastip: boolean; currentStep: number }) {
  const steps = isJastip ? JASTIP_STEPS : SURUH_STEPS;
  return (
    <div className="space-y-0">
      {steps.map((s, i) => {
        const done = currentStep > i || (i === 0 && currentStep >= 0);
        const current = currentStep === i;
        return (
          <div key={s.title} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done && i > 0 ? 'bg-success text-white' : current ? 'bg-primary/15' : 'border border-border'}`}
              >
                {done && i > 0 ? <Check className="w-3.5 h-3.5" /> : current ? <span className="w-2 h-2 rounded-full bg-primary" /> : null}
              </span>
              {i < steps.length - 1 && (
                <span className={`w-0.5 h-9 ${currentStep > i ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
            <div className={`pb-5 ${current ? '' : done ? 'opacity-60' : 'opacity-40'}`}>
              <p className={`text-sm font-semibold ${current ? 'text-primary' : ''}`}>{s.title}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{s.sub}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BuktiItem({ title, value, url }: { title: string; value?: string; url: string }) {
  return (
    <div>
      <p className="text-xs text-ink-secondary">{title}{value ? ` · ${value}` : ''}</p>
      <img src={url} alt={title} className="mt-1.5 w-full max-h-52 object-cover rounded-xl border border-border" />
    </div>
  );
}
