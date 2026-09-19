import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { addWatermark } from '../lib/watermark';
import { formatRupiahSpaced } from '../lib/format';
import type { Order, Settlement } from '../types';

/** Upload struk + settlement — persis receipt_screen.dart (jastip). */
export default function Receipt() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const orderId = params.get('id') ?? '';

  const { data } = useQuery<{ order: Order }>({
    queryKey: ['order', orderId],
    queryFn: () => API.orders.get(orderId),
    enabled: !!orderId,
  });
  const order = data?.order;

  const fileRef = useRef<HTMLInputElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [totalStruk, setTotalStruk] = useState('');
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<{ settlement: Settlement; order: Order } | null>(null);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const watermarked = await addWatermark(file);
      const res = await API.upload(watermarked);
      setPhotoUrl(res.url);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengupload foto'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!order) return;
    if (!photoUrl) {
      enqueueSnackbar('Harap foto struk belanja terlebih dahulu', { variant: 'warning' });
      return;
    }
    const total = Number(totalStruk.replace(/[^\d]/g, ''));
    if (!totalStruk.trim()) {
      enqueueSnackbar('Masukkan total belanja dari struk', { variant: 'warning' });
      return;
    }
    if (!Number.isFinite(total) || total <= 0) {
      enqueueSnackbar('Masukkan nominal yang valid', { variant: 'warning' });
      return;
    }
    setUploading(true);
    try {
      const res = await API.jastiper.submitReceipt(order.$id ?? order.id, {
        strukImageUrl: photoUrl,
        totalBelanjaStruk: total,
      });
      setResult(res);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengupload struk'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function formatInput(raw: string): string {
    const digits = raw.replace(/[^\d]/g, '');
    if (!digits) return '';
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white rounded-full hover:bg-white/10"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold">Upload Struk</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-lg mx-auto pb-8">
        {/* Info order */}
        <div className="card-pad space-y-2">
          <Row label="Dana Belanja" value={formatRupiahSpaced(order?.danaBelanja ?? 0)} />
          <Row label="Ongkir" value={formatRupiahSpaced(order?.ongkir ?? 0)} />
          <Row label="Biaya Layanan" value={formatRupiahSpaced(order?.biayaLayanan ?? 0)} />
        </div>

        {/* Foto struk */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        <div>
          <h3 className="font-semibold text-body">Foto Struk Belanja</h3>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`mt-2 w-full aspect-[4/3] rounded-card border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${
              photoUrl
                ? 'border-success bg-success/5'
                : 'border-border bg-white hover:border-primary'
            }`}
          >
            {photoUrl ? (
              <div className="relative w-full h-full">
                <img src={photoUrl} alt="struk" className="w-full h-full object-cover" />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-success text-white text-[11px] font-bold">
                  Foto struk diambil
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoUrl(null);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <span className="flex flex-col items-center gap-2 text-ink-secondary">
                <Camera size={32} />
                <span className="text-sm">Tap untuk foto struk belanja</span>
              </span>
            )}
          </button>
        </div>

        {/* Total belanja */}
        <div>
          <label className="text-sm font-semibold text-ink">Total Belanja (Struk)</label>
          <div className="relative mt-1.5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink-secondary">
              Rp
            </span>
            <input
              inputMode="numeric"
              value={totalStruk}
              onChange={(e) => setTotalStruk(formatInput(e.target.value))}
              placeholder="Masukkan total dari struk"
              className="input-base pl-11"
            />
          </div>
        </div>

        <button
          onClick={() => void handleSubmit()}
          disabled={uploading || !order}
          className="btn-primary"
        >
          {uploading ? 'Memproses...' : 'Submit Settlement'}
        </button>
      </div>

      {/* Dialog sukses — persis receipt_screen.dart */}
      {result && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40"
          onClick={() => navigate(`/order/detail?id=${orderId}`, { replace: true })}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-sheet p-6 space-y-3 animate-[slideUp_0.25s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-headline font-bold text-success">Upload Struk Berhasil</h2>
            <Row label="Dana Belanja" value={formatRupiahSpaced(order?.danaBelanja ?? 0)} />
            <Row
              label="Total Belanja (Struk)"
              value={formatRupiahSpaced(result.order.totalBelanjaStruk ?? 0)}
            />
            <div className={`border-t border-divider pt-2`}>
              <Row
                label="Refund ke Customer"
                value={formatRupiahSpaced(result.settlement.refundCustomer)}
                valueClass={
                  (result.settlement.refundCustomer ?? 0) >= 0 ? 'text-success' : 'text-error'
                }
              />
            </div>
            <div className="border-t border-divider pt-2">
              <Row
                label="Payment ke Jastiper"
                value={formatRupiahSpaced(result.settlement.paymentToJastiper)}
                valueClass="text-primary font-bold"
              />
              <p className="text-right text-small text-ink-secondary mt-0.5">
                Ongkir: {formatRupiahSpaced(order?.ongkir ?? 0)}
              </p>
            </div>
            <button
              onClick={() => navigate(`/order/detail?id=${orderId}`, { replace: true })}
              className="btn-primary mt-2"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-body2 text-ink-secondary">{label}</span>
      <span className={`font-semibold text-body2 ${valueClass ?? ''}`}>{value}</span>
    </div>
  );
}
