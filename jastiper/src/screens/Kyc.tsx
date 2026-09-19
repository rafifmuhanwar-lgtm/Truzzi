import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Camera, CheckCircle2 } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';

type Region = { code: string; name: string };

const VEHICLE_TYPES = [
  { value: 'Motor', label: 'Motor' },
  { value: 'Mobil', label: 'Mobil' },
  { value: 'bebas', label: 'Lainnya' },
];

/** KYC — verifikasi identitas + data kendaraan & alamat domisili (digabung dari onboarding). */
export default function Kyc() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser } = useAuthStore();

  // Onboarding fields (merged here)
  const [vehicleType, setVehicleType] = useState(user?.vehicleType ?? '');
  const [plate, setPlate] = useState(user?.vehiclePlate ?? '');
  const [area] = useState(user?.selectedArea ?? '');

  // Region states
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);

  const [selectedProv, setSelectedProv] = useState('');
  const [selectedReg, setSelectedReg] = useState('');
  const [selectedDist, setSelectedDist] = useState('');
  const [selectedVill, setSelectedVill] = useState('');

  // Fetch Provinces
  useEffect(() => {
    fetch('/wilayah/api/provinces.json')
      .then((res) => res.json())
      .then((res) => setProvinces(res.data || []))
      .catch(console.error);
  }, []);

  // Fetch Regencies
  useEffect(() => {
    if (!selectedProv) {
      setRegencies([]);
      setSelectedReg('');
      setDistricts([]);
      setSelectedDist('');
      setVillages([]);
      setSelectedVill('');
      return;
    }
    fetch(`/wilayah/api/regencies/${selectedProv}.json`)
      .then((res) => res.json())
      .then((res) => setRegencies(res.data || []))
      .catch(console.error);
  }, [selectedProv]);

  // Fetch Districts
  useEffect(() => {
    if (!selectedReg) {
      setDistricts([]);
      setSelectedDist('');
      setVillages([]);
      setSelectedVill('');
      return;
    }
    fetch(`/wilayah/api/districts/${selectedReg}.json`)
      .then((res) => res.json())
      .then((res) => setDistricts(res.data || []))
      .catch(console.error);
  }, [selectedReg]);

  // Fetch Villages
  useEffect(() => {
    if (!selectedDist) {
      setVillages([]);
      setSelectedVill('');
      return;
    }
    fetch(`/wilayah/api/villages/${selectedDist}.json`)
      .then((res) => res.json())
      .then((res) => setVillages(res.data || []))
      .catch(console.error);
  }, [selectedDist]);

  // KYC fields
  const [ktpUrl, setKtpUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const ktpRef = useRef<HTMLInputElement>(null);
  const selfieRef = useRef<HTMLInputElement>(null);

  async function pickAndUpload(file: File | undefined, kind: 'ktp' | 'selfie') {
    if (!file) return;
    setUploading(true);
    try {
      const res = await API.upload(file);
      if (kind === 'ktp') setKtpUrl(res.url);
      else setSelfieUrl(res.url);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengupload foto'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    // Validate onboarding fields
    if (!vehicleType) {
      enqueueSnackbar('Pilih tipe kendaraan', { variant: 'warning' });
      return;
    }
    if (vehicleType !== 'bebas' && !plate.trim()) {
      enqueueSnackbar('Masukkan plat nomor kendaraan', { variant: 'warning' });
      return;
    }
    if (!selectedVill) {
      enqueueSnackbar('Pilih alamat domisili hingga tingkat Desa/Kelurahan', {
        variant: 'warning',
      });
      return;
    }

    // Construct full address string
    const provName = provinces.find((p) => p.code === selectedProv)?.name || '';
    const regName = regencies.find((p) => p.code === selectedReg)?.name || '';
    const distName = districts.find((p) => p.code === selectedDist)?.name || '';
    const villName = villages.find((p) => p.code === selectedVill)?.name || '';
    const fullArea = `${villName}, ${distName}, ${regName}, ${provName}`;

    // Validate KYC
    if (!ktpUrl || !selfieUrl) {
      enqueueSnackbar('Harap foto KTP dan Selfie terlebih dahulu', { variant: 'warning' });
      return;
    }

    setUploading(true);
    try {
      // Save profile data first (vehicle, plate, area)
      await API.jastiper.updateProfile({
        vehicleType,
        vehiclePlate: vehicleType === 'bebas' ? '-' : plate.trim().toUpperCase(),
        selectedArea: area || fullArea,
      });

      // Then submit KYC
      const data = await API.jastiper.kyc({ ktpUrl, selfieUrl });
      setUser(data.user);
      enqueueSnackbar('Data berhasil dikirim. Menunggu verifikasi admin.', { variant: 'info' });
      navigate('/kyc-pending', { replace: true });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal menyimpan data'), { variant: 'error' });
    } finally {
      setUploading(false);
    }
  }

  function PhotoSlot({
    label,
    hint,
    url,
    inputRef,
    onPick,
  }: {
    label: string;
    hint: string;
    url: string | null;
    inputRef: React.RefObject<HTMLInputElement>;
    onPick: (f?: File) => void;
  }) {
    return (
      <div>
        <h3 className="font-semibold text-ink">{label}</h3>
        <p className="text-small text-ink-secondary mt-0.5">{hint}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={`mt-2 w-full aspect-[4/3] rounded-card border-2 border-dashed overflow-hidden flex items-center justify-center transition-colors ${
            url ? 'border-success bg-success/5' : 'border-border bg-white hover:border-primary'
          }`}
        >
          {url ? (
            <img src={url} alt={label} className="w-full h-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-ink-secondary">
              <Camera size={32} />
              <span className="text-sm">Tap untuk ambil foto</span>
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-4 pt-4 pb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-white rounded-full hover:bg-white/10"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white text-display font-bold mt-2">Lengkapi Data & Verifikasi</h1>
        <p className="text-white/70 text-body2 mt-1">
          Isi data dan verifikasi identitas sebelum bisa bertugas.
        </p>
      </div>

      <div className="flex-1 px-6 py-8 space-y-6 max-w-lg w-full mx-auto">
        {/* ── Data Kendaraan ── */}
        <div>
          <label className="text-sm font-semibold text-ink">Tipe Kendaraan</label>
          <div className="flex gap-2 mt-2">
            {VEHICLE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => {
                  setVehicleType(t.value);
                  if (t.value === 'Ojol') setPlate('');
                }}
                className={`flex-1 h-12 rounded-btn border-2 font-semibold text-sm transition-colors ${
                  vehicleType === t.value
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-white text-ink-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {vehicleType === 'bebas' && (
            <p className="text-xs text-ink-secondary mt-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              Kamu bisa pakai ojek online, nebeng, naik sepeda, atau cara lain untuk mengantarkan
              pesanan.
            </p>
          )}
        </div>

        {vehicleType !== 'bebas' && (
          <div>
            <label className="text-sm font-semibold text-ink">Plat Nomor</label>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Contoh: B 1234 XYZ"
              className="input-base mt-2 uppercase"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-ink">Alamat Domisili</label>
          <div className="space-y-3 mt-2">
            <select
              value={selectedProv}
              onChange={(e) => setSelectedProv(e.target.value)}
              className="input-base"
            >
              <option value="">Pilih Provinsi...</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedReg}
              onChange={(e) => setSelectedReg(e.target.value)}
              disabled={!selectedProv}
              className="input-base"
            >
              <option value="">Pilih Kota/Kabupaten...</option>
              {regencies.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedDist}
              onChange={(e) => setSelectedDist(e.target.value)}
              disabled={!selectedReg}
              className="input-base"
            >
              <option value="">Pilih Kecamatan...</option>
              {districts.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={selectedVill}
              onChange={(e) => setSelectedVill(e.target.value)}
              disabled={!selectedDist}
              className="input-base"
            >
              <option value="">Pilih Desa/Kelurahan...</option>
              {villages.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </select>

            {area && !selectedProv && (
              <p className="text-xs text-ink-secondary mt-1">
                Domisili saat ini: <strong>{area}</strong>. Silakan pilih ulang jika ingin mengubah.
              </p>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-ink-secondary font-medium">Verifikasi Identitas</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* ── KYC Photos ── */}
        <PhotoSlot
          label="Foto KTP"
          hint="Ambil foto KTP jelas dan terbaca"
          url={ktpUrl}
          inputRef={ktpRef}
          onPick={(f) => void pickAndUpload(f, 'ktp')}
        />
        <PhotoSlot
          label="Foto Selfie"
          hint="Selfie sambil memegang KTP"
          url={selfieUrl}
          inputRef={selfieRef}
          onPick={(f) => void pickAndUpload(f, 'selfie')}
        />

        <button onClick={handleSubmit} disabled={uploading} className="btn-primary">
          {uploading ? 'Menyimpan...' : 'Kirim & Verifikasi'}
        </button>

        {kycDone(ktpUrl, selfieUrl) && (
          <p className="flex items-center justify-center gap-1.5 text-small text-success">
            <CheckCircle2 size={14} /> Foto siap dikirim
          </p>
        )}
      </div>
    </div>
  );
}

function kycDone(ktp: string | null, selfie: string | null): boolean {
  return Boolean(ktp && selfie);
}
