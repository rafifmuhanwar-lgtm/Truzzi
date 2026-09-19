import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { API } from '../lib/api';
import { formatRupiah } from '../lib/format';
import type { Jastiper } from '../types';
import {
  ArrowLeft,
  Search,
  MapPin,
  Star,
  Clock,
  Heart,
  CheckCircle2,
  ChevronRight,
  X,
  Flame,
} from '../components/icons';

const AREA_FILTERS = [
  { id: 'Semua', label: 'Semua Area', icon: '' },
  { id: 'Kota Bekasi', label: 'Bekasi', icon: '' },
  { id: 'Jakarta', label: 'Jakarta', icon: '' },
  { id: 'Bogor', label: 'Bogor', icon: '' },
  { id: 'Depok', label: 'Depok', icon: '' },
  { id: 'Tangerang', label: 'Tangerang', icon: '' },
  { id: 'Bandung', label: 'Bandung', icon: '' },
];

const CATEGORY_FILTERS = [
  { id: 'Semua', label: 'Semua Kategori', icon: '' },
  { id: 'Kuliner', label: 'Kuliner & Snack', icon: '' },
  { id: 'Home & Living', label: 'IKEA & Living', icon: '' },
  { id: 'Beauty', label: 'Skincare & Makeup', icon: '' },
  { id: 'Fashion', label: 'Fashion & Pasar', icon: '' },
];

export default function JastipExploreScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<'trips' | 'jastipers'>('trips');
  const [selectedArea, setSelectedArea] = useState('Semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch jastipers & favorites
  const { data: jastipersData, isLoading } = useQuery({
    queryKey: ['jastipers'],
    queryFn: () => API.jastipers.list(),
    staleTime: 30000,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => API.favorites.list(),
    staleTime: 30000,
  });

  const jastipers: Jastiper[] = jastipersData?.jastipers ?? [];
  const favorites = favoritesData?.favorites ?? [];

  // Filtered list with multi-condition search
  const filteredJastipers = useMemo(() => {
    return jastipers.filter((j) => {
      // Area match
      if (selectedArea !== 'Semua') {
        const areaStr = (j.area || '').toLowerCase();
        if (!areaStr.includes(selectedArea.toLowerCase())) return false;
      }
      // Category match
      if (selectedCategory !== 'Semua') {
        const catStr = (j.category || '').toLowerCase();
        if (!catStr.includes(selectedCategory.toLowerCase())) {
          const hasProductCat = j.products?.some((p) =>
            (p.category || '').toLowerCase().includes(selectedCategory.toLowerCase()),
          );
          if (!hasProductCat) return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (j.name || '').toLowerCase().includes(q);
        const matchArea = (j.area || '').toLowerCase().includes(q);
        const matchTrip = (j.openTripTitle || '').toLowerCase().includes(q);
        const matchDest = (j.openTripDestination || '').toLowerCase().includes(q);
        const matchProd = j.products?.some(
          (p) => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q),
        );
        if (!matchName && !matchArea && !matchTrip && !matchDest && !matchProd) return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jastipersData?.jastipers, selectedArea, selectedCategory, searchQuery]);

  const toggleFavorite = async (jastiperId: string) => {
    const isFav = favorites.some((f: any) => f.jastiperId === jastiperId || f.id === jastiperId);
    try {
      if (isFav) {
        await API.favorites.remove(jastiperId);
        enqueueSnackbar('Dihapus dari favorit', { variant: 'info' });
      } else {
        await API.favorites.add(jastiperId);
        enqueueSnackbar('Disimpan ke favorit ❤️', { variant: 'success' });
      }
      qc.invalidateQueries({ queryKey: ['favorites'] });
    } catch {
      enqueueSnackbar('Gagal memperbarui favorit', { variant: 'error' });
    }
  };
  const openJastiperDetail = (j: Jastiper) => {
    navigate(`/jastiper/${j.id || (j as any).jastiperId}`, { state: { jastiper: j } });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col pb-28">
      {/* ── Sticky Top Header ── */}
      <header className="bg-gradient-to-b from-primary via-primary to-primary-dark text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-lg mx-auto px-4 pt-3.5 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate('/main')}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 active:scale-95 transition-all shrink-0"
              aria-label="Kembali ke Beranda"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="font-bold text-base leading-tight truncate font-sans">Jasa Titip</h1>
              <p className="text-xs text-white/80 leading-snug">
                Jastipers Terpercaya di Jabodetabek
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar Input */}
        <div className="max-w-lg mx-auto px-4 pb-3.5 pt-1">
          <div className="bg-white rounded-2xl flex items-center px-3.5 py-2.5 shadow-sm border border-black/5">
            <Search className="w-4 h-4 text-ink-secondary mr-2.5 shrink-0" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hayo mau cari apa?...."
              className="w-full bg-transparent text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-full bg-surface flex items-center justify-center text-ink-secondary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto px-4 py-4 space-y-4">
        {/* ── Jastiper Info Callout ── */}
        <div className="bg-gradient-to-r from-[#7F1D3A] via-[#942244] to-[#60142A] rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="space-y-1 min-w-0">
              <h2 className="text-sm font-bold leading-tight">Mau Jadi Jastiper di Truzzi?</h2>
              <p className="text-xs text-white/80 leading-snug">
                Kelola trip & katalog produk lewat Driver App Truzzi. Pembayaran aman terjamin
                escrow.
              </p>
            </div>
            <a
              href="#driver-app"
              className="bg-white text-primary text-xs font-bold px-3 py-2 rounded-xl shrink-0 shadow-md hover:bg-white/95 active:scale-95 transition-all whitespace-nowrap"
            >
              Info Driver App
            </a>
          </div>
        </div>

        {/* ── Area Filter Chips ── */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-ink flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" /> Pilih Wilayah Trip
            </span>
            {selectedArea !== 'Semua' && (
              <button
                onClick={() => setSelectedArea('Semua')}
                className="text-[11px] text-primary font-semibold hover:underline"
              >
                Reset Area
              </button>
            )}
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {AREA_FILTERS.map((area) => {
              const active = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => setSelectedArea(area.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-primary text-white shadow-sm ring-2 ring-primary/20'
                      : 'bg-white border border-border/80 text-ink-secondary hover:border-primary/40'
                  }`}
                >
                  <span>{area.icon}</span>
                  <span>{area.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Category Filter Chips ── */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {CATEGORY_FILTERS.map((cat) => {
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  active
                    ? 'bg-ink text-white font-bold shadow-xs'
                    : 'bg-white border border-border/70 text-ink-secondary hover:bg-surface'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Tab Switcher ── */}
        <div className="bg-white border border-border/80 rounded-2xl p-1 flex gap-1 shadow-2xs">
          <button
            onClick={() => setActiveTab('trips')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'trips'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-surface'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Open Jastip Aktif (
            {filteredJastipers.length})
          </button>
          <button
            onClick={() => setActiveTab('jastipers')}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'jastipers'
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-secondary hover:text-ink hover:bg-surface'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-amber-400" /> Jastiper Terpercaya
          </button>
        </div>

        {/* ── Main Feed Content ── */}
        {isLoading ? (
          <div className="card p-12 text-center text-ink-secondary text-xs space-y-2 bg-white">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Memuat daftar Open Jastip...</p>
          </div>
        ) : filteredJastipers.length === 0 ? (
          <div className="card p-8 text-center space-y-3 bg-white border border-border">
            <span className="text-4xl">🛍️</span>
            <p className="font-bold text-sm text-ink">Belum ada trip aktif di filter ini</p>
            <p className="text-xs text-ink-secondary max-w-xs mx-auto">
              Coba ganti pilihan wilayah atau gunakan tombol di bawah untuk memesan jastip custom ke
              toko manapun.
            </p>
            <button
              onClick={() => navigate('/jastip/form')}
              className="btn-primary !h-10 text-xs font-bold mx-auto max-w-[220px]"
            >
              Titip Manual Bebas
            </button>
          </div>
        ) : activeTab === 'trips' ? (
          /* TAB 1: TRIP JASTIP CARDS */
          <div className="space-y-4">
            {filteredJastipers.map((j) => {
              const isFav = favorites.some((f: any) => f.jastiperId === j.id || f.id === j.id);
              return (
                <div
                  key={j.id}
                  className="bg-white rounded-2xl overflow-hidden border border-border/80 shadow-sm hover:shadow-md transition-all"
                >
                  {/* Cover Banner */}
                  <div className="relative h-36 bg-gradient-to-r from-primary-dark via-primary to-[#8A2B4C] overflow-hidden">
                    {j.coverUrl && (
                      <img src={j.coverUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600/90 backdrop-blur-xs text-white text-[10px] font-bold shadow-xs">
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        BUKA TRIP
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(j.id);
                        }}
                        className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white active:scale-90 transition-transform"
                        aria-label="Simpan Favorit"
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'text-error fill-error' : 'text-white'}`}
                        />
                      </button>
                    </div>

                    {/* Trip Info Overlay */}
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <p className="text-sm font-bold leading-snug drop-shadow truncate">
                        {j.openTripTitle || `Trip Jastip ${j.name}`}
                      </p>
                      <p className="text-[11px] text-white/90 drop-shadow flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                        <span className="truncate">{j.openTripDestination || j.area}</span>
                      </p>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3.5">
                    {/* Jastiper Profile Row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {j.photoUrl ? (
                          <img
                            src={j.photoUrl}
                            alt=""
                            className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
                          />
                        ) : (
                          <span className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center text-base">
                            👤
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-xs text-ink truncate">{j.name}</p>
                            {j.verified && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
                            <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                              <Star className="w-3 h-3 fill-amber-400" />{' '}
                              {Math.min(5.0, Number(j.rating ?? 5.0)).toFixed(1)}
                            </span>
                            <span>•</span>
                            <span>{j.totalOrders ?? 0} trip sukses</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Schedule / Cutoff Box */}
                    <div className="flex items-center gap-3 bg-[#F8F9FA] rounded-xl p-2.5 text-[11px] border border-border/60">
                      <div className="flex items-center gap-1.5 text-ink-secondary min-w-0 flex-1">
                        <Clock className="w-3.5 h-3.5 text-error shrink-0" />
                        <span className="truncate">
                          Tutup:{' '}
                          <strong className="text-ink">{j.openTripClosing || 'Hari ini'}</strong>
                        </span>
                      </div>
                      <div className="w-px h-3.5 bg-border shrink-0" />
                      <div className="text-ink-secondary truncate flex-1">
                        Kirim:{' '}
                        <strong className="text-emerald-700">
                          {j.openTripSchedule || 'Besok'}
                        </strong>
                      </div>
                    </div>

                    {/* Product Preview Chips */}
                    {j.products && j.products.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-ink-secondary uppercase tracking-wider">
                          Barang Titipan Unggulan:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {j.products.slice(0, 3).map((p) => (
                            <span
                              key={p.id}
                              className="px-2.5 py-1 rounded-lg bg-[#F3F4F6] border border-border/50 text-[11px] text-ink font-medium truncate max-w-[220px]"
                            >
                              {p.title} ·{' '}
                              <strong className="text-primary font-bold">
                                {formatRupiah(p.price)}
                              </strong>
                            </span>
                          ))}
                          {j.products.length > 3 && (
                            <span className="px-2 py-1 rounded-lg bg-surface text-[10px] text-ink-secondary font-semibold">
                              +{j.products.length - 3} lainnya
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-border/50">
                      <button
                        onClick={() => openJastiperDetail(j)}
                        className="btn-primary !h-10 text-xs font-bold w-full rounded-xl shadow-xs flex items-center justify-center gap-1 truncate px-2"
                      >
                        Lihat Menu &amp; Titip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TAB 2: PROFIL JASTIPER DIRECT */
          <div className="space-y-3">
            {filteredJastipers.map((j) => (
              <div
                key={j.id}
                onClick={() => openJastiperDetail(j)}
                className="bg-white rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer border border-border/80 hover:border-primary/50 shadow-2xs hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {j.photoUrl ? (
                    <img
                      src={j.photoUrl}
                      alt=""
                      className="w-13 h-13 rounded-2xl object-cover border border-border shrink-0"
                    />
                  ) : (
                    <span className="w-13 h-13 rounded-2xl bg-surface border border-border flex items-center justify-center text-2xl shrink-0">
                      👤
                    </span>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-xs text-ink truncate">{j.name}</p>
                      {j.verified && <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-[11px] text-ink-secondary mt-0.5 line-clamp-1">
                      {j.bio || j.area}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-ink-secondary">
                      <span className="flex items-center gap-0.5 text-amber-500 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />{' '}
                        {Math.min(5.0, Number(j.rating ?? 5.0)).toFixed(1)}
                      </span>
                      <span>•</span>
                      <span>{j.totalOrders ?? 0} pesanan</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">{j.area}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-ink-secondary shrink-0" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
