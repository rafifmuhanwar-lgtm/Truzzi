import { useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Camera, Info } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { addWatermark } from '../lib/watermark';
import type { Order } from '../types';

/** Bukti pengambilan barang (Suruh) — mirip delivery_proof_screen.dart tapi tanpa struk. */
export default function PickupProof() {
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
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

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
      enqueueSnackbar('Harap ambil foto bukti barang terlebih dahulu', { variant: 'warning' });
      return;
    }
    setUploading(true);
    try {
      // Update order status ke "Barang Dibeli / Tugas Selesai" serta simpan foto bukti barang
      await API.jastiper.updateStatus(order.$id ?? order.id, 'Barang Dibeli / Tugas Selesai', {
        strukImageUrl: photoUrl,
      });
      setDone(true);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengupload bukti'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  const isJastip = (order?.orderType ?? order?.type) === 'jastip';

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
          <h1 className="text-white font-semibold">
            {isJastip ? 'Foto Barang Dibeli' : 'Bukti Pengambilan'}
          </h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-lg mx-auto pb-8">
        <div className="flex gap-2 rounded-btn bg-primary/5 border border-primary/20 px-4 py-3">
          <Info size={16} className="text-primary shrink-0 mt-0.5" />
          <p className="text-small text-ink leading-relaxed">
            {isJastip
              ? 'Ambil foto barang titipan yang sudah berhasil kamu beli sebagai bukti ke customer.'
              : 'Pastikan foto menampilkan barang yang diambil dengan jelas dari lokasi penjemputan.'}
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-body">Foto Bukti Pengambilan</h3>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => void pickPhoto(e.target.files?.[0])}
          />
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
              <img src={photoUrl} alt="bukti" className="w-full h-full object-cover" />
            ) : (
              <span className="flex flex-col items-center gap-2 text-ink-secondary">
                <Camera size={32} />
                <span className="text-sm">Tap untuk ambil foto</span>
              </span>
            )}
          </button>
        </div>

        <button
          onClick={() => void handleSubmit()}
          disabled={uploading || !order}
          className="btn-primary"
        >
          {uploading ? 'Memproses...' : 'Submit Bukti & Lanjutkan'}
        </button>
      </div>

      {/* Dialog sukses */}
      {done && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8">
          <div className="w-full max-w-sm bg-white rounded-card p-6 text-center space-y-3">
            <h2 className="text-headline font-bold">Bukti Terkirim</h2>
            <p className="text-body2 text-ink-secondary leading-relaxed">
              Bukti pengambilan barang telah diupload. Lanjut ke pengiriman ke tujuan.
            </p>
            <button
              onClick={() => navigate(`/order/detail?id=${orderId}`, { replace: true })}
              className="btn-primary"
            >
              Kembali ke Detail
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

