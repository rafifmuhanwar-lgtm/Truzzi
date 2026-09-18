import { useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { emitAddressPicked } from '../lib/address-picker';
import type { Address } from '../types';
import { ArrowLeft, Plus, MapPin, Trash2 } from '../components/icons';

export default function SavedAddresses() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [modal, setModal] = useState<Address | 'new' | null>(null);
  const location = useLocation();
  const locationState = location.state as { select_for?: string } | null;

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => API.addresses.list().then((r) => r.addresses as Address[]),
    enabled: !!user,
  });
  const addresses = data ?? [];

  const invalidate = () => qc.invalidateQueries({ queryKey: ['addresses'] });

  const save = async (form: AddressFormData) => {
    try {
      if (modal === 'new') {
        await API.addresses.create(form as unknown as Record<string, unknown>);
        enqueueSnackbar('Alamat berhasil ditambahkan', { variant: 'success' });
      } else if (modal && typeof modal !== 'string') {
        await API.addresses.update(modal.id, form as unknown as Record<string, unknown>);
        enqueueSnackbar('Alamat berhasil diperbarui', { variant: 'success' });
      }
      setModal(null);
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const setPrimary = async (a: Address) => {
    try {
      await API.addresses.update(a.id, { isPrimary: true });
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const remove = async (a: Address) => {
    const ok = window.confirm(`Apakah kamu yakin ingin menghapus alamat "${a.label} - ${a.recipientName}"?`);
    if (!ok) return;
    try {
      await API.addresses.remove(a.id);
      enqueueSnackbar('Alamat berhasil dihapus', { variant: 'success' });
      invalidate();
    } catch (e) {
      enqueueSnackbar(errMsg(e), { variant: 'error' });
    }
  };

  const selectToUse = (a: Address) => {
    if (locationState?.select_for === 'delivery' || (locationState?.select_for as string | undefined)?.startsWith('delivery')) {
      emitAddressPicked({ address: a.fullAddress, data: a });
    }
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10 border-b border-divider">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-primary" /></button>
        <h1 className="font-semibold text-lg text-ink">Alamat Saya</h1>
      </header>

      <div className="bg-background-alt py-2 px-4 text-xs font-medium text-ink-secondary">
        Alamat
      </div>

      <div className="flex-1 w-full bg-surface pb-32">
        {isLoading ? (
          <p className="text-center text-sm text-ink-secondary py-12">Memuat alamat...</p>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="w-24 h-24 rounded-full bg-background-alt border border-divider flex items-center justify-center">
              <MapPin className="w-10 h-10 text-ink-secondary/40" />
            </span>
            <h3 className="mt-4 font-bold">Belum ada alamat tersimpan</h3>
            <p className="mt-1 text-sm text-ink-secondary max-w-[280px]">
              Tambahkan alamat baru untuk mempermudah pemesanan titip belanja jastiper.
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {addresses.map((a) => (
              <div key={a.id} onClick={() => selectToUse(a)} className="px-4 py-4 border-b border-divider cursor-pointer">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-sm text-ink">{a.recipientName || a.label}</h3>
                    <div className="text-[13px] text-ink-secondary leading-relaxed mt-1">
                      <p>
                        {a.fullAddress} {a.details && `(${a.details})`}
                      </p>
                      {(a.village || a.district || a.city || a.province) && (
                        <p className="uppercase mt-0.5">
                          {[a.village, a.district, a.city, a.province].filter(Boolean).join(', ')}{a.postalCode ? `, ID ${a.postalCode}` : ''}
                        </p>
                      )}
                    </div>
                    
                    <div className="mt-2.5 flex items-center gap-2">
                      {a.isPrimary && (
                        <span className="inline-block px-1.5 py-0.5 rounded border border-primary text-primary text-[10px] font-medium">
                          Utama
                        </span>
                      )}
                      {!a.isPrimary && (
                        <button onClick={(e) => { e.stopPropagation(); setPrimary(a); }} className="text-[10px] font-medium text-ink-secondary underline">
                          Jadikan Utama
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end justify-between h-full py-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setModal(a)} className="text-primary text-sm font-semibold p-2 -mr-2">Edit</button>
                    {!a.isPrimary && (
                      <button onClick={() => remove(a)} className="p-2 -mr-2 mt-4"><Trash2 className="w-4 h-4 text-error" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-4 pt-3 pb-5 border-t border-divider z-20">
        <button className="w-full py-3 rounded-lg border border-primary text-primary font-semibold flex items-center justify-center gap-2 active:bg-primary/5 transition-colors" onClick={() => setModal('new')}>
          <Plus className="w-5 h-5" /> Tambah Alamat Baru
        </button>
      </div>

      {modal && <AddressModal address={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

type Region = { code: string; name: string };

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  fullAddress: string;
  details?: string;
  isPrimary?: boolean;
}

function AddressModal({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: (f: AddressFormData) => void }) {
  const [form, setForm] = useState<AddressFormData>({
    label: address?.label ?? 'Rumah',
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    province: address?.province ?? '',
    city: address?.city ?? '',
    district: address?.district ?? '',
    village: address?.village ?? '',
    postalCode: address?.postalCode ?? '',
    fullAddress: address?.fullAddress ?? '',
    details: address?.details ?? '',
    isPrimary: address?.isPrimary ?? false,
  });

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
      setRegencies([]); setSelectedReg(''); setDistricts([]); setSelectedDist(''); setVillages([]); setSelectedVill('');
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
      setDistricts([]); setSelectedDist(''); setVillages([]); setSelectedVill('');
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
      setVillages([]); setSelectedVill('');
      return;
    }
    fetch(`/wilayah/api/villages/${selectedDist}.json`)
      .then((res) => res.json())
      .then((res) => setVillages(res.data || []))
      .catch(console.error);
  }, [selectedDist]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullAddress.trim()) return;

    // Build the final form data mapping the selected region codes to their names
    const provName = provinces.find(p => p.code === selectedProv)?.name || form.province;
    const regName = regencies.find(r => r.code === selectedReg)?.name || form.city;
    const distName = districts.find(d => d.code === selectedDist)?.name || form.district;
    const villName = villages.find(v => v.code === selectedVill)?.name || form.village;

    onSave({
      ...form,
      province: provName,
      city: regName,
      district: distName,
      village: villName,
    });
  };

  const input = (key: keyof AddressFormData, label: string, placeholder: string, type = 'text') => (
    <div>
      <label className="text-xs font-medium mb-1 block text-ink-secondary">{label}</label>
      <input
        type={type}
        value={String(form[key] ?? '')}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className="input-base"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[1500] bg-black/40 flex items-end sm:items-center justify-center overflow-y-auto" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 space-y-3 mt-auto sm:my-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold">{address ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
        
        <div>
          <label className="text-xs font-medium mb-1 block text-ink-secondary">Label</label>
          <select
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            className="input-base"
          >
            <option value="Rumah">Rumah</option>
            <option value="Kantor">Kantor</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block text-ink-secondary">Provinsi</label>
            <select
              value={selectedProv}
              onChange={(e) => setSelectedProv(e.target.value)}
              className="input-base text-sm truncate"
            >
              <option value="">{form.province || 'Pilih Provinsi...'}</option>
              {provinces.map((p) => (
                <option key={p.code} value={p.code}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block text-ink-secondary">Kota/Kabupaten</label>
            <select
              value={selectedReg}
              onChange={(e) => setSelectedReg(e.target.value)}
              className="input-base text-sm truncate"
              disabled={!selectedProv && !form.city}
            >
              <option value="">{form.city || 'Pilih Kota...'}</option>
              {regencies.map((r) => (
                <option key={r.code} value={r.code}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium mb-1 block text-ink-secondary">Kecamatan</label>
            <select
              value={selectedDist}
              onChange={(e) => setSelectedDist(e.target.value)}
              className="input-base text-sm truncate"
              disabled={!selectedReg && !form.district}
            >
              <option value="">{form.district || 'Pilih Kecamatan...'}</option>
              {districts.map((d) => (
                <option key={d.code} value={d.code}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium mb-1 block text-ink-secondary">Desa/Kelurahan</label>
            <select
              value={selectedVill}
              onChange={(e) => setSelectedVill(e.target.value)}
              className="input-base text-sm truncate"
              disabled={!selectedDist && !form.village}
            >
              <option value="">{form.village || 'Pilih Desa...'}</option>
              {villages.map((v) => (
                <option key={v.code} value={v.code}>{v.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            {input('postalCode', 'Kode Pos', 'Masukkan kode pos', 'number')}
          </div>
        </div>

        {input('fullAddress', 'Alamat Lengkap', 'Cth: Jl. Kemerdekaan No. 123, RT 01 RW 02')}
        {input('details', 'Detail (Opsional)', 'Cth: Pagar hitam, depan warung')}

        <div className="flex items-center justify-between py-2 border-t border-b border-divider mt-2">
          <div className="min-w-0 pr-4">
            <p className="text-sm font-semibold text-ink">Atur sebagai alamat utama</p>
            <p className="text-[11px] text-ink-secondary">Gunakan alamat ini sebagai prioritas</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={form.isPrimary}
              onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
            />
            <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-outline flex-1" onClick={onClose}>Batal</button>
          <button type="submit" className="btn-primary flex-1">{address ? 'Simpan' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}

