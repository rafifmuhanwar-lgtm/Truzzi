import { useMemo, useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { useAuthStore } from '../store/auth';
import { useLocationStore } from '../store/location';
import { API } from '../lib/api';
import { formatRupiah } from '../lib/format';
import type { Order, Jastiper } from '../types';
import {
  MapPin,
  Search,
  ShoppingBasket,
  History,
  Ticket,
  HelpCircle,
  ChevronRight,
  BagService,
  ChevronDown,
  MyLocation,
  Bike,
  Sparkles,
  PlusCircle,
  Flame,
  Star,
  ArrowRight,
  Heart,
  MessageCircle,
} from '../components/icons';
import jastiperRunning from '../assets/images/jastiper_running.png';
import Carousel from '../components/Carousel';

/** Definisi slide banner promo — semuanya memakai layout identik agar ukurannya serasi. */
type PromoSlideDef = {
  id?: string;
  badge: string;
  badgeIcon?: ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  code: string;
  gradient: string;
  accent: string;
  image?: string;
  icon?: ComponentType<{ className?: string }>;
  detail?: string[];
  period?: string;
  terms?: string[];
  description?: string;
};
/** Slide promo dengan layout identik supaya ukuran banner serasi antar slide. */
function PromoSlide({
  slide,
  onOpen,
}: {
  slide: PromoSlideDef;
  onOpen: (s: PromoSlideDef) => void;
}) {
  const BadgeIcon = slide.badgeIcon || Sparkles;
  const Visual = slide.image ? undefined : slide.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(slide)}
      className={`mx-6 w-[calc(100%-48px)] bg-gradient-to-br ${slide.gradient} rounded-2xl p-5 flex items-center gap-4 relative overflow-hidden text-left cursor-pointer transition-transform active:scale-[0.98]`}
    >
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Ccircle cx=%2250%22 cy=%2250%22 r=%2240%22 fill=%22none%22 stroke=%22%23ffffff%22 stroke-width=%220.5%22 opacity=%220.1%22/%3E%3C/svg%3E')] opacity-20" />
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/5 to-transparent" />

      <div className="flex-1 min-w-0 relative z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold mb-3">
          <BadgeIcon className="w-3.5 h-3.5" />
          <span>{slide.badge}</span>
        </div>
        <p className="text-white text-lg font-bold font-sans leading-snug truncate">
          {slide.title}
        </p>
        <p className="text-white/80 text-xs mt-1.5 leading-relaxed line-clamp-2">
          {slide.subtitle}
        </p>
        <span className="inline-flex items-center gap-1.5 mt-3 text-white/70 text-[11px]">
          <ChevronRight className="w-3 h-3" />
          Detail &amp; kode promo
        </span>
      </div>

      <div className="relative z-10 shrink-0">
        {slide.image || Visual ? (
          <span className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-white/20 text-white">
            {slide.image ? (
              <img
                src={slide.image}
                alt={slide.title}
                className="w-16 h-16 object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.2)]"
              />
            ) : Visual ? (
              <Visual className="w-16 h-16 object-contain" />
            ) : null}
          </span>
        ) : null}
      </div>
    </button>
  );
}

/** Bottom sheet detail promo — muncul saat banner diklik. */
function PromoDetailSheet({
  slide,
  onClose,
  isClaimed,
  onClaim,
}: {
  slide: PromoSlideDef | null;
  onClose: () => void;
  isClaimed?: boolean;
  onClaim?: (code: string) => void;
}) {
  if (!slide) return null;
  const BadgeIcon = slide.badgeIcon || Sparkles;

  return (
    <div
      className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg rounded-t-3xl overflow-hidden animate-[slideUp_0.25s_ease-out]"
        style={{ animation: 'slideUp 0.25s ease-out' }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3">
          <span className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header gradient / Banner Image */}
        {slide.image ? (
          <div className="w-full h-48 bg-slate-100 relative">
            <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-6 right-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-bold mb-2 uppercase tracking-wide">
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>{slide.badge}</span>
              </div>
              <p className="text-white text-xl font-black font-sans leading-snug">{slide.title}</p>
            </div>
          </div>
        ) : (
          <div
            className={`bg-gradient-to-br ${slide.gradient} p-6 flex items-center gap-4 relative overflow-hidden`}
          >
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="flex-1 min-w-0 relative z-10">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wide">
                <BadgeIcon className="w-3.5 h-3.5" />
                <span>{slide.badge}</span>
              </div>
              <p className="text-white text-xl font-bold font-sans leading-snug mt-2.5">
                {slide.title}
              </p>
              <p className="text-white/80 text-sm mt-1.5 leading-relaxed">{slide.subtitle}</p>
            </div>
            {slide.icon && (
              <span className="relative z-10 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 text-white shrink-0">
                <slide.icon className="w-10 h-10 object-contain" />
              </span>
            )}
          </div>
        )}

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <h3 className="font-bold text-sm mb-2">Detail Promo</h3>
            <ul className="space-y-1.5">
              {slide.detail?.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-ink leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-3 rounded-xl bg-background">
            <span className="w-1 h-10 rounded-full bg-primary" />
            <div className="min-w-0">
              <p className="text-[11px] text-ink-secondary font-medium">Periode Berlaku</p>
              <p className="text-sm font-bold text-ink">{slide.period}</p>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm mb-2">Syarat &amp; Ketentuan</h3>
            <ul className="space-y-1.5">
              {slide.terms?.map((t, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-xs text-ink-secondary leading-relaxed"
                >
                  <span className="w-1 h-1 rounded-full bg-ink-secondary/50 shrink-0 mt-1.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-6 pt-0 space-y-2.5">
          <button
            disabled={isClaimed}
            onClick={() => onClaim?.(slide.code)}
            className={`flex items-center justify-center gap-2 !h-[50px] w-full rounded-2xl font-bold text-sm transition-colors ${
              isClaimed
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary-dark shadow-sm'
            }`}
          >
            {isClaimed ? 'Sudah Diklaim' : 'Klaim Voucher'}
          </button>
          <button
            onClick={onClose}
            className="btn-outline flex-1 !h-[46px] w-full !border-border !bg-background !text-ink-secondary"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: JSX.Element;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2">
      <span className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center">
        {icon}
      </span>
      <span className="text-[11px] text-ink-secondary">{label}</span>
    </button>
  );
}

export default function HomeScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);
  const loc = useLocationStore();
  const [selectedPromo, setSelectedPromo] = useState<PromoSlideDef | null>(null);
  const [selectedJastiper, setSelectedJastiper] = useState<Jastiper | null>(null);

  const { data: ordersData } = useQuery({ queryKey: ['orders'], queryFn: () => API.orders.list() });

  const orders: Order[] = ordersData?.orders ?? [];
  const activeOrder = useMemo(
    () => orders.find((o) => o.status === 'processing' || o.status === 'shipping'),
    [orders],
  );

  const { data: promosData } = useQuery({ queryKey: ['promos'], queryFn: () => API.promos.list() });
  const { data: claimsData } = useQuery({
    queryKey: ['my-promos'],
    queryFn: () => API.promos.mine(),
  });
  useQuery({ queryKey: ['jastipers'], queryFn: () => API.jastipers.list(), staleTime: 60000 });
  const { data: popularData } = useQuery({
    queryKey: ['jastipers-popular'],
    queryFn: () => API.jastipers.popular(),
    staleTime: 60000,
  });
  const { data: newestData } = useQuery({
    queryKey: ['jastipers-newest'],
    queryFn: () => API.jastipers.newest(),
    staleTime: 60000,
  });
  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => API.favorites.list(),
    staleTime: 30000,
  });
  const favorites: Jastiper[] = favoritesData?.favorites ?? [];
  const popularJastipers: Jastiper[] = popularData?.jastipers ?? [];
  const newestJastipers: Jastiper[] = newestData?.jastipers ?? [];
  const myClaims: any[] = claimsData?.claims ?? [];

  const handleClaim = async (code: string) => {
    try {
      await API.promos.claim({ code });
      enqueueSnackbar('Voucher berhasil diklaim!', { variant: 'success' });
      qc.invalidateQueries({ queryKey: ['my-promos'] });
    } catch (e: any) {
      enqueueSnackbar(e.message || 'Gagal mengklaim voucher', { variant: 'error' });
    }
  };

  const customPromosList = useMemo(() => {
    const rawList: any[] = promosData?.promos ?? [];
    return rawList.map((p) => {
      const details = [];
      if (p.subtitle) details.push(p.subtitle);
      if (p.minTransaction > 0) details.push(`Minimal transaksi ${formatRupiah(p.minTransaction)}`);

      let promoVal = '';
      if (p.type === 'discount' && p.discountPercent) {
        promoVal =
          `Diskon ${p.discountPercent}%` +
          (p.maxDiscount ? ` s.d ${formatRupiah(p.maxDiscount)}` : '');
      } else if (p.type === 'cashback') {
        promoVal = `Potongan langsung ${formatRupiah(p.discountFlat)}`;
      } else if (p.type === 'gratis_ongkir') {
        promoVal = `Gratis Ongkir` + (p.maxDiscount ? ` s.d ${formatRupiah(p.maxDiscount)}` : '');
      }
      if (promoVal) details.push(promoVal);

      details.push(
        p.category === 'all'
          ? 'Berlaku untuk semua layanan Truzzi'
          : `Khusus layanan ${p.category === 'jastip' ? 'Jastip' : 'Suruh'}`,
      );

      let periodText = 'Berlaku s.d. Selesai';
      if (p.startDate && p.endDate) {
        const start = new Date(p.startDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
        });
        const end = new Date(p.endDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        periodText = `${start} - ${end}`;
      }

      const terms = [
        'Syarat & Ketentuan berlaku',
        'Promo tidak dapat digabungkan dengan promo lain',
        'Truzzi berhak membatalkan promo bila ditemukan kecurangan',
      ];
      if (p.quota > 0) terms.unshift(`Kuota promo terbatas!`);

      return {
        badge: p.badge || 'PROMO TRUZZI',
        badgeIcon: Sparkles,
        title: p.title,
        subtitle: p.subtitle || '',
        code: p.code || 'TRUZZI',
        gradient: p.gradient || 'from-primary via-primary-dark to-[#5C1A3A]',
        accent: p.accent || 'text-primary-dark',
        image: p.imageUrl,
        detail: details,
        period: periodText,
        terms: terms,
      };
    });
  }, [promosData]);

  const allSlides = customPromosList;

  return (
    <div className="min-h-0 bg-background">
      {/* ── Header burgundy lengkung ── */}
      <div className="bg-primary rounded-b-[28px] px-6 pt-6 pb-8">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white font-sans leading-snug">
              Hallo, <span className="break-words">{user?.name ?? 'Dinda'}</span> 👋
            </h1>
            <p className="text-sm text-white/70 mt-1">Mau dibantuin apa hari ini?</p>
            <button
              onClick={() =>
                enqueueSnackbar('Pilih lokasi baru di form pemesanan', { variant: 'info' })
              }
              className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[20px] bg-white/15 border border-white/35 text-white text-[11px] font-medium max-w-full"
            >
              {loc.status === 'loading' ? (
                <MyLocation className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <MapPin className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="min-w-0 truncate">
                {loc.status === 'ready'
                  ? loc.address
                  : loc.status === 'loading'
                    ? 'Mendeteksi lokasi kamu...'
                    : 'Klik atur lokasi kamu'}
              </span>
              <ChevronDown className="w-4 h-4 text-white/80 shrink-0" />
            </button>
          </div>
          <img
            src={jastiperRunning}
            alt=""
            className="w-20 h-20 object-contain rounded-xl shrink-0"
          />
        </div>

        {/* Search */}
        <div className="mt-4">
          <div className="bg-white rounded-full flex items-center px-4 py-3">
            <Search className="w-5 h-5 text-ink-secondary mr-2 shrink-0" />
            <input
              placeholder="Cari atau tulis sendiri..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-secondary/60 focus:outline-none"
              onFocus={() => navigate('/jastip')}
              readOnly
            />
          </div>
        </div>
      </div>

      {/* ── Konten ── */}
      <div className="mx-auto max-w-lg px-0 pb-8">
        {/* Service card — Jastip Utama */}
        <div className="px-6 mt-6">
          <button
            onClick={() => navigate('/jastip')}
            className="w-full card p-4 flex items-center justify-between group hover:border-primary/40 transition-all bg-white"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <span className="inline-flex p-2.5 rounded-2xl bg-primary/10 group-hover:scale-105 transition-transform shrink-0">
                <BagService className="w-[42px] h-[42px] rounded-xl object-contain" />
              </span>
              <div className="text-left min-w-0">
                <p className="font-bold text-base leading-tight text-ink">
                  Yuk, Eksplore Open Trip & Jastip disini!
                </p>
                <p className="text-xs text-ink-secondary mt-0.5 truncate">
                  Open Trip, Oleh-Oleh &amp; Titip Belanja
                </p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:translate-x-0.5 transition-transform ml-2">
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>

        {/* Quick actions */}
        <div className="px-6 mt-6 flex justify-around">
          <QuickAction
            icon={<History className="w-6 h-6 text-primary" />}
            label="Riwayat"
            onClick={() => navigate('/main?tab=orders&filter=completed')}
          />
          <QuickAction
            icon={<PlusCircle className="w-6 h-6 text-primary" />}
            label="Buka Jastip"
            onClick={() => navigate('/jastip/manage')}
          />
          <QuickAction
            icon={<Ticket className="w-6 h-6 text-primary" />}
            label="Voucher"
            onClick={() => navigate('/vouchers')}
          />
          <QuickAction
            icon={<HelpCircle className="w-6 h-6 text-primary" />}
            label="Bantuan"
            onClick={() => navigate('/profile/help')}
          />
        </div>

        {/* Active Order Tracker */}
        {activeOrder && (
          <div className="px-6 mt-6">
            <div
              className="card p-4"
              style={{
                borderColor: 'rgba(127,29,58,0.2)',
                boxShadow: '0 4px 12px rgba(127,29,58,0.05)',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E8F5E9]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32]" />
                  <span className="text-[10px] font-bold text-[#2E7D32] uppercase">
                    {activeOrder.statusText}
                  </span>
                </span>
                <span className="text-xs font-bold text-primary shrink-0">Sedang Proses</span>
              </div>
              <div className="flex items-center gap-3 mt-3.5">
                <span className="p-3 rounded-full bg-primary/10 shrink-0">
                  {activeOrder.serviceName.toLowerCase().includes('suruh') ? (
                    <Bike className="w-6 h-6 text-primary" />
                  ) : (
                    <ShoppingBasket className="w-6 h-6 text-primary" />
                  )}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-ink truncate">
                    {activeOrder.serviceName} - {activeOrder.title}
                  </p>
                  <p className="text-[11px] leading-snug mt-1 text-ink-secondary line-clamp-2">
                    {activeOrder.statusText ||
                      (activeOrder.jastiperId
                        ? 'Jastiper sedang memproses pesananmu'
                        : 'Sedang mencari jastiper...')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/tracking', { state: { order: activeOrder } })}
                className="btn-primary mt-3.5 !h-[38px] text-xs"
              >
                Lacak Jastiper Langsung
              </button>
            </div>
          </div>
        )}

        {/* Promo Carousel — gabungkan bawaan + custom promo dari admin */}
        <div className="mt-6">
          <Carousel
            autoSlide={true}
            autoSlideInterval={5000}
            showIndicators={true}
            showArrows={false}
          >
            {allSlides.map((slide, idx) => (
              <PromoSlide key={slide.code + '_' + idx} slide={slide} onOpen={setSelectedPromo} />
            ))}
          </Carousel>
        </div>

        {/* ── Jastiper Terbaru ── */}
        {newestJastipers.length > 0 && (
          <div className="mt-7">
            <div className="px-6 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold">Jastiper Terbaru</h2>
                <p className="text-xs text-ink-secondary mt-0.5">Jastiper yang baru bergabung</p>
              </div>
              <button
                onClick={() => navigate('/jastip')}
                className="text-xs text-primary font-semibold shrink-0 flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-3.5 px-6 flex gap-3.5 overflow-x-auto no-scrollbar">
              {newestJastipers.slice(0, 5).map((j) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJastiper(j)}
                  className="card w-[140px] shrink-0 text-left overflow-hidden hover:shadow-soft transition-shadow"
                >
                  <div className="h-[80px] bg-surface rounded-xl flex items-center justify-center overflow-hidden">
                    {j.photoUrl ? (
                      <img src={j.photoUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">📦</span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-[12px] font-bold truncate">{j.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-ink-secondary">
                        {Number(j.rating || 0).toFixed(1)}
                      </span>
                    </div>
                    {j.area && (
                      <p className="text-[9px] text-ink-secondary mt-0.5 truncate">{j.area}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Jastiper Terpopuler ── */}
        {popularJastipers.length > 0 && (
          <div className="mt-7">
            <div className="px-6 flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-base font-bold flex items-center gap-2">
                  Jastiper Terpopuler <Flame className="w-5 h-5 text-amber-500" />
                </h2>
                <p className="text-xs text-ink-secondary mt-0.5">
                  Jastiper dengan rating tertinggi
                </p>
              </div>
              <button
                onClick={() => navigate('/jastip')}
                className="text-xs text-primary font-semibold shrink-0 flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <div className="mt-3.5 px-6 space-y-3">
              {popularJastipers.slice(0, 3).map((j, i) => (
                <button
                  key={j.id}
                  onClick={() => setSelectedJastiper(j)}
                  className="w-full text-left flex items-center gap-3 card p-3 hover:shadow-soft transition-shadow"
                >
                  <span className="text-sm font-bold text-ink-secondary w-5">#{i + 1}</span>
                  {j.photoUrl ? (
                    <img src={j.photoUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <span className="w-12 h-12 rounded-xl bg-surface flex items-center justify-center text-xl">
                      📦
                    </span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{j.name}</p>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[11px] text-ink-secondary">
                        {Number(j.rating || 0).toFixed(1)} ({j.totalOrders ?? 0})
                      </span>
                    </div>
                  </div>
                  {j.status === 'online' && (
                    <span className="w-2 h-2 rounded-full bg-success shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom sheet detail promo */}
      <PromoDetailSheet
        slide={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        isClaimed={
          selectedPromo ? myClaims.some((c) => c.promo?.code === selectedPromo.code) : false
        }
        onClaim={handleClaim}
      />

      {/* Jastiper Detail Sheet */}
      {selectedJastiper && (
        <div
          className="fixed inset-0 z-[1500] bg-black/40 flex items-end justify-center"
          onClick={() => setSelectedJastiper(null)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pb-3">
              <span className="w-10 h-1 rounded-full bg-border" />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {selectedJastiper.photoUrl ? (
                  <img
                    src={selectedJastiper.photoUrl}
                    alt=""
                    className="w-16 h-16 rounded-2xl object-cover border border-border"
                  />
                ) : (
                  <span className="w-16 h-16 rounded-2xl bg-surface border border-border flex items-center justify-center text-3xl">
                    📦
                  </span>
                )}
                <div>
                  <h3 className="font-bold text-base text-ink">{selectedJastiper.name}</h3>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-ink">
                      {Number(selectedJastiper.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-ink-secondary">
                      ({selectedJastiper.totalOrders ?? 0} pesanan)
                    </span>
                  </div>
                  {selectedJastiper.area && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-ink-secondary" />
                      <span className="text-xs text-ink-secondary">{selectedJastiper.area}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={async () => {
                  const isFav = favorites.some((f) => f.id === selectedJastiper.id);
                  try {
                    if (isFav) {
                      await API.favorites.remove(selectedJastiper.id);
                      enqueueSnackbar('Dihapus dari favorite', { variant: 'info' });
                    } else {
                      await API.favorites.add(selectedJastiper.id);
                      enqueueSnackbar('Ditambahkan ke favorite ❤️', { variant: 'success' });
                    }
                    qc.invalidateQueries({ queryKey: ['favorites'] });
                  } catch {
                    enqueueSnackbar('Gagal memperbarui favorite', { variant: 'error' });
                  }
                }}
                className="w-10 h-10 rounded-full bg-surface border border-border flex items-center justify-center shrink-0"
              >
                <Heart
                  className={`w-5 h-5 ${
                    favorites.some((f) => f.id === selectedJastiper.id)
                      ? 'text-error fill-error'
                      : 'text-ink-secondary'
                  }`}
                />
              </button>
            </div>

            {selectedJastiper.services && selectedJastiper.services.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-ink-secondary mb-1.5">Layanan Unggulan:</p>
                <div className="flex flex-wrap gap-1.5">
                  {selectedJastiper.services.map((s) => (
                    <span
                      key={s}
                      className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Produk Jastip */}
            {selectedJastiper.products && selectedJastiper.products.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-ink-secondary mb-2">
                  Katalog Jastip Tersedia:
                </p>
                <div className="space-y-2">
                  {selectedJastiper.products.map((p) => (
                    <div key={p.id} className="card p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-ink truncate">{p.title}</p>
                        <p className="text-[11px] text-ink-secondary truncate">{p.description}</p>
                        <p className="text-xs font-bold text-primary mt-1">
                          {formatRupiah(p.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedJastiper(null);
                          navigate('/jastip/form', {
                            state: { item: p.title, budget: String(p.price) },
                          });
                        }}
                        className="btn-primary !h-8 !w-auto px-3 text-[11px] font-semibold shrink-0"
                      >
                        Pesan Ini
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setSelectedJastiper(null);
                  navigate(`/chat/room?targetUserId=${selectedJastiper.id}`);
                }}
                className="btn-outline flex-1 !h-11 text-xs"
              >
                <MessageCircle className="w-4 h-4 mr-1.5 inline" /> Chat Jastipper
              </button>
              <button
                onClick={() => {
                  setSelectedJastiper(null);
                  navigate('/jastip');
                }}
                className="btn-primary flex-1 !h-11 text-xs"
              >
                Buka Open Jastip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
