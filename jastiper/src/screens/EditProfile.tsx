import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { ArrowLeft, Camera } from 'lucide-react';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';

const VEHICLE_TYPES = ['Motor', 'Mobil', 'Sepeda'];
const AREAS = [
  'Jakarta Pusat',
  'Jakarta Utara',
  'Jakarta Barat',
  'Jakarta Selatan',
  'Jakarta Timur',
  'Tangerang',
  'Kota Bekasi',
  'Kabupaten Bekasi',
  'Depok',
  'Bogor',
];

/** Edit profil — persis edit_profile_screen.dart: dropdown kendaraan/area lebih luas dari onboarding. */
export default function EditProfile() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser } = useAuthStore();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [vehicleType, setVehicleType] = useState(user?.vehicleType ?? '');
  const [plate, setPlate] = useState(user?.vehiclePlate ?? '');
  const [area, setArea] = useState(user?.selectedArea ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const [saving, setSaving] = useState(false);

  const photoRef = useRef<HTMLInputElement>(null);

  async function pickPhoto(file: File | undefined) {
    if (!file) return;
    setSaving(true);
    try {
      const res = await API.upload(file);
      setPhotoUrl(res.url);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengupload foto'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (name.trim().length < 3) {
      enqueueSnackbar('Nama minimal 3 karakter', { variant: 'warning' });
      return;
    }
    if (!phone.startsWith('08')) {
      enqueueSnackbar('Nomor telepon harus diawali 08', { variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const data = await API.jastiper.updateProfile({
        name: name.trim(),
        phone,
        vehicleType,
        vehiclePlate: plate.trim().toUpperCase(),
        selectedArea: area,
        ...(photoUrl ? { photoUrl } : {}),
      });
      setUser(data.user);
      enqueueSnackbar('Profil berhasil diperbarui', { variant: 'success' });
      navigate(-1);
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal memperbarui profil'), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  }

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
          <h1 className="text-white font-semibold">Edit Profil</h1>
        </div>
      </div>

      <div className="px-5 py-6 space-y-5 max-w-lg mx-auto pb-8">
        {/* Foto */}
        <input
          ref={photoRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void pickPhoto(e.target.files?.[0])}
        />
        <div className="flex justify-center">
          <button type="button" onClick={() => photoRef.current?.click()} className="relative">
            <span className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-primary/30">
              {photoUrl ? (
                <img src={photoUrl} alt="foto" className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary text-2xl font-bold">{(name || 'K').charAt(0)}</span>
              )}
            </span>
            <span className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white">
              <Camera size={13} />
            </span>
          </button>
        </div>

        {/* Nama */}
        <div>
          <label className="text-sm font-semibold text-ink">Nama Lengkap</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-base mt-1.5"
          />
        </div>

        {/* Email read-only */}
        <div>
          <label className="text-sm font-semibold text-ink">Email</label>
          <input value={user?.email ?? ''} disabled className="input-base mt-1.5 opacity-60" />
        </div>

        {/* Telepon */}
        <div>
          <label className="text-sm font-semibold text-ink">Nomor Telepon</label>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="08xxxxxxxxxx"
            className="input-base mt-1.5"
          />
        </div>

        {/* Kendaraan */}
        <div>
          <label className="text-sm font-semibold text-ink">Tipe Kendaraan</label>
          <select
            value={vehicleType}
            onChange={(e) => setVehicleType(e.target.value)}
            className="input-base mt-1.5"
          >
            <option value="">Pilih...</option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-semibold text-ink">Plat Nomor</label>
          <input
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder="Contoh: B 1234 XYZ"
            className="input-base mt-1.5 uppercase"
          />
        </div>

        {/* Area */}
        <div>
          <label className="text-sm font-semibold text-ink">Area Tugas</label>
          <select
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="input-base mt-1.5"
          >
            <option value="">Pilih area...</option>
            {AREAS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <button onClick={() => void handleSave()} disabled={saving} className="btn-primary">
          {saving ? 'Menyimpan...' : 'Simpan Profil'}
        </button>
      </div>
    </div>
  );
}

