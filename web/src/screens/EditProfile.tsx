import { useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';
import { API, errMsg } from '../lib/api';
import { ArrowLeft, Camera, User as UserIcon } from '../components/icons';

export default function EditProfile() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { user, setUser, updateProfile } = useProfile();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [area, setArea] = useState(user?.selectedArea ?? 'Kota Bekasi');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const uploadPic = async (f: File) => {
    try {
      const res = await API.upload(f);
      setPhotoUrl(res.url);
      enqueueSnackbar('Foto berhasil diunggah', { variant: 'success' });
    } catch (e) {
      enqueueSnackbar(errMsg(e, 'Gagal mengunggah foto'), { variant: 'error' });
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 3)
      return enqueueSnackbar('Nama minimal 3 karakter', { variant: 'error' });
    setSaving(true);
    try {
      const updated = await updateProfile({
        name: name.trim(),
        phone,
        selectedArea: area,
        photoUrl,
      });
      setUser(updated);
      enqueueSnackbar('Profil berhasil diperbarui', { variant: 'success' });
      navigate(-1);
    } catch (err) {
      enqueueSnackbar(errMsg(err), { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali">
          <ArrowLeft className="w-6 h-6 text-ink" />
        </button>
        <h1 className="font-semibold text-base">Edit Profil</h1>
      </header>

      <div className="flex-1 max-w-md w-full mx-auto px-6 py-6">
        <div className="flex justify-center">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative"
            aria-label="Ubah foto profil"
          >
            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <span className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-primary" />
              </span>
            )}
            <span className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-primary border-4 border-background flex items-center justify-center">
              <Camera className="w-4 h-4 text-white" />
            </span>
          </button>
        </div>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nama Lengkap</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nama kamu"
              className="input-base"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <input value={user?.email ?? ''} disabled className="input-base opacity-60" />
            <p className="text-xs text-ink-secondary mt-1">Email tidak dapat diubah.</p>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Nomor Telepon</label>
            <input
              value={phone ?? ''}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="input-base"
              type="tel"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Area</label>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="input-base">
              <option value="Kota Bekasi">Kota Bekasi</option>
              <option value="Kabupaten Bekasi">Kabupaten Bekasi</option>
              <option value="Jakarta">Jakarta</option>
            </select>
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </form>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadPic(f);
        }}
      />
    </div>
  );
}

function useProfile() {
  const user = useAuthStore((s) => s.user);
  const setUserStore = useAuthStore((s) => s.setUser);
  const updateProfile = async (data: {
    name?: string;
    phone?: string;
    selectedArea?: string;
    photoUrl?: string;
  }) => {
    const res = await API.auth.updateProfile(data);
    return res.user;
  };
  return { user, setUser: setUserStore, updateProfile };
}
