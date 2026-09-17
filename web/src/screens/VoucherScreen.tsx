import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useQuery } from '@tanstack/react-query';
import { API } from '../lib/api';
import {
  ArrowLeft,
  Ticket,
  Copy,
  CheckCircle2,
  Sparkles,
  Percent,
  Gift,
  UserPlus,
  Search,
  X,
  ChevronRight,
  RefreshCw,
  Info,
  Clock,
  ShieldCheck,
} from '../components/icons';

export type VoucherItem = {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  category: 'jastip' | 'suruh' | 'cashback' | 'all';
  badge: string;
  badgeType: 'exclusive' | 'limited' | 'weekend' | 'referral';
  discountText: string;
  gradient: string;
  accent: string;
  period: string;
  minTransaction: string;
  details: string[];
  terms: string[];
  isNew?: boolean;
};

const VOUCHER_LIST: VoucherItem[] = [];

export default function VoucherScreen() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<'all' | 'jastip' | 'suruh' | 'cashback' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimInput, setClaimInput] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<VoucherItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    enqueueSnackbar(`Kode voucher "${code}" berhasil disalin!`, { variant: 'success' });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  const handleClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimInput.trim()) return;

    const matched = VOUCHER_LIST.find((v) => v.code.toLowerCase() === claimInput.trim().toLowerCase());
    if (matched) {
      enqueueSnackbar(`Voucher ${matched.code} berhasil diklaim & ditambahkan ke akun Anda!`, { variant: 'success' });
      setClaimInput('');
      setActiveTab('all');
    } else {
      enqueueSnackbar('Kode promo tidak valid atau sudah kadaluarsa.', { variant: 'error' });
    }
  };

  const { data: promosData } = useQuery({ queryKey: ['promos'], queryFn: () => API.promos.list() });

  const dynamicVouchers: VoucherItem[] = (promosData?.promos ?? []).map((p: any) => ({
    id: p.id || Math.random().toString(),
    code: p.code || 'TRUZZI',
    title: p.title,
    subtitle: p.subtitle || 'Promo spesial untuk Anda',
    category: 'all',
    badge: p.badge || 'PROMO TRUZZI',
    badgeType: 'exclusive',
    discountText: p.code ? `Gunakan Kode: ${p.code}` : 'Promo Spesial',
    gradient: p.gradient || 'from-[#7F1D3E] via-[#9B234D] to-[#5C1A3A]',
    accent: p.accent || 'text-primary',
    period: p.period || 'Berlaku s.d. Selesai',
    minTransaction: 'Tanpa min. transaksi',
    details: [p.subtitle || 'Promo menarik untuk Anda', 'Berlaku di aplikasi Truzzi'],
    terms: ['Syarat & Ketentuan berlaku'],
    isNew: true,
  }));

  const allVouchers = [...dynamicVouchers, ...VOUCHER_LIST];

  const filteredVouchers = allVouchers.filter((voucher) => {
    if (activeTab === 'expired') return false;
    if (activeTab !== 'all' && voucher.category !== activeTab && voucher.category !== 'all') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        voucher.title.toLowerCase().includes(q) ||
        voucher.code.toLowerCase().includes(q) ||
        voucher.subtitle.toLowerCase().includes(q) ||
        voucher.discountText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: allVouchers.length,
    jastip: allVouchers.filter((v) => v.category === 'jastip' || v.category === 'all').length,
    suruh: allVouchers.filter((v) => v.category === 'suruh' || v.category === 'all').length,
    cashback: allVouchers.filter((v) => v.category === 'cashback').length,
    expired: 0,
  };

  const getBadgeIcon = (type: VoucherItem['badgeType']) => {
    switch (type) {
      case 'exclusive':
        return <Sparkles className="w-3.5 h-3.5" />;
      case 'limited':
        return <Percent className="w-3.5 h-3.5" />;
      case 'weekend':
        return <Gift className="w-3.5 h-3.5" />;
      case 'referral':
        return <UserPlus className="w-3.5 h-3.5" />;
      default:
        return <Ticket className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 pb-12 antialiased">
      {/* Top Header Glassmorphism */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => navigate('/main')}
            className="p-2 -ml-2 rounded-full hover:bg-slate-100/80 transition-colors text-ink active:scale-95"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-ink leading-tight tracking-tight">Voucher & Promo</h1>
        </div>

        {/* Claim Box Container */}
        <div className="px-4 pt-1 pb-3">
          <form onSubmit={handleClaim} className="flex gap-2">
            <div className="relative flex-1">
              <Ticket className="w-4 h-4 text-primary/70 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={claimInput}
                onChange={(e) => setClaimInput(e.target.value.toUpperCase())}
                placeholder="Punya kode promo? Masukkan di sini..."
                className="w-full h-10 pl-10 pr-3 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-ink placeholder:text-ink-secondary/50 placeholder:font-normal focus:outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15 transition-all uppercase tracking-wider"
              />
              {claimInput && (
                <button
                  type="button"
                  onClick={() => setClaimInput('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-secondary hover:text-ink"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!claimInput.trim()}
              className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-98 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              Klaim
            </button>
          </form>
        </div>

        {/* Category Tabs Bar */}
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-3 pt-0.5">
          {[
            { id: 'all', label: 'Semua Promo', count: counts.all },
            { id: 'jastip', label: 'Jastip & Trip', count: counts.jastip },
            { id: 'cashback', label: 'Cashback & Bonus', count: counts.cashback },
            { id: 'expired', label: 'Kadaluarsa / Habis', count: counts.expired },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary to-primary-dark text-white shadow-md shadow-primary/20'
                    : 'bg-slate-100 text-ink-secondary hover:bg-slate-200/80 hover:text-ink'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    isActive ? 'bg-white/25 text-white' : 'bg-slate-200 text-ink-secondary'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 mt-4 space-y-4 max-w-xl mx-auto">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari promo berdasarkan nama atau diskon..."
            className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-white text-xs text-ink placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-ink"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Voucher Cards */}
        {filteredVouchers.length > 0 ? (
          filteredVouchers.map((voucher) => (
            <div
              key={voucher.id}
              onClick={() => setSelectedVoucher(voucher)}
              className="group cursor-pointer relative rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40"
            >
              {/* Top Banner Header with Real Ticket Styling */}
              <div className={`p-4 bg-gradient-to-r ${voucher.gradient} text-white relative overflow-hidden`}>
                {/* Background Watermark Decorative Pattern */}
                <div className="absolute -right-4 -bottom-4 opacity-15 pointer-events-none transform rotate-12">
                  <Ticket className="w-32 h-32 text-white" />
                </div>
                <div className="absolute -left-10 -top-10 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

                {/* Badge Header Row */}
                <div className="flex items-center justify-between gap-2 relative z-10">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-extrabold tracking-wide shadow-2xs">
                    {getBadgeIcon(voucher.badgeType)}
                    {voucher.badge}
                  </span>
                  {voucher.isNew && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black tracking-wider uppercase shadow-xs animate-pulse">
                      VOUCHER BARU!
                    </span>
                  )}
                </div>

                {/* Title & Discount */}
                <h3 className="text-base font-extrabold mt-3 leading-snug tracking-tight relative z-10 group-hover:text-amber-200 transition-colors">
                  {voucher.title}
                </h3>
                <p className="text-xs font-bold text-amber-200 mt-0.5 relative z-10 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 inline" />
                  {voucher.discountText}
                </p>
              </div>

              {/* Perforation Divider Line with Left & Right Cutout Notches */}
              <div className="relative h-4 bg-white flex items-center">
                {/* Left semi-circle notch */}
                <div className="w-4 h-4 bg-slate-50/70 border-r border-slate-200 rounded-r-full absolute -left-2 top-1/2 -translate-y-1/2 shadow-inner" />
                {/* Dotted Perforation Line */}
                <div className="w-full mx-5 border-b-2 border-dashed border-slate-200" />
                {/* Right semi-circle notch */}
                <div className="w-4 h-4 bg-slate-50/70 border-l border-slate-200 rounded-l-full absolute -right-2 top-1/2 -translate-y-1/2 shadow-inner" />
              </div>

              {/* Card Body */}
              <div className="px-4 pb-4 pt-1">
                <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">{voucher.subtitle}</p>

                {/* Minimal order & validity info */}
                <div className="mt-3.5 flex items-center justify-between text-[11px] text-ink-secondary bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary/70" />
                    Min. Order: <strong className="text-ink font-bold">{voucher.minTransaction}</strong>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <strong className="text-ink font-semibold">{voucher.period}</strong>
                  </span>
                </div>

                {/* Voucher Code & Action Buttons */}
                <div className="mt-3.5 flex items-center justify-between gap-2">
                  <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5">
                    <span className="font-mono font-black text-xs text-primary tracking-widest">{voucher.code}</span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyCode(voucher.code, e)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary-dark transition-all active:scale-95 ml-2"
                    >
                      {copiedCode === voucher.code ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-bold">Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (voucher.category === 'jastip') {
                        navigate('/jastip');
                      } else if (voucher.category === 'suruh') {
                        navigate('/suruh');
                      } else {
                        handleCopyCode(voucher.code);
                        navigate('/main');
                      }
                    }}
                    className="h-10 px-4 rounded-xl bg-gradient-to-r from-primary to-primary-dark text-white font-bold text-xs shadow-sm hover:brightness-105 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
                  >
                    <span>Pakai</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          /* Empty State UI */
          <div className="py-14 px-6 text-center bg-white rounded-3xl border border-slate-200/90 shadow-sm flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-slate-100 flex items-center justify-center text-primary mb-4 shadow-inner">
              <Ticket className="w-12 h-12 opacity-80" />
            </div>
            <h3 className="text-base font-bold text-ink">Tidak Ada Voucher Tersedia</h3>
            <p className="text-xs text-ink-secondary mt-1.5 max-w-xs leading-relaxed">
              {activeTab === 'expired'
                ? 'Tidak ada voucher yang kadaluarsa atau habis saat ini. Semua voucher promo siap Anda gunakan!'
                : searchQuery
                ? `Tidak ditemukan voucher yang sesuai dengan pencarian "${searchQuery}".`
                : 'Saat ini belum ada promo baru untuk kategori ini. Nantikan penawaran menarik berikutnya dari Truzzi!'}
            </p>

            {(searchQuery || activeTab !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('all');
                }}
                className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-dark transition-all active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                Lihat Semua Promo
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Voucher Bottom Sheet / Modal */}
      {selectedVoucher && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 transition-all"
          onClick={() => setSelectedVoucher(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl max-h-[88vh] flex flex-col overflow-hidden animate-[slideUp_0.2s_ease-out]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Pill Handle */}
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto my-2.5 sm:hidden shrink-0" />

            {/* Modal Header */}
            <div className={`p-5 bg-gradient-to-r ${selectedVoucher.gradient} text-white relative`}>
              <button
                onClick={() => setSelectedVoucher(null)}
                className="absolute right-4 top-4 p-1.5 rounded-full bg-black/20 text-white hover:bg-black/40 transition-colors active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold">
                {selectedVoucher.badge}
              </span>
              <h2 className="text-lg font-extrabold mt-2 leading-snug">{selectedVoucher.title}</h2>
              <p className="text-xs text-amber-200 font-bold mt-0.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                {selectedVoucher.discountText}
              </p>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs text-ink">
              <div>
                <h4 className="font-bold text-sm text-ink mb-2 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" />
                  Deskripsi Promo
                </h4>
                <ul className="space-y-2 text-ink-secondary pl-1">
                  {selectedVoucher.details.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <h4 className="font-bold text-sm text-ink mb-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  Syarat & Ketentuan
                </h4>
                <ul className="space-y-2 text-ink-secondary pl-1">
                  {selectedVoucher.terms.map((term, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{term}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl">
                <span className="text-ink-secondary font-medium">Masa Berlaku Promo:</span>
                <span className="font-bold text-ink flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  {selectedVoucher.period}
                </span>
              </div>
            </div>

            {/* Modal Bottom Action Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
              <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl border-2 border-dashed border-primary/40 bg-white shadow-2xs">
                <span className="font-mono font-black text-xs text-primary tracking-widest">{selectedVoucher.code}</span>
                <button
                  type="button"
                  onClick={() => handleCopyCode(selectedVoucher.code)}
                  className="text-xs font-bold text-primary hover:text-primary-dark transition-colors"
                >
                  Salin
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  const code = selectedVoucher.code;
                  const cat = selectedVoucher.category;
                  setSelectedVoucher(null);
                  handleCopyCode(code);
                  if (cat === 'jastip') navigate('/jastip');
                  else if (cat === 'suruh') navigate('/suruh');
                  else navigate('/main');
                }}
                className="btn-primary !w-auto px-6 !h-10 text-xs font-bold shadow-md hover:brightness-105 active:scale-95 transition-all"
              >
                Gunakan Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
