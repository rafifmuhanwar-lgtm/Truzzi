import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from '../components/icons';
import { TITIP_IDEAS, SURUH_IDEAS, type InspirationDef } from '../lib/inspirations';

/** Halaman "Lihat Semua" untuk Inspirasi Titip & Suruh Jastiper. */
export default function InspirationsScreen() {
  const navigate = useNavigate();
  const { state } = useLocation() as {
    state?: { service?: 'titip' | 'suruh' | 'all'; selected?: InspirationDef | null };
  };
  const service = state?.service ?? 'all';
  const preselected = state?.selected ?? null;

  const [selected, setSelected] = useState<InspirationDef | null>(preselected);

  const showTitip = service === 'all' || service === 'titip';
  const showSuruh = service === 'all' || service === 'suruh';

  const titipSection = showTitip && TITIP_IDEAS.length > 0;
  const suruhSection = showSuruh && SURUH_IDEAS.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">
          {service === 'titip' ? 'Inspirasi Titip Jastiper' : service === 'suruh' ? 'Inspirasi Suruh Jastiper' : 'Inspirasi Jastiper'}
        </h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 pb-16 space-y-7">
        {titipSection && (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Titip Jastiper</h2>
                <p className="text-xs text-ink-secondary mt-0.5">Barang yang mau dibeliin</p>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              {TITIP_IDEAS.map((s) => (
                <InspirationCard key={s.title} item={s} onOpen={setSelected} />
              ))}
            </div>
          </section>
        )}

        {suruhSection && (
          <section>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Suruh Jastiper</h2>
                <p className="text-xs text-ink-secondary mt-0.5">Aksi yang jastiper kerjakan</p>
              </div>
            </div>
            <div className="mt-3.5 grid grid-cols-2 gap-3">
              {SURUH_IDEAS.map((s) => (
                <InspirationCard key={s.title} item={s} onOpen={setSelected} />
              ))}
            </div>
          </section>
        )}

        {!titipSection && !suruhSection && (
          <p className="text-center text-sm text-ink-secondary py-12">Belum ada inspirasi.</p>
        )}
      </div>

      <InspirationSheet item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

/** Kartu inspirasi vertikal — header gradient + ikon, badan teks + CTA. */
function InspirationCard({ item, onOpen }: { item: InspirationDef; onOpen: (i: InspirationDef) => void }) {
  const Icon = item.icon;
  return (
    <button onClick={() => onOpen(item)} className="card p-4 flex items-center gap-3 text-left hover:shadow-soft transition-shadow">
      <span className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${item.color}1A` }}>
        <Icon className="w-[22px] h-[22px]" style={{ color: item.color }} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold truncate">{item.title}</p>
        <p className="text-[10px] text-ink-secondary truncate">{item.subtitle}</p>
        <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold" style={{ color: item.color }}>
          Lihat Detail
        </span>
      </div>
    </button>
  );
}

/** Bottom sheet detail inspirasi. */
function InspirationSheet({ item, onClose }: { item: InspirationDef | null; onClose: () => void }) {
  const navigate = useNavigate();
  if (!item) return null;
  const IconCmp = item.icon;
  const isTitip = item.service === 'titip';

  return (
    <div className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        <div className="flex justify-center pt-3">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-6 flex items-center gap-4 relative overflow-hidden" style={{ backgroundColor: item.color }}>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <span className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/25 text-white shrink-0">
            <IconCmp className="w-9 h-9" />
          </span>
          <div className="flex-1 min-w-0 relative z-10">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/25 text-white text-xs font-semibold">
              {isTitip ? 'TITIP KURIR' : 'SURUH KURIR'}
            </span>
            <p className="text-white text-xl font-bold font-sans leading-snug mt-2.5">{item.title}</p>
            <p className="text-white/85 text-sm mt-1 leading-relaxed">{item.subtitle}</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="font-bold text-sm mb-2">Tentang</h3>
            <ul className="space-y-1.5">
              {item.about.map((a, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ backgroundColor: item.color }} />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-2">Contoh yang bisa</h3>
            <ul className="space-y-1.5">
              {item.contoh.map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-ink-secondary leading-relaxed">
                  <span className="w-1 h-1 rounded-full bg-ink-secondary/50 shrink-0 mt-1.5" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="p-6 pt-0 space-y-2.5">
          <button
            onClick={() => {
              onClose();
              navigate(isTitip ? '/jastip' : '/suruh');
            }}
            className="btn-primary flex items-center justify-center gap-2 !h-[50px]"
            style={{ backgroundColor: item.color }}
          >
            <IconCmp className="w-4 h-4" />
            {isTitip ? 'Titip Sekarang' : 'Suruh Sekarang'}
          </button>
          <button onClick={onClose} className="btn-outline flex-1 !h-[46px] !border-border !bg-background !text-ink-secondary">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

