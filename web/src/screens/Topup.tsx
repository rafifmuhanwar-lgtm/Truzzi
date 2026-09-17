import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import QRCode from 'react-qr-code';
import { useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { formatRupiah, formatDateTimeWib } from '../lib/format';
import type { TopUpTransaction, PakasirPayment } from '../types';
import { ArrowLeft, QrCode as QrIcon, Star, Clock, RefreshCw } from '../components/icons';

const PRESETS = [20000, 50000, 100000, 200000, 500000];

export default function Topup() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [amount, setAmount] = useState(50000);
  const [custom, setCustom] = useState('');
  const [processing, setProcessing] = useState(false);
  const [txn, setTxn] = useState<TopUpTransaction | null>(null);
  const [payment, setPayment] = useState<PakasirPayment | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effectiveAmount = custom ? Number(custom.replace(/[^\d]/g, '')) : amount;

  const start = async () => {
    const amt = custom ? Number(custom.replace(/[^\d]/g, '')) : amount;
    if (amt < 10000) return enqueueSnackbar('Minimal top up Rp 10.000', { variant: 'error' });
    setProcessing(true);
    setError(null);
    try {
      const res = await API.wallet.topup({ amount: amt, method: 'qris' });
      setTxn(res.topup);
      setPayment(res.payment ?? {});
      setPolling(true);
    } catch (e) {
      setError(errMsg(e, 'Gagal membuat pembayaran'));
    } finally {
      setProcessing(false);
    }
  };

  // Poll status
  useEffect(() => {
    if (!polling || !txn?.id) return;
    let cancelled = false;
    const tick = async () => {
      try {
        const res = await API.wallet.topupDetail(txn!.id!);
        if (cancelled) return;
        if (res.topup?.status === 'success' || res.topup?.status === 'completed') {
          setPolling(false);
          qc.invalidateQueries({ queryKey: ['wallet', user?.id] });
          qc.invalidateQueries({ queryKey: ['wallet-topups', user?.id] });
          enqueueSnackbar(`Top up ${formatRupiah(res.topup?.amount)} berhasil! 🎉`, { variant: 'success' });
          setTimeout(() => navigate(-1), 1200);
        } else if (res.topup?.status === 'failed') {
          setPolling(false);
          setError('Pembayaran gagal, silakan coba lagi.');
        }
      } catch { /* retry */ }
    };
    void tick();
    const t = setInterval(tick, 3000);
    return () => { cancelled = true; clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polling, txn?.id]);

  const simulate = async () => {
    if (!txn?.id) return;
    setProcessing(true);
    try {
      await API.wallet.topupSimulate(txn.id);
      qc.invalidateQueries({ queryKey: ['wallet', user?.id] });
      qc.invalidateQueries({ queryKey: ['wallet-topups', user?.id] });
      enqueueSnackbar('Top Up berhasil! Saldo TruzziPay bertambah 🎉', { variant: 'success' });
      setTimeout(() => navigate(-1), 1200);
    } catch (e) {
      setError(`Verifikasi gagal: ${errMsg(e)}`);
    } finally {
      setProcessing(false);
    }
  };

  const cancel = () => {
    setPolling(false);
    setTxn(null);
    setPayment(null);
    setError(null);
  };

  // ── Payment details view ──
  if (txn && payment) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={cancel} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
          <h1 className="font-semibold text-base">Pembayaran via QRIS</h1>
        </header>

        <div className="flex-1 max-w-md w-full mx-auto px-6 py-6 flex flex-col items-center">
          <p className="text-sm text-ink-secondary">Total Pembayaran:</p>
          <p className="text-3xl font-bold mt-1 font-sans">{formatRupiah(payment.total_payment ?? effectiveAmount)}</p>

          {payment.is_test && (
            <span className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/15 text-warning text-xs font-bold">
              MODE TEST (Sandbox)
            </span>
          )}
          <div className="card-pad w-full mt-6 flex flex-col items-center">
            <p className="text-sm font-medium mb-3">Scan QRIS berikut</p>
            <div className="bg-white p-3 rounded-2xl border border-border">
              {payment.qr_url ? (
                <img src={payment.qr_url} alt="QRIS" width={200} height={200} className="w-[200px] h-[200px] object-contain" />
              ) : payment.payment_number ? (
                <QRCode value={payment.payment_number} size={200} fgColor="#1E1E1E" />
              ) : payment.qris_image ? (
                <img src={payment.qris_image} alt="QRIS" width={200} height={200} className="w-[200px] h-[200px] object-contain" />
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <QrIcon className="w-16 h-16 text-ink-secondary/40" />
                </div>
              )}
            </div>
            {payment.payment_url && (
              <a
                href={payment.payment_url}
                target="_blank"
                rel="noreferrer"
                className="mt-3 text-xs font-semibold text-primary underline"
              >
                Buka Halaman Pembayaran ↗
              </a>
            )}
            {payment.expired_at && (
              <p className="mt-3 text-xs text-ink-secondary flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Kadaluarsa: {formatDateTimeWib(payment.expired_at)}
              </p>
            )}
            {payment.demo && (
              <p className="mt-2 text-[11px] text-ink-secondary text-center">{payment.message ?? 'Mode demo — tanpa charge asli.'}</p>
            )}
            {polling && (
              <p className="mt-3 text-sm text-ink-secondary flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Menunggu pembayaran...
              </p>
            )}
          </div>

          <button onClick={simulate} disabled={processing} className="btn-primary mt-6 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4" /> Saya Sudah Bayar
          </button>
          <button onClick={cancel} disabled={processing} className="btn-outline mt-3">
            Batalkan Top Up
          </button>
          {error && <p className="mt-3 text-sm text-error text-center">{error}</p>}
          <p className="mt-4 text-[11px] text-ink-secondary text-center leading-relaxed">
            *Biaya transaksi sesuai ketentuan Truzzi dan akan ditambahkan ke total pembayaran
          </p>
        </div>
      </div>
    );
  }

  // ── Method selector view ──
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Top Up Saldo</h1>
      </header>

      <div className="flex-1 max-w-md w-full mx-auto px-6 py-6">
        <h2 className="font-bold">Pilih Nominal</h2>
        <div className="flex flex-wrap gap-2.5 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setAmount(p); setCustom(''); }}
              className={`px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
                !custom && amount === p ? 'bg-primary text-white border-primary' : 'bg-surface border-border text-ink'
              }`}
            >
              {formatRupiah(p)}
            </button>
          ))}
        </div>
        <div className="relative mt-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-ink-secondary">Rp</span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value.replace(/[^\d]/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'))}
            inputMode="numeric"
            placeholder="Nominal Lainnya"
            className="input-base pl-12"
          />
        </div>

        <h2 className="font-bold mt-8">Metode Pembayaran</h2>
        <button className="card-pad w-full mt-3 flex items-center gap-3 border border-primary/30">
          <span className="p-2.5 rounded-xl bg-primary/10"><QrIcon className="w-6 h-6 text-primary" /></span>
          <div className="flex-1 text-left">
            <p className="font-semibold">QRIS</p>
            <p className="text-xs text-ink-secondary">Semua E-Wallet &amp; Mobile Banking</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/15 text-warning text-[10px] font-bold">
            <Star className="w-3 h-3 fill-current" /> TERPOPULER
          </span>
        </button>

        <button onClick={start} disabled={processing} className="btn-primary mt-8">
          {processing ? 'Memproses...' : `Bayar Sekarang - ${formatRupiah(effectiveAmount)}`}
        </button>
        {error && <p className="mt-3 text-sm text-error text-center">{error}</p>}
        <p className="mt-4 text-[11px] text-ink-secondary text-center leading-relaxed">
          *Biaya transaksi sesuai ketentuan Truzzi dan akan ditambahkan ke total pembayaran
        </p>
      </div>
    </div>
  );
}