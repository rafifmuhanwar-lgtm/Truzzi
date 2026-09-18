import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { emitAddressPicked } from '../lib/address-picker';
import type { Address } from '../types';
import { ArrowLeft, Plus, MapPin, MapIcon, Star } from '../components/icons';

/** Pilih alamat tujuan — meniru DeliveryAddressScreen Flutter. */
export default function DeliveryAddress() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [manual, setManual] = useState(false);
  const [manualText, setManualText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => API.addresses.list().then((r) => r.addresses as Address[]),
    enabled: !!user,
  });
  const addresses = data ?? [];

  useEffect(() => {
    if (!isLoading && addresses.length === 0) {
      navigate('/profile/addresses', { replace: true, state: { select_for: 'delivery' } });
    }
  }, [isLoading, addresses.length, navigate]);

  const pick = (a: Address) => {
    emitAddressPicked({ address: a.fullAddress, data: a });
    navigate(-1);
  };

  const pickManual = () => {
    emitAddressPicked({ address: manualText.trim(), data: { label: 'Manual', fullAddress: manualText.trim() } });
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-surface px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate(-1)} aria-label="Kembali"><ArrowLeft className="w-6 h-6 text-ink" /></button>
        <h1 className="font-semibold text-base">Alamat Pengantaran</h1>
      </header>

      <div className="flex-1 max-w-lg w-full mx-auto px-6 py-5 pb-32">
        <div className="bg-primary/5 border border-primary/10 rounded-[14px] p-4 flex items-center gap-3">
          <span className="p-2 rounded-lg bg-primary text-white shrink-0"><MapPin className="w-5 h-5" /></span>
          <div>
            <p className="font-semibold text-sm">Pilih tujuan pengiriman</p>
            <p className="text-xs text-ink-secondary mt-0.5">Jastiper akan mengantar ke alamat yang kamu pilih</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-sm text-ink-secondary py-12">Memuat alamat...</p>
        ) : addresses.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <span className="w-24 h-24 rounded-full bg-surface border border-border flex items-center justify-center">
              <MapPin className="w-10 h-10 text-ink-secondary/40" />
            </span>
            <h3 className="mt-4 font-bold">Belum ada alamat tersimpan</h3>
            <p className="mt-1 text-sm text-ink-secondary max-w-[270px]">
              Tambahkan alamat baru untuk mempermudah pemesanan titip belanja jastiper.
            </p>
            <button onClick={() => navigate('/profile/addresses')} className="btn-outline mt-5">
              <Plus className="w-4 h-4 mr-1.5 inline" /> Tambah Alamat Baru
            </button>
          </div>
        ) : (
          <>
            <h3 className="font-bold mt-5 mb-3">Alamat Tersimpan</h3>
            <div className="space-y-3">
              {addresses.map((a) => (
                <button key={a.id} onClick={() => pick(a)} className="w-full card p-4 text-left">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">{a.label}</span>
                    {a.isPrimary && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary text-white text-[10px] font-semibold">
                        <Star className="w-3 h-3 fill-current" /> Utama
                      </span>
                    )}
                  </div>
                  <p className="font-bold mt-2.5">{a.recipientName || a.label}</p>
                  <p className="text-sm text-ink-secondary line-clamp-2 mt-1">
                    {a.fullAddress} {a.details && `(${a.details})`}
                  </p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sticky bottom-0 bg-white px-6 pt-4 pb-6 border-t border-divider z-20">
        <div className="max-w-lg mx-auto space-y-2">
          {manual ? (
            <div className="space-y-2">
              <textarea
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                rows={2}
                placeholder="Contoh: Jl. Merdeka No. 45, Jakarta Pusat"
                className="input-base resize-none"
                autoFocus
              />
              <button className="btn-primary" onClick={pickManual}>Konfirmasi Alamat</button>
              <button className="btn-outline" onClick={() => setManual(false)}>Kembali</button>
            </div>
          ) : (
            <>
              <button className="btn-primary flex items-center justify-center gap-2" onClick={() => navigate('/profile/addresses')}>
                <Plus className="w-4 h-4" /> Tambah Alamat Baru
              </button>
              <button className="btn-outline flex items-center justify-center gap-2" onClick={() => setManual(true)}>
                <MapIcon className="w-4 h-4" /> Masukkan Alamat Manual Sekali Pakai
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
