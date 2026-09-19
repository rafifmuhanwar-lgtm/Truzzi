import { useState, useRef, type FormEvent, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import {
  ArrowLeft,
  Monitor,
  Wrench,
  Users,
  Link as LinkIcon,
  ImageIcon,
  X,
  Camera,
} from '../components/icons';

export default function GigCreateScreen() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [category, setCategory] = useState<'digital' | 'fisik'>('digital');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budgetPerWorker, setBudgetPerWorker] = useState('');
  const [workerCountInput, setWorkerCountInput] = useState('1');
  const [location, setLocation] = useState('');
  const [taskUrl, setTaskUrl] = useState('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [deadline, setDeadline] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleProofImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        enqueueSnackbar('Ukuran file maksimal 5 MB', { variant: 'error' });
        return;
      }
      setProofImage(file);
      setProofPreview(URL.createObjectURL(file));
    }
  };

  const removeProofImage = () => {
    setProofImage(null);
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const actualWorkers = Math.max(1, parseInt(workerCountInput) || 1);
  const unitBudget = Number(budgetPerWorker.replace(/\D/g, '')) || 0;
  const isSingleWorker = actualWorkers === 1;
  const minBudgetRequired = isSingleWorker ? 15000 : 2000;

  const handleBudgetChange = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) {
      setBudgetPerWorker('');
      return;
    }
    const num = Number(digits);
    setBudgetPerWorker(num.toLocaleString('id-ID'));
  };

  const totalWorkerBudget = unitBudget * actualWorkers;
  const fee = Math.max(500, Math.round(totalWorkerBudget * 0.021));
  const totalEscrow = totalWorkerBudget + fee;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      enqueueSnackbar('Judul dan deskripsi wajib diisi', { variant: 'error' });
      return;
    }

    if (unitBudget < minBudgetRequired) {
      if (isSingleWorker) {
        enqueueSnackbar('Minimum budget untuk 1 pengerja (single) adalah Rp 15.000', {
          variant: 'error',
        });
      } else {
        enqueueSnackbar(
          `Minimum budget per pengerja adalah Rp ${minBudgetRequired.toLocaleString('id-ID')}`,
          { variant: 'error' },
        );
      }
      return;
    }

    if (category === 'fisik' && !location.trim()) {
      enqueueSnackbar('Tugas fisik wajib mencantumkan lokasi', { variant: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      let extraNotes = '';
      if (taskUrl.trim()) {
        extraNotes += `\n\n🔗 Target Link / URL: ${taskUrl.trim()}`;
      }

      // Upload foto bukti jika ada
      let uploadedImageUrl = '';
      if (proofImage) {
        const uploadRes = await API.upload(proofImage);
        uploadedImageUrl = uploadRes.url ?? uploadRes.fileUrl ?? '';
      }
      if (uploadedImageUrl) {
        extraNotes += `\n\n🖼️ Foto Panduan Bukti: ${uploadedImageUrl}`;
      }

      const formattedDesc = `${description.trim()}${extraNotes}`;

      const finalTitle =
        actualWorkers > 1 ? `${title.trim()} [Kuota ${actualWorkers} Pengerja]` : title.trim();

      await API.gigs.create({
        title: finalTitle,
        description: formattedDesc,
        category,
        budget: totalWorkerBudget,
        location: location.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      });

      enqueueSnackbar('Tugas berhasil dipasang!', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['gigs'] });
      qc.invalidateQueries({ queryKey: ['wallet', user?.id] });
      navigate('/gigs');
    } catch (e) {
      const msg = errMsg(e);
      if ((e as { code?: string }).code === 'INSUFFICIENT_BALANCE') {
        enqueueSnackbar(msg, {
          variant: 'error',
          autoHideDuration: 6000,
          action: () => (
            <button
              onClick={() => {
                navigate('/wallet/topup');
              }}
              className="text-white font-semibold text-xs underline"
            >
              Top Up
            </button>
          ),
        });
      } else {
        enqueueSnackbar(`Gagal memasang: ${msg}`, { variant: 'error' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* Header */}
      <header className="bg-white px-4 h-14 border-b border-slate-200 flex items-center gap-3 sticky top-0 z-10 shadow-2xs">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-ink"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-base text-ink">Pasang Tugas Baru</h1>
      </header>

      <form onSubmit={submit} className="flex-1 max-w-lg w-full mx-auto px-5 py-5 space-y-5 pb-32">
        {/* ─── 1. Kategori Tugas (Centered) ─── */}
        <div>
          <label className="text-xs font-bold mb-1.5 block text-ink text-center">
            Kategori Tugas
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setCategory('digital')}
              className={`p-4 rounded-2xl border text-center transition-all ${
                category === 'digital'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span
                className={`inline-flex p-2 rounded-xl mx-auto ${category === 'digital' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <Monitor className="w-5 h-5" />
              </span>
              <p className="text-sm font-bold mt-2 text-ink">Digital</p>
              <p className="text-[11px] text-ink-secondary mt-0.5 leading-snug">Online & remote</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setCategory('fisik');
                setWorkerCountInput('1');
              }}
              className={`p-4 rounded-2xl border text-center transition-all ${
                category === 'fisik'
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <span
                className={`inline-flex p-2 rounded-xl mx-auto ${category === 'fisik' ? 'bg-primary text-white' : 'bg-slate-100 text-slate-500'}`}
              >
                <Wrench className="w-5 h-5" />
              </span>
              <p className="text-sm font-bold mt-2 text-ink">Fisik</p>
              <p className="text-[11px] text-ink-secondary mt-0.5 leading-snug">
                Butuh kehadiran di lokasi
              </p>
            </button>
          </div>
        </div>

        {/* ─── 2. Judul Tugas ─── */}
        <div>
          <label className="text-xs font-bold mb-1.5 block text-ink">Judul Tugas</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              category === 'digital'
                ? 'Contoh: Bantu isi kuesioner survei skripsi'
                : 'Contoh: Ngecat pagar rumah'
            }
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-ink placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* ─── 3. Deskripsi Tugas ─── */}
        <div>
          <label className="text-xs font-bold mb-1.5 block text-ink">Deskripsi Tugas</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Jelaskan detail petunjuk tugas, langkah pengerjaan, dan syarat bukti..."
            className="w-full p-3.5 rounded-xl border border-slate-200 bg-white text-xs text-ink placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* ─── 4. Target Link / URL (Digital only) ─── */}
        {category === 'digital' && (
          <div>
            <label className="text-xs font-bold mb-1.5 block text-ink flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-primary" />
              Target Link / URL (Opsional)
            </label>
            <input
              type="url"
              value={taskUrl}
              onChange={(e) => setTaskUrl(e.target.value)}
              placeholder="https://forms.google.com/..."
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs text-ink placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}

        {/* ─── 4b. Lokasi Tugas (Fisik only) ─── */}
        {category === 'fisik' && (
          <div>
            <label className="text-xs font-bold mb-1.5 block text-ink flex items-center gap-1">
              📍 Lokasi Tugas (Wajib)
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Contoh: Jl. Kemang Raya No. 12, Jakarta Selatan"
              className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-ink placeholder:text-slate-400 focus:outline-none focus:border-primary transition-all"
            />
          </div>
        )}

        {/* ─── 5. Upload Foto / Gambar Bukti ─── */}
        <div>
          <label className="text-xs font-bold mb-1.5 block text-ink flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-primary" />
            Foto / Gambar Panduan Bukti (Opsional)
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProofImageChange}
            className="hidden"
          />

          {proofPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <img src={proofPreview} alt="Preview" className="w-full h-40 object-cover" />
              <button
                type="button"
                onClick={removeProofImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-3 py-2">
                <p className="text-[11px] text-white font-semibold truncate">{proofImage?.name}</p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-primary hover:bg-primary/5 transition-all flex flex-col items-center gap-2 group"
            >
              <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Camera className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
              <p className="text-xs font-semibold text-slate-400 group-hover:text-primary transition-colors">
                Klik untuk upload foto contoh bukti
              </p>
              <p className="text-[10px] text-slate-400">JPG, PNG, maks 5 MB</p>
            </button>
          )}
        </div>

        {/* ─── 6. Jumlah Pekerja ─── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-2">
          <label className="text-xs font-bold text-ink flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-primary" />
              Jumlah Pekerja
            </span>
            <span className="text-xs font-extrabold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
              {actualWorkers} Orang
            </span>
          </label>
          <p className="text-[11px] text-ink-secondary leading-tight">
            Isi bebas berapa orang pekerja yang Anda butuhkan.
          </p>
          <input
            type="number"
            min="1"
            value={workerCountInput}
            onChange={(e) => setWorkerCountInput(e.target.value)}
            placeholder="Masukkan jumlah pekerja..."
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-ink focus:outline-none focus:border-primary focus:bg-white transition-all"
          />
        </div>

        {/* ─── 7. Budget / Bayaran ─── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold block text-ink">
              {actualWorkers > 1 ? 'Bayaran per Pekerja' : 'Bayaran / Budget Pekerja'}
            </label>
            <span className="text-[11px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              Min. Rp {minBudgetRequired.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={budgetPerWorker}
              onChange={(e) => handleBudgetChange(e.target.value)}
              placeholder={`Contoh: ${minBudgetRequired.toLocaleString('id-ID')}`}
              className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-ink focus:outline-none focus:border-primary focus:bg-white transition-all"
            />
          </div>

          {/* Rincian Kalkulasi */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between text-ink-secondary">
              <span>Total Bayaran ({actualWorkers} Pekerja):</span>
              <span className="font-bold text-ink">
                Rp {totalWorkerBudget.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-ink-secondary">
              <span>Biaya Layanan Platform (2,1%):</span>
              <span className="font-bold text-ink">Rp {fee.toLocaleString('id-ID')}</span>
            </div>
            <div className="border-t border-dashed border-slate-300 pt-2 flex justify-between items-center text-ink font-bold">
              <span>Total Dipotong dari Saldo:</span>
              <span className="text-sm font-extrabold text-primary">
                Rp {totalEscrow.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* ─── 8. Tanggal & Waktu ─── */}
        <div>
          <label className="text-xs font-bold mb-1.5 block text-ink">
            Tanggal & Waktu Tenggat (Opsional)
          </label>
          <input
            type="datetime-local"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-ink focus:outline-none focus:border-primary transition-all"
          />
        </div>

        {/* ─── 9. Tombol Submit ─── */}
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary flex items-center justify-center gap-2 font-bold shadow-md active:scale-98 transition-all"
        >
          {submitting && (
            <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />
          )}
          {submitting
            ? 'Memasang Tugas...'
            : `Pasang Tugas — Rp ${totalEscrow.toLocaleString('id-ID')}`}
        </button>
      </form>
    </div>
  );
}
