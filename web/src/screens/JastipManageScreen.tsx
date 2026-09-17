import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, ExternalLink } from '../components/icons';

export default function JastipManageScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      {/* ── Header ── */}
      <header className="bg-primary text-white sticky top-0 z-20 shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-full hover:bg-white/10 active:scale-95 transition-transform"
              aria-label="Kembali"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate">Kelola Trip &amp; Jastip</h1>
              <p className="text-[11px] text-white/80 leading-none mt-0.5">Truzzi Driver Partner</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-8 flex flex-col items-center justify-center text-center space-y-5">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-2 shadow-inner">
          <Store className="w-10 h-10" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h2 className="text-lg font-bold text-ink">Fitur Khusus Mitra Jastiper</h2>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Pengelolaan jadwal trip, destinasi belanja, serta katalog produk titipan kini dipindahkan ke <strong>Aplikasi Truzzi Driver</strong> agar terintegrasi langsung dengan penerimaan order dan pelacakan jastiper.
          </p>
        </div>

        <div className="w-full max-w-sm bg-surface border border-border/80 rounded-2xl p-4 text-left space-y-2.5 text-xs text-ink-secondary">
          <p className="font-semibold text-ink">Di Truzzi Driver App kamu bisa:</p>
          <ul className="list-disc list-inside space-y-1.5 text-[11px]">
            <li>Buka &amp; atur jadwal Open Trip (jadwal kirim, batas order)</li>
            <li>Kelola katalog barang bawaan jastip &amp; upload harga real</li>
            <li>Terima pesanan titipan langsung dari customer</li>
            <li>Penarikan saldo &amp; escrow otomatis setelah order selesai</li>
          </ul>
        </div>

        <div className="w-full max-w-sm pt-2 space-y-2.5">
          <button
            onClick={() => navigate('/jastip')}
            className="btn-primary w-full !h-11 text-xs font-bold shadow-sm"
          >
            Kembali ke Jelajah Jastip
          </button>
          <a
            href="http://localhost:5174/#/main?tab=jastip"
            target="_blank"
            rel="noreferrer"
            className="btn-outline w-full !h-11 text-xs font-bold flex items-center justify-center gap-1.5"
          >
            Buka Driver App (Kelola Trip) <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </main>
    </div>
  );
}
