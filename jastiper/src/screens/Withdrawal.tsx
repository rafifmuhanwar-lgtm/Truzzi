import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { ArrowLeft } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { formatRupiah, formatInputThousands, parseRupiah } from '../lib/format';
import type { Earnings } from '../types';

interface BankItem {
  id: string;
  name: string;
  category: 'ewallet' | 'bank';
  label: string;
}

const METHOD_LIST: BankItem[] = [
  // ── E-Wallet ──
  { id: 'gopay', name: 'GoPay', category: 'ewallet', label: 'GoPay (Admin Rp 2.500)' },
  { id: 'ovo', name: 'OVO', category: 'ewallet', label: 'OVO (Admin Rp 2.500)' },
  { id: 'dana', name: 'DANA', category: 'ewallet', label: 'DANA (Admin Rp 2.500)' },
  { id: 'shopeepay', name: 'ShopeePay', category: 'ewallet', label: 'ShopeePay (Admin Rp 2.500)' },
  { id: 'linkaja', name: 'LinkAja', category: 'ewallet', label: 'LinkAja (Admin Rp 2.500)' },
  { id: 'isaku', name: 'iSaku', category: 'ewallet', label: 'iSaku (Admin Rp 2.500)' },
  { id: 'paytren', name: 'Paytren', category: 'ewallet', label: 'Paytren (Admin Rp 2.500)' },

  // ── Digital Bank ──
  { id: 'blu', name: 'Blu by BCA', category: 'bank', label: 'Blu by BCA' },
  { id: 'jenius', name: 'Jenius (BTPN)', category: 'bank', label: 'Jenius (BTPN)' },
  { id: 'saqu', name: 'Bank Saqu', category: 'bank', label: 'Bank Saqu' },
  { id: 'digibank', name: 'Digibank (DBS)', category: 'bank', label: 'Digibank (DBS)' },
  { id: 'motion', name: 'MotionBank', category: 'bank', label: 'MotionBank' },
  { id: 'linebank', name: 'Line Bank (Hana)', category: 'bank', label: 'Line Bank (Hana)' },
  { id: 'seabank', name: 'SeaBank', category: 'bank', label: 'SeaBank' },
  { id: 'krom', name: 'Krom Bank', category: 'bank', label: 'Krom Bank' },
  { id: 'superbank', name: 'Superbank', category: 'bank', label: 'Superbank' },
  { id: 'jago', name: 'Bank Jago', category: 'bank', label: 'Bank Jago' },
  { id: 'neo', name: 'Bank Neo Commerce', category: 'bank', label: 'Bank Neo Commerce' },
  { id: 'allo', name: 'Allo Bank', category: 'bank', label: 'Allo Bank' },

  // ── Bank Konvensional & Syariah ──
  { id: 'bca', name: 'Bank BCA', category: 'bank', label: 'Bank BCA' },
  { id: 'mandiri', name: 'Bank Mandiri', category: 'bank', label: 'Bank Mandiri' },
  { id: 'bri', name: 'Bank BRI', category: 'bank', label: 'Bank BRI' },
  { id: 'bni', name: 'Bank BNI', category: 'bank', label: 'Bank BNI' },
  { id: 'bsi', name: 'Bank Syariah Indonesia (BSI)', category: 'bank', label: 'Bank Syariah Indonesia (BSI)' },
  { id: 'btn', name: 'Bank BTN', category: 'bank', label: 'Bank BTN' },
  { id: 'cimb', name: 'Bank CIMB Niaga', category: 'bank', label: 'Bank CIMB Niaga' },
  { id: 'danamon', name: 'Bank Danamon', category: 'bank', label: 'Bank Danamon' },
  { id: 'permata', name: 'Bank Permata', category: 'bank', label: 'Bank Permata' },
  { id: 'maybank', name: 'Maybank Indonesia', category: 'bank', label: 'Maybank Indonesia' },
  { id: 'panin', name: 'Bank Panin', category: 'bank', label: 'Bank Panin' },
  { id: 'ocbc', name: 'Bank OCBC NISP', category: 'bank', label: 'Bank OCBC NISP' },
  { id: 'uob', name: 'Bank UOB Indonesia', category: 'bank', label: 'Bank UOB Indonesia' },
  { id: 'hsbc', name: 'Bank HSBC Indonesia', category: 'bank', label: 'Bank HSBC Indonesia' },
  { id: 'stanchard', name: 'Standard Chartered Bank', category: 'bank', label: 'Standard Chartered Bank' },
  { id: 'commonwealth', name: 'Bank Commonwealth', category: 'bank', label: 'Bank Commonwealth' },
  { id: 'sinarmas', name: 'Bank Sinarmas', category: 'bank', label: 'Bank Sinarmas' },
  { id: 'muamalat', name: 'Bank Muamalat', category: 'bank', label: 'Bank Muamalat' },
  { id: 'mega', name: 'Bank Mega', category: 'bank', label: 'Bank Mega' },
  { id: 'bukopin', name: 'KB Bank (Bukopin)', category: 'bank', label: 'KB Bank (Bukopin)' },
  { id: 'mnc', name: 'Bank MNC International', category: 'bank', label: 'Bank MNC International' },

  // ── Bank Pembangunan Daerah (BPD) ──
  { id: 'bjb', name: 'Bank BJB', category: 'bank', label: 'Bank BJB' },
  { id: 'dki', name: 'Bank DKI', category: 'bank', label: 'Bank DKI' },
  { id: 'jatim', name: 'Bank Jatim', category: 'bank', label: 'Bank Jatim' },
  { id: 'jateng', name: 'Bank Jateng', category: 'bank', label: 'Bank Jateng' },
  { id: 'sumut', name: 'Bank Sumut', category: 'bank', label: 'Bank Sumut' },
  { id: 'kaltimtara', name: 'Bank Kaltimtara', category: 'bank', label: 'Bank Kaltimtara' },
  { id: 'sulselbar', name: 'Bank Sulselbar', category: 'bank', label: 'Bank Sulselbar' },
  { id: 'ntbsyariah', name: 'Bank NTB Syariah', category: 'bank', label: 'Bank NTB Syariah' },
  { id: 'papua', name: 'Bank Papua', category: 'bank', label: 'Bank Papua' },
  { id: 'nagari', name: 'Bank Nagari', category: 'bank', label: 'Bank Nagari' },
  { id: 'acehsyariah', name: 'Bank Aceh Syariah', category: 'bank', label: 'Bank Aceh Syariah' },
  { id: 'riaukepri', name: 'Bank Riau Kepri Syariah', category: 'bank', label: 'Bank Riau Kepri Syariah' },
  { id: 'kalbar', name: 'Bank Kalbar', category: 'bank', label: 'Bank Kalbar' },
  { id: 'kalsel', name: 'Bank Kalsel', category: 'bank', label: 'Bank Kalsel' },
  { id: 'bali', name: 'Bank BPD Bali', category: 'bank', label: 'Bank BPD Bali' },
  { id: 'lampung', name: 'Bank Lampung', category: 'bank', label: 'Bank Lampung' },
];

/** Tarik saldo driver — min Rp 10.000, input ribuan titik. */
export default function Withdrawal() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const queryClient = useQueryClient();

  const { data: earningsData } = useQuery<Earnings>({
    queryKey: ['jastiper-earnings'],
    queryFn: () => API.jastiper.earnings(),
  });
  const saldo = earningsData?.saldo ?? 0;

  const [amount, setAmount] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedItem = METHOD_LIST.find((m) => m.id === selectedId);
  const isEwallet = selectedItem?.category === 'ewallet';
  const adminFee = isEwallet ? 2500 : 0;
  const rawValue = parseRupiah(amount);
  const netReceived = Math.max(0, rawValue - adminFee);

  async function handleSubmit() {
    if (!amount.trim()) {
      enqueueSnackbar('Masukkan nominal', { variant: 'warning' });
      return;
    }
    const value = parseRupiah(amount);
    if (value <= 0) {
      enqueueSnackbar('Nominal tidak valid', { variant: 'warning' });
      return;
    }
    if (value < 10000) {
      enqueueSnackbar('Minimal penarikan adalah Rp 10.000', { variant: 'warning' });
      return;
    }
    if (isEwallet && value <= adminFee) {
      enqueueSnackbar(`Nominal penarikan harus lebih besar dari biaya admin (${formatRupiah(adminFee)})`, { variant: 'warning' });
      return;
    }
    if (!selectedId) {
      enqueueSnackbar('Pilih bank / e-wallet tujuan', { variant: 'warning' });
      return;
    }
    if (!accountNumber.trim()) {
      enqueueSnackbar('Masukkan nomor rekening / e-wallet', { variant: 'warning' });
      return;
    }
    if (value > saldo) {
      enqueueSnackbar(`Saldo Anda tidak mencukupi (${formatRupiah(saldo)})`, { variant: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      await API.jastiper.createWithdrawal({
        amount: value,
        bankName: selectedItem?.name || selectedId,
        accountNumber: accountNumber.trim(),
      });
      enqueueSnackbar('Permintaan penarikan berhasil dikirim', { variant: 'success' });
      void queryClient.invalidateQueries({ queryKey: ['jastiper-earnings'] });
      navigate('/profile/transactions');
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal membuat permintaan penarikan'), { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-primary px-4 pt-4 pb-5 sticky top-0 z-20">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white rounded-full hover:bg-white/10">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-white font-semibold">Tarik Saldo</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-5 max-w-lg mx-auto pb-8">
        {/* Banner Peringatan Estimasi Waktu Penarikan */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900 shadow-2xs">
          <span className="text-lg leading-none shrink-0 mt-0.5">⏱️</span>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-amber-950">Informasi Penarikan Saldo</p>
            <p className="text-amber-800 leading-relaxed">
              Proses pencairan dana membutuhkan waktu <strong>1x24 jam</strong> atau bisa <strong>lebih cepat</strong> tergantung jam operasional bank / e-wallet tujuan.
            </p>
          </div>
        </div>

        {/* Saldo tersedia */}
        <div className="card-pad text-center">
          <p className="text-small text-ink-secondary">Saldo Tersedia</p>
          <p className="text-display font-bold text-primary mt-1">{formatRupiah(saldo)}</p>
        </div>

        {/* Nominal */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink">Nominal Penarikan</label>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Min. Rp 10.000</span>
          </div>
          <input
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(formatInputThousands(e.target.value))}
            placeholder="Contoh: 50.000"
            className="input-base mt-1.5"
          />
        </div>

        {/* Bank / e-wallet Dropdown (Tanpa Emoji) */}
        <div>
          <label className="text-sm font-semibold text-ink">Bank / E-Wallet</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="input-base mt-1.5">
            <option value="">Pilih tujuan...</option>
            <optgroup label="E-Wallet (Biaya Admin Rp 2.500)">
              {METHOD_LIST.filter((m) => m.category === 'ewallet').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="Transfer Bank (Gratis Admin)">
              {METHOD_LIST.filter((m) => m.category === 'bank').map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        {/* Nomor rekening */}
        <div>
          <label className="text-sm font-semibold text-ink">
            {isEwallet ? 'Nomor HP / Akun E-Wallet' : 'Nomor Rekening Bank'}
          </label>
          <input
            inputMode="numeric"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value.replace(/[^\d]/g, ''))}
            placeholder={isEwallet ? 'Contoh: 081234567890' : 'Masukkan nomor rekening'}
            className="input-base mt-1.5"
          />
        </div>

        {/* Rincian Potongan */}
        {rawValue > 0 && (
          <div className="p-3.5 rounded-xl bg-slate-100 text-xs space-y-1.5 font-medium">
            <div className="flex justify-between text-ink-secondary">
              <span>Potongan Saldo :</span>
              <span className="font-bold text-ink">{formatRupiah(rawValue)}</span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>Biaya Admin:</span>
              <span className={`font-bold ${adminFee === 0 ? 'text-emerald-600' : 'text-amber-700'}`}>
                {adminFee === 0 ? 'GRATIS (Rp 0)' : formatRupiah(adminFee)}
              </span>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center text-ink font-bold">
              <span>Dana Bersih Diterima:</span>
              <span className="text-sm font-extrabold text-emerald-700">{formatRupiah(netReceived)}</span>
            </div>
          </div>
        )}

        <button onClick={() => void handleSubmit()} disabled={submitting} className="btn-primary">
          {submitting ? 'Mengirim...' : `Tarik Saldo — ${formatRupiah(netReceived)}`}
        </button>
      </div>
    </div>
  );
}

