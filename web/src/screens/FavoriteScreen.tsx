import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { API } from '../lib/api';
import type { Jastiper } from '../types';
import { Heart, MapPin, Star, Search, X } from '../components/icons';

function JastiperCard({ jastiper, onRemove }: { jastiper: Jastiper; onRemove?: () => void }) {
  const navigate = useNavigate();
  const rating = jastiper.rating ?? 4.5;
  const reviews = jastiper.totalOrders ?? 0;

  return (
    <div className="card p-4 flex gap-3">
      <button
        onClick={() => navigate(`/jastipers/${jastiper.id}`)}
        className="w-[72px] h-[72px] rounded-2xl overflow-hidden shrink-0 bg-surface border border-border flex items-center justify-center"
      >
        {jastiper.photoUrl ? (
          <img src={jastiper.photoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => navigate(`/jastipers/${jastiper.id}`)} className="text-left min-w-0 flex-1">
            <p className="font-bold text-sm truncate">{jastiper.name}</p>
          </button>
          {onRemove && (
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-1.5 -mr-1.5 rounded-full hover:bg-error/10 flex items-center justify-center transition-colors shrink-0"
              aria-label="Hapus favorite"
            >
              <Heart className="w-5 h-5 text-error fill-error" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-[11px] font-semibold text-ink">{Number(rating).toFixed(1)}</span>
          <span className="text-[10px] text-ink-secondary">({reviews})</span>
        </div>
        {jastiper.area && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-ink-secondary" />
            <span className="text-[10px] text-ink-secondary">{jastiper.area}</span>
          </div>
        )}
        {jastiper.services && jastiper.services.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {jastiper.services.slice(0, 2).map((s) => (
              <span key={s} className="px-1.5 py-0.5 rounded bg-primary/10 text-[9px] text-primary font-medium">{s}</span>
            ))}
            {jastiper.services.length > 2 && (
              <span className="px-1.5 py-0.5 rounded bg-surface text-[9px] text-ink-secondary">+{jastiper.services.length - 2}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <Heart className="w-20 h-20 text-ink-secondary/30" />
      <h3 className="mt-4 font-bold text-ink">Belum Ada Favorite</h3>
      <p className="mt-1 text-sm text-ink-secondary max-w-xs">Tambahkan jastiper favoritmu di halaman Beranda</p>
      <button
        onClick={() => window.history.back()}
        className="btn-primary mt-5 !h-[42px] text-sm"
      >
        Cari Jastiper
      </button>
    </div>
  );
}

export default function FavoriteScreen() {
  const { enqueueSnackbar } = useSnackbar();
  const [q, setQ] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => API.favorites.list(),
    staleTime: 30000,
  });
  const favorites: Jastiper[] = data?.favorites ?? [];

  const filtered = favorites.filter((j) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    const hay = `${j.name} ${j.area ?? ''} ${(j.services ?? []).join(' ')}`.toLowerCase();
    return hay.includes(query);
  });

  const handleRemove = async (id: string) => {
    try {
      await API.favorites.remove(id);
      refetch();
      enqueueSnackbar('Jastiper dihapus dari favorite', { variant: 'info' });
    } catch {
      enqueueSnackbar('Gagal menghapus favorite', { variant: 'error' });
    }
  };

  return (
    <div className="min-h-0 bg-background">
      <div className="bg-primary rounded-b-[28px] px-5 pt-6 pb-4" style={{ boxShadow: '0 5px 15px rgba(127,29,58,0.25)' }}>
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-bold text-white font-sans">Favorite</h1>
          <p className="text-sm text-white/85 mt-0.5">Jastiper yang kamu simpan</p>
          <div className="mt-3 bg-white rounded-full flex items-center px-4 py-2.5">
            <Search className="w-[18px] h-[18px] text-ink-secondary mr-2 shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari jastiper favorite..."
              className="w-full bg-transparent text-sm placeholder:text-ink-secondary/60 focus:outline-none"
            />
            {q && (
              <button onClick={() => setQ('')} aria-label="Hapus pencarian">
                <X className="w-4 h-4 text-ink-secondary" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 pt-4 pb-8 space-y-3 max-w-lg mx-auto">
        {isLoading ? (
          <p className="text-center text-sm text-ink-secondary py-10">Memuat favorite...</p>
        ) : filtered.length === 0 ? (
          <EmptyState />
        ) : (
          filtered.map((j) => (
            <JastiperCard key={j.id} jastiper={j} onRemove={() => handleRemove(j.id)} />
          ))
        )}
      </div>
    </div>
  );
}