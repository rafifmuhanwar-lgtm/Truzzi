import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Zap, Globe } from '../components/icons';
import truzziLogo from '../assets/images/truzzi_logo_color.png';

export default function AboutApp() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Tentang Aplikasi</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-8 text-center">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img src={truzziLogo} alt="Truzzi Logo" className="w-[120px] object-contain drop-shadow-md" />
          <p className="text-sm text-ink-secondary mt-1">Versi 1.0.0</p>
        </div>

        <p className="text-sm text-ink-secondary leading-relaxed mt-6 max-w-sm mx-auto">
          Truzzi adalah platform marketplace Open Jastip terpercaya Indonesia. Titip belanja barang & kuliner favorit melalui jastiper terverifikasi. Transaksi aman dengan sistem TruzziPay Rekber (Escrow).
        </p>

        <div className="card-pad mt-8 text-left space-y-3">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10"><ShieldCheck className="w-5 h-5 text-primary" /></span>
            <div>
              <p className="text-sm font-semibold">Dana Diamankan Escrow</p>
              <p className="text-xs text-ink-secondary">Saldo aman sampai pesanan selesai</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10"><Zap className="w-5 h-5 text-primary" /></span>
            <div>
              <p className="text-sm font-semibold">Pengiriman Cepat</p>
              <p className="text-xs text-ink-secondary">Estimasi pengiriman real-time</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10"><Globe className="w-5 h-5 text-primary" /></span>
            <div>
              <p className="text-sm font-semibold">Layanan 24 Jam</p>
              <p className="text-xs text-ink-secondary">CS aktif setiap saat</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-ink-secondary mt-8">© 2026 Truzzi. All rights reserved.</p>
      </div>
    </div>
  );
}