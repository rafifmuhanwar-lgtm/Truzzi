import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { ArrowLeft, Save, MapPin, Clock, ShoppingBag, User, Info, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';


export default function JastipRegister() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    bio: '',
    area: '',
    category: 'Kuliner',
    feeEstimate: '',
    flatOngkir: 10000,
    photoUrl: user?.photoUrl ?? '',
    coverUrl: '',
    openTripTitle: '',
    openTripDestination: '',
    openTripSchedule: '',
    openTripClosing: '',
    isJastipActive: true,
  });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load existing profile
  const { data: jastiperData, isLoading } = useQuery({
    queryKey: ['jastiper-me'],
    queryFn: () => API.jastipProfile.me(),
    retry: false,
  });

  useEffect(() => {
    if (jastiperData?.jastiper) {
      const j = jastiperData.jastiper;
      setForm({
        name: j.name ?? user?.name ?? '',
        bio: j.bio ?? '',
        area: j.area ?? '',
        category: j.category ?? 'Kuliner',
        feeEstimate: j.feeEstimate ?? '',
        flatOngkir: j.flatOngkir ?? 10000,
        photoUrl: j.photoUrl ?? user?.photoUrl ?? '',
        coverUrl: j.coverUrl ?? '',
        openTripTitle: j.openTripTitle ?? '',
        openTripDestination: j.openTripDestination ?? '',
        openTripSchedule: j.openTripSchedule ?? '',
        openTripClosing: j.openTripClosing ?? '',
        isJastipActive: j.isJastipActive !== false,
      });
    }
  }, [jastiperData, user]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast('Nama jastiper wajib diisi', 'error');
      return;
    }
    setSaving(true);
    try {
      const isNew = !jastiperData?.isJastiper;
      if (isNew) {
        await API.jastipProfile.register(form);
        showToast('Profil jastiper berhasil dibuat! 🎉');
      } else {
        await API.jastipProfile.update(form);
        showToast('Profil jastiper berhasil diperbarui');
      }
      qc.invalidateQueries({ queryKey: ['jastiper-me'] });
      setTimeout(() => navigate(-1), 1200);
    } catch (e) {
      showToast(errMsg(e, 'Gagal menyimpan profil'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof typeof form, value: string | boolean) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99] px-4 py-2.5 rounded-2xl text-white text-xs font-semibold shadow-xl max-w-[320px] text-center ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-primary px-4 pt-4 pb-5 flex items-center gap-3 sticky top-0 z-20">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all"
          aria-label="Kembali"
        >
          <ArrowLeft size={20} className="text-white" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-base text-white leading-tight">
            {jastiperData?.isJastiper ? 'Edit Profil Jastiper' : 'Daftar Jadi Jastiper'}
          </h1>
          <p className="text-white/75 text-[11px]">Atur info trip & profil publikmu</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center pt-20">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4 pb-24">
          {/* Info banner */}
          {!jastiperData?.isJastiper && (
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3.5 flex gap-3 items-start">
              <Info size={16} className="text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-primary leading-relaxed">
                Isi data ini untuk membuka mode Jastiper. Setelah terdaftar, profilmu akan tampil di halaman explore customer Truzzi.
              </p>
            </div>
          )}

          {/* Section: Profil Dasar */}
          <div className="card-pad space-y-3">
            <h2 className="font-bold text-xs text-ink flex items-center gap-1.5 border-b border-border pb-2">
              <User size={14} className="text-primary" /> Profil Jastiper
            </h2>
            <div>
              <label className="text-[11px] font-semibold text-ink-secondary">Nama Jastiper / Brand *</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Cth: Siti & Tim Jastip Bogor"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-secondary">Bio / Deskripsi Singkat</label>
              <textarea
                value={form.bio}
                onChange={(e) => update('bio', e.target.value)}
                placeholder="Cth: Spesialis kuliner legendaris Kota Hujan Bogor. Tiap hari ambil fresh langsung dari pabrik!"
                rows={3}
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1 resize-none"
              />
            </div>


            <div>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-ink-secondary">Tarif Ongkir Antar (Flat per Trip)</label>
                <span className="text-[10px] font-bold text-primary">Maks. Rp 25.000</span>
              </div>
              <div className="relative mt-1">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-ink-secondary">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.flatOngkir !== undefined ? new Intl.NumberFormat('id-ID').format(form.flatOngkir) : ''}
                  onChange={(e) => {
                    const rawVal = e.target.value.replace(/\D/g, '');
                    let val = Number(rawVal) || 0;
                    if (val > 25000) {
                      showToast('Tarif maksimal adalah Rp 25.000', 'error');
                      val = 25000;
                    }
                    update('flatOngkir', Math.max(0, val) as any);
                  }}
                  placeholder="10.000"
                  className="w-full bg-background border border-border rounded-xl pl-9 pr-3 py-2.5 text-xs text-ink font-semibold focus:outline-none focus:border-primary"
                />
              </div>
              <p className="text-[10px] text-ink-secondary mt-1">
                Ongkir flat yang dibayar customer saat checkout untuk diantar sampai tujuan oleh jastiper/jastiper.
              </p>
            </div>
          </div>

          {/* Section: Banner / Cover Trip */}
          <div className="card-pad space-y-3">
            <h2 className="font-bold text-xs text-ink flex items-center gap-1.5 border-b border-border pb-2">
              <ImageIcon size={14} className="text-primary" /> Foto Banner / Cover Trip
            </h2>
            <div className="space-y-2">
              <div className="relative h-32 w-full rounded-2xl overflow-hidden bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center border border-border">
                {form.coverUrl ? (
                  <>
                    <img src={form.coverUrl} alt="Trip Cover Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30" />
                    <button
                      type="button"
                      onClick={() => update('coverUrl', '')}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-all"
                      title="Hapus Banner"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                ) : (
                  <div className="text-center text-white/80 space-y-1">
                    <ImageIcon size={28} className="mx-auto opacity-70" />
                    <p className="text-[11px]">Belum ada foto banner trip</p>
                  </div>
                )}
              </div>
              <label
                className={`w-full py-2 px-3 rounded-xl border border-dashed border-primary/50 bg-primary/5 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-primary/10 transition-all ${
                  uploadingCover ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <Camera size={14} />
                <span>{uploadingCover ? 'Mengunggah foto...' : form.coverUrl ? 'Ganti Foto Banner' : 'Upload Foto Banner Trip'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setUploadingCover(true);
                    try {
                      const up = await API.upload(file);
                      const fileUrl = up.url || up.fileUrl;
                      update('coverUrl', fileUrl);
                      showToast('Foto banner berhasil diunggah! 📸');
                    } catch (err) {
                      showToast(errMsg(err, 'Gagal mengunggah foto banner'), 'error');
                    } finally {
                      setUploadingCover(false);
                    }
                  }}
                  className="hidden"
                />
              </label>
              <p className="text-[10px] text-ink-secondary leading-tight">
                Tips: Pasang foto toko/mall atau makanan khas yang akan kamu kunjungi untuk menarik perhatian customer.
              </p>
            </div>
          </div>

          {/* Section: Info Trip Aktif */}
          <div className="card-pad space-y-3">
            <h2 className="font-bold text-xs text-ink flex items-center gap-1.5 border-b border-border pb-2">
              <MapPin size={14} className="text-primary" /> Info Trip Aktif
            </h2>
            <div>
              <label className="text-[11px] font-semibold text-ink-secondary">Judul Trip</label>
              <input
                value={form.openTripTitle}
                onChange={(e) => update('openTripTitle', e.target.value)}
                placeholder="Cth: Open Jastip Kuliner Bogor Fresh!"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-ink-secondary">Destinasi / Lokasi Belanja</label>
              <input
                value={form.openTripDestination}
                onChange={(e) => update('openTripDestination', e.target.value)}
                placeholder="Cth: Bogor Pajajaran & Sukasari"
                className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-ink-secondary">
                  <Clock size={11} className="inline mr-1" />Jadwal Kirim
                </label>
                <input
                  value={form.openTripSchedule}
                  onChange={(e) => update('openTripSchedule', e.target.value)}
                  placeholder="Cth: Besok Pagi"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-ink-secondary">Batas Terima Order</label>
                <input
                  value={form.openTripClosing}
                  onChange={(e) => update('openTripClosing', e.target.value)}
                  placeholder="Cth: Hari ini pkl 17:00"
                  className="w-full bg-background border border-border rounded-xl px-3 py-2.5 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
                />
              </div>
            </div>
          </div>

          {/* Toggle Jastip Mode */}
          <div className="card-pad">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ShoppingBag size={18} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-ink">Mode Jastip Aktif</p>
                  <p className="text-[11px] text-ink-secondary">Trip-mu tampil ke customer</p>
                </div>
              </div>
              <button
                onClick={() => update('isJastipActive', !form.isJastipActive)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  form.isJastipActive ? 'bg-primary' : 'bg-border'
                }`}
                aria-label="Toggle mode jastip"
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    form.isJastipActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Button Fixed Bottom */}
      <div className="fixed bottom-0 inset-x-0 bg-white border-t border-border px-4 py-3 z-20 max-w-lg mx-auto">
        <button
          onClick={handleSave}
          disabled={saving || isLoading}
          className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        >
          <Save size={18} />
          {saving ? 'Menyimpan...' : jastiperData?.isJastiper ? 'Simpan Perubahan' : 'Daftar Sebagai Jastiper'}
        </button>
      </div>
    </div>
  );
}

