import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import type { Gig } from '../types';
import {
  ArrowLeft,
  Plus,
  MapPin,
  Clock,
  Monitor,
  Wrench,
  BookOpen,
  Briefcase,
} from '../components/icons';

import jastiperScooter from '../assets/images/jastiper_scooter.png';
import jastiperRunning from '../assets/images/jastiper_running.png';

const CATEGORY_TABS = [
  { id: 'all', label: 'Semua', icon: null },
  { id: 'digital', label: 'Digital', icon: Monitor },
  { id: 'fisik', label: 'Fisik', icon: Wrench },
];

const STATUS_LABEL: Record<string, string> = {
  open: 'Terbuka',
  in_progress: 'Dikerjakan',
  submitted: 'Menunggu Persetujuan',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

function formatRupiah(n: number) {
  return `Rp ${(n ?? 0).toLocaleString('id-ID')}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

function statusColor(s: string) {
  switch (s) {
    case 'open':
      return 'bg-success/10 text-success border border-success/20';
    case 'in_progress':
      return 'bg-[#E3F2FD] text-[#1565C0] border border-[#1565C0]/20';
    case 'submitted':
      return 'bg-[#FFF3E0] text-[#E65100] border border-[#E65100]/20';
    case 'completed':
      return 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20';
    case 'cancelled':
      return 'bg-[#FFEBEE] text-[#C62828] border border-[#C62828]/20';
    default:
      return 'bg-slate-100 text-ink-secondary';
  }
}

export default function GigHomeScreen() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'buka' | 'saya'>('buka');
  const [category, setCategory] = useState('all');

  const { data: openData } = useQuery({
    queryKey: ['gigs', 'open', category],
    queryFn: () => API.gigs.list({ category, status: 'open' }),
  });
  const { data: postedData } = useQuery({
    queryKey: ['gigs', 'posted'],
    queryFn: () => API.gigs.mine('posted'),
  });
  const { data: workedData } = useQuery({
    queryKey: ['gigs', 'worked'],
    queryFn: () => API.gigs.mine('worked'),
  });

  const openGigs: Gig[] = openData?.gigs ?? [];
  const posted: Gig[] = postedData?.gigs ?? [];
  const worked: Gig[] = workedData?.gigs ?? [];

  const openTab = () => setTab('buka');
  const myTab = () => setTab('saya');

  const renderGigCard = (g: Gig) => {
    const isPosted = tab === 'saya' && posted.some((p) => p.id === g.id || p.$id === g.id);
    const goDetail = () => navigate(`/gigs/${g.id ?? g.$id}`);
    const isDigital = g.category === 'digital';
    const bgImage = isDigital ? jastiperRunning : jastiperScooter;

    return (
      <button
        key={g.id ?? g.$id}
        onClick={goDetail}
        className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xs hover:shadow-md transition-all duration-200 w-full active:scale-[0.995]"
      >
        {/* Background Asset Watermark (10% normal, 45% on hover/touch) */}
        <img
          src={bgImage}
          alt=""
          className="absolute -right-2 -bottom-2 w-36 h-auto opacity-10 pointer-events-none select-none transition-opacity duration-300 group-hover:opacity-[0.45] group-active:opacity-[0.45]"
        />

        <div className="p-4 relative z-10 space-y-2.5">
          {/* Header Row: Category Badge + Status Badge */}
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border bg-slate-100/90 text-slate-800 border-slate-200">
              {isDigital ? (
                <Monitor className="w-3.5 h-3.5 text-primary" />
              ) : (
                <Wrench className="w-3.5 h-3.5 text-primary" />
              )}
              {isDigital ? 'Digital' : 'Fisik'}
            </span>

            <span
              className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${statusColor(g.status)}`}
            >
              {STATUS_LABEL[g.status] ?? g.status}
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-sm font-bold text-ink group-hover:text-primary transition-colors truncate leading-tight">
              {g.title}
            </h3>
            <p className="text-xs text-ink-secondary mt-1 line-clamp-2 leading-relaxed font-normal">
              {g.description}
            </p>
          </div>

          {/* Meta Info: Location & Deadline */}
          {(g.location || g.deadline) && (
            <div className="flex items-center gap-3 pt-0.5 text-[11px] text-ink-secondary">
              {g.location && (
                <span className="inline-flex items-center gap-1 min-w-0 max-w-[200px] truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">{g.location}</span>
                </span>
              )}
              {g.deadline && (
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{formatDate(g.deadline)}</span>
                </span>
              )}
            </div>
          )}

          {/* Footer: Budget & CTA Button */}
          <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">Budget</span>
              <span className="text-sm font-extrabold text-primary leading-none">
                {formatRupiah(g.budget)}
              </span>
            </div>

            <span className="px-3 py-1.5 rounded-xl bg-primary text-white font-bold text-xs shadow-2xs group-hover:bg-primary-dark transition-colors flex items-center gap-1">
              {isPosted ? 'Kelola' : g.status === 'open' ? 'Ambil Tugas' : 'Lihat'}
              <span>→</span>
            </span>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50/70 flex flex-col antialiased relative pb-28">
      {/* Top Header */}
      <header className="bg-white/95 backdrop-blur-md px-4 h-14 flex items-center justify-between sticky top-0 z-20 border-b border-slate-200/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/main')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-ink active:scale-95"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base text-ink leading-tight">Cari Cuan</h1>
        </div>
      </header>

      {/* Body Content */}
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-4">
        {tab === 'buka' ? (
          <>
            {/* Filter Kategori Tabs */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              {CATEGORY_TABS.map((c) => {
                const Icon = c.icon;
                const active = category === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setCategory(c.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                      active
                        ? 'bg-primary text-white shadow-sm shadow-primary/20'
                        : 'bg-white border border-slate-200 text-ink-secondary hover:bg-slate-100'
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {c.label}
                  </button>
                );
              })}
            </div>

            {openGigs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-3xl border border-slate-200 mt-4 shadow-2xs">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
                  <BookOpen className="w-10 h-10 opacity-70" />
                </div>
                <h3 className="font-bold text-base text-ink">Belum Ada Tugas Terbuka</h3>
                <p className="mt-1.5 text-xs text-ink-secondary max-w-xs leading-relaxed">
                  Ayo pasang tugas pertamamu dengan menekan tombol Pasang di bawah, atau coba ganti
                  kategori filter.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-3">{openGigs.map(renderGigCard)}</div>
            )}
          </>
        ) : (
          <div className="space-y-5">
            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">
                  Yang Saya Pasang
                </h2>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {posted.length}
                </span>
              </div>
              {posted.length === 0 ? (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-ink-secondary text-center">
                  Kamu belum pernah memasang tugas.
                </div>
              ) : (
                <div className="space-y-3">{posted.map(renderGigCard)}</div>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-extrabold text-ink-secondary uppercase tracking-wider">
                  Yang Saya Kerjakan
                </h2>
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {worked.length}
                </span>
              </div>
              {worked.length === 0 ? (
                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-xs text-ink-secondary text-center">
                  Kamu belum mengambil atau mengerjakan tugas apapun.
                </div>
              ) : (
                <div className="space-y-3">{worked.map(renderGigCard)}</div>
              )}
            </section>
          </div>
        )}
      </div>
      {/* Floating Footer Navigation Bar (Raised & Bigger Pill Style) */}
      <div className="fixed bottom-5 left-0 right-0 z-30 pointer-events-none px-4">
        <div className="pointer-events-auto max-w-md mx-auto bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xl shadow-slate-900/15 rounded-3xl">
          <div className="grid grid-cols-3 items-center h-18 relative px-2">
            {/* Left Action: Terbuka */}
            <div className="flex justify-center items-center">
              <button
                onClick={openTab}
                className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 py-1 ${
                  tab === 'buka'
                    ? 'text-primary font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`}
              >
                <BookOpen
                  className={`w-6 h-6 ${tab === 'buka' ? 'text-primary' : 'text-slate-400'}`}
                />
                <span className="text-xs leading-none">Terbuka</span>
              </button>
            </div>

            {/* Center Action: Larger Cool Circular Floating FAB (+) */}
            <div className="flex justify-center items-center">
              <button
                onClick={() => navigate('/gigs/create')}
                className="w-16 h-16 rounded-full bg-gradient-to-tr from-primary via-[#9B234D] to-[#4A1028] text-white shadow-xl shadow-primary/45 flex items-center justify-center -translate-y-6 border-4 border-slate-50 hover:scale-110 active:scale-95 transition-all duration-300 group"
                aria-label="Pasang Tugas Baru"
              >
                <Plus className="w-8 h-8 stroke-[2.5] group-hover:rotate-90 transition-transform duration-300" />
              </button>
            </div>

            {/* Right Action: Tugas Saya */}
            <div className="flex justify-center items-center">
              <button
                onClick={myTab}
                className={`flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 py-1 ${
                  tab === 'saya'
                    ? 'text-primary font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-600 font-semibold'
                }`}
              >
                <Briefcase
                  className={`w-6 h-6 ${tab === 'saya' ? 'text-primary' : 'text-slate-400'}`}
                />
                <span className="text-xs leading-none">Tugas Saya</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
