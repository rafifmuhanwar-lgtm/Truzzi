import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Headset, Mail } from 'lucide-react';

/** FAQ — konten persis help_center_screen.dart. */
const FAQS = [
  {
    q: 'Bagaimana cara menarik saldo?',
    a: 'Buka menu Profil > Tarik Saldo. Masukkan nominal (minimal Rp 10.000), pilih bank atau e-wallet tujuan, lalu masukkan nomor rekening. Permintaan akan diproses oleh tim kami.',
  },
  {
    q: 'Apa yang harus dilakukan jika pelanggan tidak dapat dihubungi?',
    a: 'Tunggu selama 15 menit di lokasi. Jika tetap tidak dapat dihubungi, hubungi CS untuk membatalkan pesanan tanpa penalti.',
  },
  {
    q: 'Berapa komisi yang diambil Truzzi?',
    a: 'Truzzi mengambil komisi 15% dari total biaya layanan. Ongkir dan reimbursement belanja sepenuhnya milik jastiper.',
  },
  {
    q: 'Mengapa akun saya ditangguhkan?',
    a: 'Akun dapat ditangguhkan karena pelanggaran ketentuan layanan, laporan pelanggan yang terverifikasi, atau masalah dokumen verifikasi. Hubungi CS untuk klarifikasi.',
  },
];

/** Pusat bantuan — persis help_center_screen.dart. */
export default function HelpCenter() {
  const navigate = useNavigate();
  const [openIdx, setOpenIdx] = useState<number | null>(null);

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
          <h1 className="text-white font-semibold">Pusat Bantuan</h1>
        </div>
      </div>

      <div className="px-5 py-5 space-y-6 max-w-lg mx-auto pb-8">
        {/* Search header */}
        <div>
          <h2 className="text-headline font-bold">Halo, ada yang bisa kami bantu?</h2>
          <input placeholder="Cari topik bantuan..." className="input-base mt-3" />
        </div>

        {/* FAQ */}
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="card overflow-hidden">
              <button
                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
              >
                <span className="font-semibold text-body2">{f.q}</span>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink-secondary transition-transform ${openIdx === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIdx === i && (
                <p className="px-4 pb-4 text-small text-ink-secondary leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>

        {/* Kontak */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/cs-chat')}
            className="card-pad flex flex-col items-center gap-2 hover:border-primary/40"
          >
            <span className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Headset size={20} />
            </span>
            <span className="text-small font-semibold">Live Chat</span>
          </button>
          <a
            href="mailto:support@truzzi.id"
            className="card-pad flex flex-col items-center gap-2 hover:border-primary/40"
          >
            <span className="w-10 h-10 rounded-full bg-warning/10 text-warning flex items-center justify-center">
              <Mail size={20} />
            </span>
            <span className="text-small font-semibold">Email CS</span>
            <span className="text-[11px] text-ink-secondary">support@truzzi.id</span>
          </a>
        </div>
      </div>
    </div>
  );
}

