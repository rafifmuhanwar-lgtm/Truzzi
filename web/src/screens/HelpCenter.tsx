import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageCircle, Phone, Mail } from '../components/icons';

export default function HelpCenter() {
  const navigate = useNavigate();

  const faqs = [
    { q: 'Bagaimana cara Top Up TruzziPay Wallet?', a: 'Buka menu Akun > Pembayaran, klik "Top Up" pada kartu TruzziPay Wallet. Isi saldo via QRIS tanpa biaya admin. Minimal top up Rp 10.000.' },
    { q: 'Apakah Truzzi mendukung pembayaran COD?', a: 'Tidak. Semua transaksi dilakukan secara non-tunai melalui QRIS atau Saldo TruzziPay Wallet.' },
    { q: 'Bagaimana cara memesan Jastip?', a: 'Pilih jastiper atau tujuan open trip di beranda, isi deskripsi barang yang ingin dibeli, lalu lakukan pembayaran aman.' },
    { q: 'Berapa batas berat untuk Jastiper?', a: 'Batas berat maksimal 20 kg dengan dimensi barang yang wajar dibawa jastiper.' },
    { q: 'Bagaimana proses refund?', a: 'Refund diproses maksimal 1x24 jam setelah pengajuan diverifikasi. Dana dikembalikan ke Saldo TruzziPay Wallet.' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Pusat Bantuan</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 pb-10">
        <h2 className="font-bold">Pertanyaan Umum (FAQ)</h2>
        <div className="mt-4 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="card-pad group">
              <summary className="font-semibold text-sm cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-ink-secondary transition-transform group-open:rotate-45">＋</span>
              </summary>
              <p className="text-sm text-ink-secondary mt-2 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <h2 className="font-bold mt-8">Hubungi Customer Service</h2>
        <p className="text-sm text-ink-secondary mt-1">Butuh bantuan lebih lanjut? Kami siap membantu 24 jam.</p>

        <div className="card-pad mt-4 space-y-3">
          <a href="https://wa.me/62811800900800" target="_blank" rel="noreferrer" className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-success/10"><MessageCircle className="w-5 h-5 text-success" /></span>
            <span><span className="block text-sm font-semibold">WhatsApp</span><span className="block text-xs text-ink-secondary">+62 811-900-800</span></span>
          </a>
          <a href="tel:+62811800900800" className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-primary/10"><Phone className="w-5 h-5 text-primary" /></span>
            <span><span className="block text-sm font-semibold">Telepon</span><span className="block text-xs text-ink-secondary">+62 811-900-800</span></span>
          </a>
          <a href="mailto:support@truzzi.id" className="flex items-center gap-3">
            <span className="p-2 rounded-xl bg-blue-50"><Mail className="w-5 h-5 text-blue-600" /></span>
            <span><span className="block text-sm font-semibold">Email</span><span className="block text-xs text-ink-secondary">support@truzzi.id</span></span>
          </a>
        </div>
      </div>
    </div>
  );
}