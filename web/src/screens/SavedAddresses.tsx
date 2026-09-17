import { useState, type FormEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { emitAddressPicked } from '../lib/address-picker';
import type { Address } from '../types';
import { ArrowLeft, Plus, MapPin, Trash2, Edit, Star } from '../components/icons';

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
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Alamat Tersimpan</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 pb-32">
        {isLoading ? (
          <p className="text-center text-sm text-ink-secondary py-12">Memuat alamat...</p>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center">
              <MapPin className="w-10 h-10 text-ink-secondary/40" />
            </span>
            <h3 className="mt-4 font-bold">Belum ada alamat tersimpan</h3>
            <p className="mt-1 text-sm text-ink-secondary max-w-[280px]">
              Tambahkan alamat baru untuk mempermudah pemesanan titip belanja jastiper.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} onClick={() => selectToUse(a)} className="card p-4 cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">{a.label}</span>
                    {a.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-semibold">
                        <Star className="w-3 h-3 fill-current" /> Utama
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setModal(a)} className="p-2" title="Edit Alamat"><Edit className="w-4 h-4 text-ink-secondary" /></button>
                    <button onClick={() => remove(a)} className="p-2" title="Hapus Alamat"><Trash2 className="w-4 h-4 text-error" /></button>
                  </div>
                </div>
                <p className="font-bold mt-2.5">{a.recipientName || a.label}</p>
                <p className="text-sm text-ink-secondary">{a.phone}</p>
                <div className="flex items-start gap-1.5 mt-1">
                  <MapPin className="w-4 h-4 text-ink-secondary shrink-0 mt-0.5" />
                  <p className="text-sm text-ink-secondary leading-relaxed">{a.fullAddress}</p>
                </div>
                {a.details && <p className="text-xs italic text-ink-secondary mt-1">{a.details}</p>}
                {!a.isPrimary && (
                  <button onClick={() => setPrimary(a)} className="mt-2 text-xs font-semibold text-primary">
                    Jadikan Alamat Utama
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 border-t border-divider z-20">
        <div className="max-w-lg mx-auto">
          <button className="btn-primary flex items-center justify-center gap-2" onClick={() => setModal('new')}>
            <Plus className="w-4 h-4" /> Tambah Alamat Baru
          </button>
        </div>
      </div>

      {modal && <AddressModal address={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />}
    </div>
  );
}

interface AddressFormData {
  label: string;
  recipientName: string;
  phone: string;
  fullAddress: string;
  details?: string;
  isPrimary?: boolean;
}

function AddressModal({ address, onClose, onSave }: { address: Address | null; onClose: () => void; onSave: (f: AddressFormData) => void }) {
  const [form, setForm] = useState<AddressFormData>({
    label: address?.label ?? 'Rumah',
    recipientName: address?.recipientName ?? '',
    phone: address?.phone ?? '',
    fullAddress: address?.fullAddress ?? '',
    details: address?.details ?? '',
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.fullAddress.trim()) return;
    onSave(form);
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
    <div className="fixed inset-0 z-[1500] bg-black/40 flex items-end sm:items-center justify-center" onClick={onClose}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg sm:rounded-3xl rounded-t-3xl p-6 space-y-3">
        <h3 className="text-lg font-bold">{address ? 'Edit Alamat' : 'Tambah Alamat Baru'}</h3>
        {input('label', 'Label', 'Rumah / Kantor / Lainnya')}
        {input('recipientName', 'Nama Penerima', 'Nama lengkap penerima')}
        {input('phone', 'Nomor Telepon', '08xxxxxxxxxx', 'tel')}
        {input('fullAddress', 'Alamat Lengkap', 'Jl. ... No. ..., kecamatan, kota, provinsi, kode pos')}
        {input('details', 'Detail (Opsional)', 'Contoh: Pagar hitam, samping minimarket')}
        <div className="flex gap-2 pt-2">
          <button type="button" className="btn-outline flex-1" onClick={onClose}>Batal</button>
          <button type="submit" className="btn-primary flex-1">{address ? 'Simpan' : 'Simpan'}</button>
        </div>
      </form>
    </div>
  );
}

