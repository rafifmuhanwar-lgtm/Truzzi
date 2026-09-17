import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { formatInputThousands, parseRupiah } from '../lib/format';
import { ArrowLeft, Store, MapPin, Bike, PlusCircle, Globe, MapIcon, CheckCircle2 } from '../components/icons';
import { consumeAddressPicked } from '../lib/address-picker';
import type { Address } from '../types';

function useFileInput() {
  const ref = useRef<HTMLInputElement>(null);
  const open = () => ref.current?.click();
  return { ref, open };
}

/** Form Suruh Jastiper — versi ringan & clean tanpa Leaflet. */
export default function SuruhForm() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInput = useFileInput();

  const [task, setTask] = useState('');
  const [notes, setNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [taskImage, setTaskImage] = useState<string | null>(null);

  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupMapLink, setPickupMapLink] = useState('');

  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffMapLink, setDropoffMapLink] = useState('');
  const [dropoffData, setDropoffData] = useState<Partial<Address> | null>(null);

  useEffect(() => {
    const p = consumeAddressPicked();
    if (p) {
      setDropoffAddress(p.address);
      setDropoffData(p.data ?? null);
    }
  }, []);

  const submit = () => {
    if (!task.trim()) return enqueueSnackbar('Tugas harus diisi', { variant: 'error' });
    if (!pickupAddress.trim() || !dropoffAddress.trim()) return enqueueSnackbar('Lokasi Penjemputan dan Tujuan harus diisi', { variant: 'error' });
    const budgetRaw = parseRupiah(budget);

    let combinedNotes = notes.trim();
    if (pickupMapLink.trim()) combinedNotes += `\n[Shareloc Jemput]: ${pickupMapLink.trim()}`;
    if (dropoffMapLink.trim()) combinedNotes += `\n[Shareloc Tujuan]: ${dropoffMapLink.trim()}`;

    navigate('/suruh/summary', {
      state: {
        task: task.trim(),
        budget: budgetRaw > 0 ? String(budgetRaw) : '20000',
        notes: combinedNotes,
        pickup: pickupAddress.trim(),
        pickupLat: -6.2383,
        pickupLng: 106.9756,
        dropoff: dropoffAddress.trim(),
        dropoffData: dropoffData ?? null,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Suruh Jastiper</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 space-y-6 pb-28">
        {/* Header card */}
        <div className="bg-primary/8 rounded-2xl p-4 flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-primary"><Bike className="w-7 h-7 text-white" /></span>
          <div>
            <p className="font-semibold">Suruh Jastiper</p>
            <p className="text-xs text-ink-secondary">Jastiper siap bantuin tugas kamu</p>
          </div>
        </div>

        {/* Tugas */}
        <section>
          <h2 className="text-base font-bold">Tugas yang perlu dilakukan</h2>
          <div className="card mt-3 p-4 space-y-3">
            <textarea
              value={task}
              onChange={(e) => setTask(e.target.value)}
              rows={3}
              placeholder="Contoh: Ambil paket di JNE, antar dokumen ke kantor..."
              className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-ink-secondary/60"
            />
            <div className="h-px bg-divider" />
            <button
              onClick={() => fileInput.open()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-border text-primary text-sm"
            >
              {taskImage ? (
                <>
                  <img src={taskImage} alt="foto tugas" className="w-8 h-8 rounded-lg object-cover" />
                  Ganti Foto
                  <button
                    onClick={(e) => { e.stopPropagation(); setTaskImage(null); }}
                    aria-label="Hapus foto"
                  >
                    <span className="w-4 h-4">✕</span>
                  </button>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" /> Tambah Foto Tugas atau Lokasi
                </>
              )}
            </button>
          </div>
        </section>

        {/* Lokasi */}
        <section>
          <h2 className="text-base font-bold">Lokasi Penjemputan &amp; Pengiriman</h2>
          <div className="card mt-3 p-4 space-y-4">
            {/* Lokasi Jemput */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Store className="w-4 h-4 text-primary shrink-0" />
                <span>Lokasi Penjemputan / Titik Awal *</span>
              </label>
              <input
                value={pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                placeholder="Cth: Kantor Pos Bekasi / Warung Kopi Sejahtera"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary"
              />
              <div className="flex items-center gap-1.5 bg-background/60 border border-border/70 rounded-lg px-2.5 py-1.5 mt-1">
                <Globe className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
                <input
                  value={pickupMapLink}
                  onChange={(e) => setPickupMapLink(e.target.value)}
                  placeholder="Link Google Maps / Shareloc (opsional: https://maps.app...)"
                  className="w-full bg-transparent text-[11px] text-ink placeholder:text-ink-secondary/50 focus:outline-none"
                />
              </div>
            </div>

            <div className="h-px bg-divider/60" />

            {/* Lokasi Tujuan */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Lokasi Tujuan / Pengantaran *</span>
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/jastip/delivery-address', { state: { from: 'suruh' } })}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
                >
                  <MapIcon className="w-3.5 h-3.5" /> Pilih Alamat Tersimpan
                </button>
              </div>

              <textarea
                value={dropoffAddress}
                onChange={(e) => setDropoffAddress(e.target.value)}
                rows={2}
                placeholder="Cth: Jl. Dahlia No. 12, Perumahan Galaxy Bekasi (Titipkan ke Satpam)"
                className="w-full bg-background border border-border rounded-xl px-3.5 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary resize-none"
              />

              <div className="flex items-center gap-1.5 bg-background/60 border border-border/70 rounded-lg px-2.5 py-1.5 mt-1">
                <Globe className="w-3.5 h-3.5 text-ink-secondary shrink-0" />
                <input
                  value={dropoffMapLink}
                  onChange={(e) => setDropoffMapLink(e.target.value)}
                  placeholder="Link Google Maps / Shareloc tujuan (opsional)"
                  className="w-full bg-transparent text-[11px] text-ink placeholder:text-ink-secondary/50 focus:outline-none"
                />
              </div>

              {dropoffData && (
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">Tersambung ke alamat tersimpan: <strong>{dropoffData.label || 'Utama'}</strong></span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Estimasi budget */}
        <section>
          <h2 className="text-base font-bold">Estimasi Budget Tugas</h2>
          <p className="text-xs text-ink-secondary mt-1">Biaya jasa tugas/pekerjaan yang akan dibayarkan ke jastiper.</p>
          <div className="card mt-3 flex items-center px-4 py-2">
            <span className="bg-primary/10 rounded-lg px-2.5 py-1 font-bold text-lg text-primary mr-3">Rp</span>
            <input
              value={budget}
              onChange={(e) => setBudget(formatInputThousands(e.target.value))}
              inputMode="numeric"
              placeholder="20.000"
              className="w-full bg-transparent text-2xl font-bold tracking-wider focus:outline-none placeholder:text-ink-secondary/30"
            />
          </div>
        </section>

        {/* Catatan */}
        <section>
          <h2 className="text-base font-bold">Catatan Tambahan (Opsional)</h2>
          <div className="card mt-3 p-4">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Contoh: titipkan ke resepsionis, jam 5 sore..."
              className="w-full bg-transparent text-sm focus:outline-none resize-none placeholder:text-ink-secondary/60"
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

      <input
        ref={fileInput.ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setTaskImage(URL.createObjectURL(f));
        }}
      />
    </div>
  );
}
