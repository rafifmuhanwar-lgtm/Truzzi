import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import type { Gig, GigReview } from '../types';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Monitor,
  Wrench,
  X,
  Star,
  MessageCircle,
} from '../components/icons';

function formatRupiah(n: number) {
  return `Rp ${(n ?? 0).toLocaleString('id-ID')}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

const STATUS_LABEL: Record<string, string> = {
  open: 'Terbuka',
  in_progress: 'Dikerjakan',
  submitted: 'Menunggu Persetujuan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export default function GigDetailScreen() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const { data } = useQuery({
    queryKey: ['gig', id],
    queryFn: () => API.gigs.get(id),
    enabled: !!id,
  });
  const gig: Gig | undefined = data?.gig;
  const reviews: GigReview[] = data?.reviews ?? [];

  if (!gig) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => navigate(-1)} aria-label="Kembali">
            <ArrowLeft className="w-6 h-6 text-ink" />
          </button>
          <h1 className="font-semibold text-base">Detail Tugas</h1>
        </header>
        <div className="flex-1 flex items-center justify-center text-sm text-ink-secondary">
          Memuat...
        </div>
      </div>
    );
  }

  const isPoster = user?.id === gig.posterId;
  const isWorker = user?.id === gig.workerId;
  const isOpen = gig.status === 'open';
  const isInProgress = gig.status === 'in_progress';
  const isSubmitted = gig.status === 'submitted';
  const isCompleted = gig.status === 'completed';

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['gig', id] });
    qc.invalidateQueries({ queryKey: ['gigs'] });
    qc.invalidateQueries({ queryKey: ['wallet'] });
  };

  const doTake = async () => {
    try {
      await API.gigs.take(id);
      enqueueSnackbar('Tugas berhasil diambil!', { variant: 'success' });
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const doCancel = async () => {
    if (!window.confirm('Yakin ingin membatalkan tugas ini? Dana akan dikembalikan ke saldomu.'))
      return;
    try {
      await API.gigs.cancel(id);
      enqueueSnackbar('Tugas dibatalkan. Dana dikembalikan.', { variant: 'success' });
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const doApprove = async () => {
    if (!window.confirm('Setujui hasil pekerjaan? Dana escrow akan dilepas ke pengerja.')) return;
    try {
      await API.gigs.approve(id);
      enqueueSnackbar('Tugas disetujui. Dana dilepas ke pengerja.', { variant: 'success' });
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const doSubmit = async (proofImageUrl: string | null, proofNote: string) => {
    try {
      await API.gigs.submit(id, { proofImageUrl, proofNote });
      enqueueSnackbar('Bukti terkirim!', { variant: 'success' });
      setSubmitOpen(false);
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const doReview = async () => {
    try {
      await API.gigs.review(id, { rating, comment });
      enqueueSnackbar('Penilaian terkirim!', { variant: 'success' });
      setReviewOpen(false);
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const showTake = isOpen && !isPoster;
  const showCancel = isPoster && (isOpen || isInProgress);
  const showSubmit = isWorker && isInProgress;
  const showApprove = isPoster && isSubmitted;
  const showReview = isCompleted;
  const showChat =
    (isPoster || isWorker) && gig.workerId && (isInProgress || isSubmitted || isCompleted);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Detail Tugas</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-4 pb-32">
        {/* Status & kategori */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${statusColor(gig.status)}`}
          >
            {STATUS_LABEL[gig.status] ?? gig.status}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-background text-[11px] font-semibold text-ink-secondary">
            {gig.category === 'digital' ? (
              <Monitor className="w-3.5 h-3.5" />
            ) : (
              <Wrench className="w-3.5 h-3.5" />
            )}
            {gig.category === 'digital' ? 'Digital' : 'Fisik'}
          </span>
        </div>

        <div className="card p-5">
          <h2 className="text-lg font-bold leading-snug">{gig.title}</h2>
          <p className="text-sm text-ink-secondary mt-2 whitespace-pre-line leading-relaxed">
            {gig.description}
          </p>

          <div className="flex items-center gap-3 mt-4 text-xs text-ink-secondary">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-4 h-4 text-primary" />
              {formatDate(gig.createdAt)}
            </span>
            {gig.deadline && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-4 h-4 text-warning" />
                Deadline {formatDate(gig.deadline)}
              </span>
            )}
          </div>
          {gig.location && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-ink-secondary">
              <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <span>{gig.location}</span>
            </div>
          )}
        </div>

        {/* Pembayaran */}
        <div className="card p-4 border border-primary/20">
          <div className="flex justify-between text-sm">
            <span className="text-ink-secondary">Budget pengerja</span>
            <span className="font-semibold">{formatRupiah(gig.budget)}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-ink-secondary">Biaya layanan (2,1%)</span>
            <span className="font-semibold">{formatRupiah(gig.biayaLayanan)}</span>
          </div>
          <div className="h-px bg-divider my-2.5" />
          <div className="flex justify-between items-center">
            <span className="font-bold">Total escrow</span>
            <span className="font-bold text-primary">
              {formatRupiah((gig.budget || 0) + (gig.biayaLayanan || 0))}
            </span>
          </div>
        </div>

        {/* Bukti (saat submitted) */}
        {isSubmitted && gig.proofNote && (
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">Bukti Pengerjaan</h3>
            {gig.proofImageUrl && (
              <img
                src={gig.proofImageUrl}
                alt="Bukti"
                className="w-full rounded-xl border border-border mb-2 object-cover max-h-[240px]"
              />
            )}
            <p className="text-xs text-ink-secondary whitespace-pre-line">{gig.proofNote}</p>
          </div>
        )}

        {/* Reviews */}
        {isCompleted && reviews.length > 0 && (
          <div className="card p-4">
            <h3 className="text-sm font-bold mb-2">Penilaian</h3>
            {reviews.map((r) => (
              <div key={r.id ?? r.$id} className="flex items-start gap-2 py-1.5">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-3.5 h-3.5 ${n <= r.rating ? 'text-warning fill-current' : 'text-border'}`}
                    />
                  ))}
                </div>
                {r.comment && <p className="text-xs text-ink-secondary">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom bar aksi */}
      {(showTake || showCancel || showSubmit || showApprove || showReview || showChat) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
          <div className="max-w-lg mx-auto space-y-2">
            {showChat && (
              <button
                onClick={() => navigate(`/chat/gig_${gig.id ?? gig.$id}`)}
                className="w-full py-3 px-4 rounded-xl border-2 border-primary bg-primary/5 hover:bg-primary/10 text-primary font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>{isPoster ? 'Chat Pengerja Tugas' : 'Chat Pembuat Tugas'}</span>
              </button>
            )}
            {showTake && (
              <button onClick={doTake} className="btn-primary">
                Ambil Tugas Ini
              </button>
            )}
            {showSubmit && (
              <button onClick={() => setSubmitOpen(true)} className="btn-primary">
                Kirim Bukti Pengerjaan
              </button>
            )}
            {showApprove && (
              <button onClick={doApprove} className="btn-primary">
                Setujui & Lepas Dana
              </button>
            )}
            {showCancel && (
              <button onClick={doCancel} className="btn-outline">
                Batalkan Tugas
              </button>
            )}
            {showReview && (
              <button
                onClick={() => setReviewOpen(true)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" /> Beri Penilaian
              </button>
            )}
          </div>
        </div>
      )}

      {submitOpen && <SubmitModal onClose={() => setSubmitOpen(false)} onSubmit={doSubmit} />}
      {reviewOpen && (
        <ReviewModal
          rating={rating}
          setRating={setRating}
          comment={comment}
          setComment={setComment}
          onClose={() => setReviewOpen(false)}
          onSubmit={doReview}
        />
      )}
    </div>
  );
}

function statusColor(s: string) {
  switch (s) {
    case 'open':
      return 'bg-success/10 text-success';
    case 'in_progress':
      return 'bg-[#E3F2FD] text-[#1565C0]';
    case 'submitted':
      return 'bg-[#FFF3E0] text-[#E65100]';
    case 'completed':
      return 'bg-[#E8F5E9] text-[#2E7D32]';
    case 'cancelled':
      return 'bg-[#FFEBEE] text-[#C62828]';
    default:
      return 'bg-border/50 text-ink-secondary';
  }
}

function SubmitModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (proofImageUrl: string | null, proofNote: string) => void;
}) {
  const [imageData, setImageData] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [uploading, setUploading] = useState(false);
  const { enqueueSnackbar } = useSnackbar();

  const handleFile = async (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      enqueueSnackbar('Pilih file gambar', { variant: 'error' });
      return;
    }
    setUploading(true);
    try {
      const res = await API.upload(f);
      setImageData(res.url || res.imageUrl || res.fileUrl || '');
    } catch {
      enqueueSnackbar('Gagal mengunggah gambar', { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl p-6"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Kirim Bukti</h3>
          <button onClick={onClose} aria-label="Tutup">
            <X className="w-5 h-5 text-ink-secondary" />
          </button>
        </div>
        <p className="text-xs text-ink-secondary mt-1">
          Unggah foto/dokumen hasil pekerjaan untuk ditinjau pemasang tugas.
        </p>

        <div className="mt-4">
          <label className="text-xs font-medium mb-1.5 block text-ink-secondary">
            Foto Bukti (Opsional)
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-2xl border-2 border-dashed border-border bg-background cursor-pointer overflow-hidden">
            {imageData ? (
              <img src={imageData} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-ink-secondary">
                {uploading ? 'Mengunggah...' : 'Klik untuk upload gambar'}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </label>
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium mb-1.5 block text-ink-secondary">Catatan</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Jelaskan hasil pekerjaanmu..."
            className="input-base"
          />
        </div>

        <button onClick={() => onSubmit(imageData, note)} className="btn-primary mt-5">
          Kirim Bukti
        </button>
      </div>
    </div>
  );
}

function ReviewModal({
  rating,
  setRating,
  comment,
  setComment,
  onClose,
  onSubmit,
}: {
  rating: number;
  setRating: (n: number) => void;
  comment: string;
  setComment: (s: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl p-6"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Beri Penilaian</h3>
          <button onClick={onClose} aria-label="Tutup">
            <X className="w-5 h-5 text-ink-secondary" />
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} bintang`}>
              <Star
                className={`w-9 h-9 ${n <= rating ? 'text-warning fill-current' : 'text-border'}`}
              />
            </button>
          ))}
        </div>

        <div className="mt-4">
          <label className="text-xs font-medium mb-1.5 block text-ink-secondary">
            Komentar (Opsional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="input-base"
            placeholder="Bagaimana hasilnya?"
          />
        </div>

        <button onClick={onSubmit} className="btn-primary mt-5">
          Kirim Penilaian
        </button>
      </div>
    </div>
  );
}
