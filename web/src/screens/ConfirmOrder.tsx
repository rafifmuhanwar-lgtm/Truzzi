import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Star, CheckCircle2, Clock } from '../components/icons';
import { API } from '../lib/api';
import { formatRupiah } from '../lib/format';

/** Konfirmasi penerimaan barang + ulasan customer. */
export default function ConfirmOrder() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const orderId = params.get('id') ?? '';

  const { data } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => API.orders.get(orderId),
    enabled: !!orderId,
  });
  const order = data?.order;

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleConfirm() {
    if (rating < 1) {
      enqueueSnackbar('Berikan rating minimal 1 bintang', { variant: 'warning' });
      return;
    }
    setSubmitting(true);
    try {
      await API.orders.confirmReceived(orderId, { rating, reviewText: reviewText.trim() });
      setDone(true);
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['order', orderId] });
    } catch (e: any) {
      enqueueSnackbar(e?.response?.data?.message || 'Gagal mengkonfirmasi', { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-ink-secondary">Memuat pesanan...</p>
      </div>
    );
  }

  // Already confirmed
  if (order.status === 'completed' && order.customerConfirmed) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary px-4 py-3 flex items-center gap-3 sticky top-0 z-10 text-white shadow-nav">
          <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></button>
          <p className="font-bold text-[15px]">Konfirmasi Pesanan</p>
        </header>
        <div className="px-5 py-16 text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Sudah Dikonfirmasi</h2>
          <p className="text-gray-500">Pesanan ini sudah dikonfirmasi sebelumnya.</p>
          <button onClick={() => navigate('/main?tab=orders')} className="btn-primary mt-4">Kembali</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary px-4 py-3 flex items-center gap-3 sticky top-0 z-10 text-white shadow-nav">
        <button onClick={() => navigate(-1)}><ArrowLeft className="w-6 h-6" /></button>
        <p className="font-bold text-[15px]">Konfirmasi Penerimaan</p>
      </header>

      <div className="px-5 py-5 space-y-5 max-w-lg mx-auto pb-32">
        {/* Timer info */}
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800">
            Pesanan akan otomatis dikonfirmasi dalam <strong>6 jam</strong> jika tidak ada tindakan.
          </p>
        </div>

        {/* Order info */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-2 shadow-sm">
          <h3 className="font-bold text-gray-900">{order.title}</h3>
          <p className="text-sm text-gray-500">{order.description}</p>
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-sm text-gray-500">Total</span>
            <span className="font-bold text-primary">{formatRupiah(order.totalAmount ?? 0)}</span>
          </div>
        </div>

        {/* Receipt Proof */}
        {order.strukImageUrl && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Bukti Struk Pembelian</h3>
            <img
              src={order.strukImageUrl}
              alt="Bukti Struk"
              className="w-full rounded-xl border border-gray-200 object-cover max-h-80"
            />
          </div>
        )}

        {/* Delivery proof */}
        {order.deliveryProofUrl && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">Bukti Pengiriman</h3>
            <img
              src={order.deliveryProofUrl}
              alt="Bukti pengiriman"
              className="w-full rounded-xl border border-gray-200 object-cover max-h-80"
            />
          </div>
        )}

        {/* Rating */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900">Berikan Rating</h3>
          <div className="flex items-center gap-2 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">
            {rating === 0 && 'Ketuk bintang untuk memberi rating'}
            {rating === 1 && 'Sangat Buruk 😞'}
            {rating === 2 && 'Buruk 😕'}
            {rating === 3 && 'Cukup 😐'}
            {rating === 4 && 'Baik 😊'}
            {rating === 5 && 'Sangat Baik 🤩'}
          </p>
        </div>

        {/* Review text */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900">Tulis Ulasan <span className="text-gray-400 font-normal">(opsional)</span></h3>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Ceritakan pengalaman Anda dengan jastiper ini..."
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      {/* Fixed bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-5 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleConfirm}
            disabled={submitting || rating < 1}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? 'Memproses...' : '✅ Konfirmasi Barang Diterima'}
          </button>
        </div>
      </div>

      {/* Success dialog */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 text-center space-y-3 animate-[fadeIn_0.2s_ease-out]">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">Terima Kasih!</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Pesanan telah dikonfirmasi dan ulasan Anda telah tersimpan. Dana jastiper akan segera dicairkan.
            </p>
            <button onClick={() => navigate('/main?tab=orders', { replace: true })} className="btn-primary mt-2">
              Kembali ke Pesanan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
