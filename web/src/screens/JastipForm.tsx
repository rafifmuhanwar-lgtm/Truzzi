import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { ArrowLeft, MapPin, MapIcon, CheckCircle2, Globe } from '../components/icons';
import { consumeAddressPicked } from '../lib/address-picker';
import type { Address } from '../types';

/** Form Titip Belanja — versi bersih tanpa map rendering berat. */
export default function JastipForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();

  const stateData = (location.state as any) || {};

  const [item, setItem] = useState(stateData.item || '');
  const [notes, setNotes] = useState(stateData.notes || '');
  // Alamat Pembelian (Toko / Lokasi Jastip)
  const pickupAddress = stateData.pickup || '';

  // Alamat Pengantaran (Tujuan Rumah / Kantor)
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffData, setDropoffData] = useState<Partial<Address> | null>(null);
  const [dropoffMapLink, setDropoffMapLink] = useState('');

  useEffect(() => {
    const p = consumeAddressPicked();
    if (p) {
      setTimeout(() => {
        setDropoffAddress(p.address);
        setDropoffData(p.data ?? null);
      }, 0);
    }
  }, []);

  const submit = () => {
    if (!item.trim()) return enqueueSnackbar('Detail barang harus diisi', { variant: 'error' });
    if (!dropoffAddress.trim())
      return enqueueSnackbar('Alamat pengantaran tujuan harus diisi', { variant: 'error' });

    // Gabungkan link maps / patokan ke notes jika ada
    let combinedNotes = notes.trim();
    if (dropoffMapLink.trim()) {
      combinedNotes += `\n[Link Maps Tujuan]: ${dropoffMapLink.trim()}`;
    }

    navigate('/jastip/summary', {
      state: {
        item: item.trim(),
        tripTitle: stateData.tripTitle || '',
        budget: stateData.budget || '0',
        notes: combinedNotes,
        pickup: pickupAddress.trim() || 'Sesuai kesepakatan Jastiper',
        pickupLat: -6.2383,
        pickupLng: 106.9756,
        dropoff: dropoffAddress.trim(),
        dropoffData: dropoffData ?? null,
        ongkirCustom: stateData.ongkirCustom,
        jastiperId: stateData.jastiperId,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-border">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Titip Belanja</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-5 py-5 space-y-5 pb-28">
        {/* Barang */}
        <section>
          <h2 className="text-sm font-bold text-ink">Barang yang Mau Dititip</h2>
          <div className="card mt-2 p-4 space-y-3 bg-surface border border-border">
            <textarea
              value={item}
              onChange={(e) => setItem(e.target.value)}
              rows={3}
              placeholder="Cth: Roti Unyil Venus Box Isi 10 Mix, Bolen Pisang Kartika Sari..."
              className="w-full bg-transparent text-xs text-ink focus:outline-none resize-none placeholder:text-ink-secondary/60 leading-relaxed"
            />
          </div>
        </section>

        {/* Lokasi Pengantaran */}
        <section>
          <h2 className="text-sm font-bold text-ink">Lokasi Pengantaran</h2>
          <div className="card mt-2 p-4 space-y-4 bg-surface border border-border">
            {/* Alamat Pengantaran Tujuan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Alamat Pengantaran Tujuan *</span>
                </label>
                <button
                  type="button"
                  onClick={() =>
                    navigate('/jastip/delivery-address', { state: { from: 'jastip' } })
                  }
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <MapIcon className="w-3.5 h-3.5" /> Pilih Alamat Tersimpan
                </button>
              </div>

              <textarea
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                rows={2}
                placeholder="Cth: Jl. Melati No. 15 Blok C, RT 02/05, Bekasi Barat (Pagar hitam samping pos satpam)"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary resize-none"
              />

              <div className="flex items-center gap-1.5 bg-background/60 border border-border/70 rounded-lg px-2.5 py-1.5 mt-1">
                <Globe className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
                <input
                  value={dropoffMapLink}
                  onChange={(e) => setDropoffMapLink(e.target.value)}
                  placeholder="Link Google Maps tujuan (opsional: shareloc rumah)"
                  className="w-full bg-transparent text-[11px] text-ink placeholder:text-ink-secondary/50 focus:outline-none"
                />
              </div>

              {dropoffData && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    Tersambung ke alamat tersimpan: <strong>{dropoffData.label || 'Utama'}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Catatan */}
        <section>
          <h2 className="text-sm font-bold text-ink">Catatan Tambahan (Opsional)</h2>
          <div className="card mt-2 p-3 bg-surface border border-border">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Cth: Tolong belikan yang rasa keju & jangan lupa minta bon/struk jika ada..."
              className="w-full bg-transparent text-xs text-ink focus:outline-none resize-none placeholder:text-ink-secondary/60 leading-relaxed"
            />
          </div>
        </section>
      </div>

      {/* Bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white px-6 pt-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
        <div className="max-w-lg mx-auto">
          <button className="btn-primary" onClick={submit}>
            Lanjut ke Rincian
          </button>
        </div>
      </div>
    </div>
  );
}
