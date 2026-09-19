import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { formatRupiah } from '../lib/format';
import type { Order } from '../types';
import { ArrowLeft, Info, PlusCircle, AlertTriangle } from '../components/icons';

/** Upload struk belanja + hitung refund — meniru JastiperReceiptScreen Flutter. */
export default function JastiperReceipt() {
  const { state } = useLocation() as { state?: { order?: Order } };
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const order = state?.order;
  const [amount, setAmount] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!order)
    return <p className="p-6 text-center text-sm text-ink-secondary">Pesanan tidak ditemukan</p>;

  const isJanganLebih = order.kebijakanLebih === 'jangan_lebih';

  const submit = async () => {
    const raw = Number(amount.replace(/[^\d]/g, ''));
    if (!Number.isFinite(raw) || raw <= 0) {
      return enqueueSnackbar('Masukkan total belanja yang valid', { variant: 'error' });
    }
    if (raw > order.danaBelanja && isJanganLebih) {
      const ok = window.confirm(
        `Total belanja (${formatRupiah(raw)}) melebihi dana belanja (${formatRupiah(order.danaBelanja)}).\n\nKebijakan: Jangan melebihi dana belanja.\nKurangi jumlah barang hingga sesuai dana, atau hubungi customer untuk menambah dana.`,
      );
      if (!ok) return;
    }

    setSaving(true);
    try {
      let strukImageUrl = order.strukImageUrl ?? '';
      if (photo && photo.startsWith('data:') === false) {
        const fileInput = fileRef.current?.files?.[0];
        if (fileInput) {
          const res = await API.upload(fileInput);
          strukImageUrl = res.url;
        }
      }

      const { order: updated } = await API.orders.patch(order.id, {
        totalBelanjaStruk: raw,
        strukImageUrl: strukImageUrl || undefined,
        statusText: 'Barang Dibeli',
      });

      const refund = updated.refundCustomer;
      enqueueSnackbar(
        refund != null
          ? updated.pendingApproval
            ? `Pesanan selesai! Refund: ${formatRupiah(refund)}`
            : `Pesanan selesai! Refund ${formatRupiah(refund)} ke customer`
          : 'Pesanan selesai!',
        { variant: 'success' },
      );
      qc.invalidateQueries({ queryKey: ['orders'] });
      navigate(-1);
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error', autoHideDuration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Upload Struk Belanja</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-4 pb-28">
        {/* Info pesanan */}
        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4">
          <p className="text-xs font-semibold text-ink-secondary flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-primary" /> Informasi Pesanan
          </p>
          <div className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-secondary">Item</span>
              <span className="font-semibold">{order.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Dana Belanja</span>
              <span className="font-semibold">{formatRupiah(order.danaBelanja)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-secondary">Ongkir</span>
              <span className="font-semibold">{formatRupiah(order.ongkir)}</span>
            </div>
          </div>
        </div>

        {/* Form struk */}
        <div className="card-pad">
          <h2 className="font-bold text-base">Total Belanja Sesuai Struk</h2>
          <p className="text-xs text-ink-secondary mt-0.5">
            Masukkan nominal sesuai struk belanja dari toko
          </p>

          <button
            onClick={() => fileRef.current?.click()}
            className="mt-4 w-full h-[180px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-ink-secondary"
          >
            {photo ? (
              <img
                src={photo}
                alt="foto struk"
                className="w-full h-full object-cover rounded-2xl"
              />
            ) : (
              <>
                <PlusCircle className="w-10 h-10 text-ink-secondary/60" />
                <span className="text-[13px]">Tap untuk upload foto struk</span>
              </>
            )}
          </button>

          <div className="relative mt-4">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-secondary">
              Rp
            </span>
            <input
              value={amount}
              onChange={(e) =>
                setAmount(
                  e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
                )
              }
              inputMode="numeric"
              placeholder="Contoh: 40000"
              className="input-base pl-12"
            />
          </div>
        </div>

        {/* Warning kebijakan jangan lebih */}
        {isJanganLebih && (
          <div className="bg-warning/10 border border-warning/25 rounded-2xl p-3.5 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              <span className="font-bold">Kebijakan: Jangan melebihi dana belanja.</span> Kurangi
              barang jika total melebihi {formatRupiah(order.danaBelanja)}.
            </p>
          </div>
        )}
      </div>

      {/* Snackbar foto info */}
      <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 border-t border-divider z-20">
        <div className="max-w-lg mx-auto">
          <button className="btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan & Hitung Refund'}
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPhoto(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}
