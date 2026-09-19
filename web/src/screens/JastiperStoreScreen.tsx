import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Share2,
  Star,
  CheckCircle2,
  Clock,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  X,
  ChevronLeft,
  ChevronRight,
} from '../components/icons';
import { API } from '../lib/api';
import { useAuthStore } from '../store/auth';
import { useSnackbar } from 'notistack';

export default function JastiperStoreScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const user = useAuthStore((s) => s.user);

  const [jastiper, setJastiper] = useState<any>(location.state?.jastiper || null);
  const [loading, setLoading] = useState(!jastiper);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const touchStartX = useRef(0);

  useEffect(() => {
    if (!jastiper && id) {
      API.jastipers
        .get(id)
        .then((res) => setJastiper(res.data))
        .catch(() => {
          enqueueSnackbar('Gagal memuat data Jastiper', { variant: 'error' });
          navigate('/main');
        })
        .finally(() => setLoading(false));
    }
  }, [id, jastiper, navigate, enqueueSnackbar]);

  const handleShare = async () => {
    const url = window.location.href;
    const shareData = {
      title: `Toko Jastip ${jastiper?.name || ''}`,
      text: `Titip belanja di ${jastiper?.name} lewat Truzzi!`,
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(url);
      enqueueSnackbar('Link toko disalin ke clipboard!', { variant: 'success' });
    }
  };

  const updateCart = (productId: string, delta: number) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [productId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [productId]: next };
    });
  };

  const calculateTotalOrder = () => {
    if (!jastiper?.products) return 0;
    return jastiper.products.reduce((acc: number, p: any) => acc + p.price * (cart[p.id] || 0), 0);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const proceedOrderFromTrip = () => {
    if (!jastiper) return;
    const items = Object.entries(cart).map(([pId, qty]) => {
      const p = jastiper.products.find((x: any) => x.id === pId);
      return { id: p.id, title: p.title, price: p.price, qty, image: p.images?.[0] };
    });
    if (items.length === 0) {
      enqueueSnackbar('Pilih minimal 1 barang pesanan', { variant: 'warning' });
      return;
    }
    const total = calculateTotalOrder();
    const itemNames = items.map((i) => `${i.qty}x ${i.title}`).join(', ');

    navigate('/jastip/summary', {
      state: {
        jastiperId: jastiper.id || jastiper.jastiperId,
        tripTitle: jastiper.openTripTitle,
        item: itemNames,
        budget: total.toString(),
        ongkirCustom: jastiper.flatOngkir ?? 10000,
        pickup: 'Katalog Jastiper',
        pickupLat: -6.2,
        pickupLng: 106.8,
        dropoff: '',
      },
    });
  };

  const chatJastiper = async () => {
    if (!jastiper || !user) return;
    const jId = jastiper.id || jastiper.jastiperId;
    const roomId = user.id < jId ? `room_${user.id}_${jId}` : `room_${jId}_${user.id}`;
    try {
      await API.chat.send(roomId, {
        text: 'Halo, saya ingin request titip khusus nih. Bisa bantu carikan barang/varian lain?',
        messageType: 'text',
        senderRole: 'customer',
      });
    } catch {
      /* ignore */
    }
    navigate(`/chat/room?targetUserId=${jId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        Memuat data...
      </div>
    );
  }

  if (!jastiper) return null;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header Sticky */}
      <header className="bg-surface px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm border-b border-border">
        <button
          onClick={() => navigate(-1)}
          aria-label="Kembali"
          className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-ink" />
        </button>
        <h1 className="font-semibold text-base flex-1 ml-3 truncate">Toko {jastiper.name}</h1>
        <button
          onClick={handleShare}
          aria-label="Bagikan"
          className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center shrink-0"
        >
          <Share2 className="w-4 h-4 text-ink" />
        </button>
      </header>

      {/* Banner / Profile Section */}
      <div className="bg-surface px-4 py-5 border-b border-border">
        <div className="flex items-start gap-4">
          {jastiper.photoUrl ? (
            <img
              src={jastiper.photoUrl}
              alt=""
              className="w-16 h-16 rounded-2xl object-cover border border-border shrink-0 shadow-sm"
            />
          ) : (
            <span className="w-16 h-16 rounded-2xl bg-surface-hover border border-border flex items-center justify-center text-3xl shrink-0">
              👤
            </span>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-lg text-ink truncate">{jastiper.name}</h2>
              {jastiper.verified && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
            </div>
            <p className="text-sm text-ink-secondary mt-0.5">{jastiper.area}</p>

            <div className="flex items-center gap-3 mt-2 text-xs">
              <span className="flex items-center gap-1 text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded-md">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {Math.min(5.0, Number(jastiper.rating ?? 5.0)).toFixed(1)}
              </span>
              <span className="text-ink-secondary bg-surface-hover px-2 py-1 rounded-md">
                {jastiper.totalOrders ?? 0} selesai
              </span>
            </div>
          </div>
        </div>

        {/* Schedule Highlight */}
        <div className="mt-5 bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-2xl p-3.5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
              JADWAL TRIP JASTIP
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              {jastiper.openTripSchedule || 'Besok Pagi'}
            </span>
          </div>
          <p className="text-sm font-bold text-ink mb-1">
            {jastiper.openTripTitle || `Jastip ${jastiper.name}`}
          </p>
          <p className="text-xs text-ink-secondary leading-relaxed">
            {jastiper.bio || 'Siap membantu membelikan barang titipanmu.'}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-error text-xs font-medium">
            <Clock className="w-3.5 h-3.5" /> Batas Pemesanan:{' '}
            {jastiper.openTripClosing || 'Hari ini'}
          </div>
        </div>
      </div>

      {/* Product Catalog */}
      <div className="px-4 py-5">
        <h3 className="font-bold text-sm text-ink mb-3 flex items-center gap-1.5">
          <ShoppingBag className="w-4 h-4 text-primary" /> Daftar Barang Titipan
        </h3>

        {jastiper.products && jastiper.products.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {jastiper.products.map((p: any) => {
              const qty = cart[p.id] || 0;
              return (
                <div
                  key={p.id}
                  className="bg-surface border border-border rounded-2xl p-3 flex items-start gap-3 shadow-2xs hover:border-primary/30 transition-colors cursor-pointer active:scale-[0.98]"
                  onClick={() => {
                    setSelectedProduct(p);
                    setImgIndex(0);
                  }}
                >
                  {p.images && p.images.length > 0 ? (
                    <img
                      src={p.images[0]}
                      alt={p.title}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 border border-border/60"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-surface-hover shrink-0 flex items-center justify-center text-ink-secondary/50">
                      🛍️
                    </div>
                  )}
                  <div className="flex-1 min-w-0 py-0.5">
                    <p className="text-sm font-bold text-ink leading-tight">{p.title}</p>
                    <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed mt-1">
                      {p.description}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm font-bold text-primary">{formatRupiah(p.price)}</p>
                      {/* Qty Selector */}
                      <div
                        className="flex items-center gap-2 shrink-0 bg-[#F3F4F6] border border-border/60 rounded-xl p-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => updateCart(p.id, -1)}
                          disabled={qty === 0}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                            qty > 0
                              ? 'bg-white text-ink shadow-2xs active:scale-95'
                              : 'text-ink-secondary/30'
                          }`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-ink">{qty}</span>
                        <button
                          onClick={() => updateCart(p.id, 1)}
                          className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center active:scale-95 transition-transform shadow-2xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-6 text-center">
            <span className="text-3xl block mb-2">📦</span>
            <p className="text-sm font-bold text-ink">Belum Ada Katalog</p>
            <p className="text-xs text-ink-secondary mt-1">
              Jastiper ini belum mengunggah barang apa pun.
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-surface border-t border-border p-4 pb-8 shadow-[0_-4px_15px_-3px_rgba(0,0,0,0.05)] z-20 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-ink-secondary font-medium">Total Estimasi Belanja</p>
            <p className="text-lg font-bold text-primary leading-none mt-0.5">
              {formatRupiah(calculateTotalOrder())}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={chatJastiper}
            className="btn-outline flex-1 !h-12 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border-primary/30 text-primary bg-primary/5 hover:bg-primary/10"
          >
            <MessageCircle className="w-4 h-4" /> Request Khusus
          </button>
          <button
            onClick={proceedOrderFromTrip}
            className="btn-primary flex-1 !h-12 text-xs font-bold rounded-xl shadow-md"
          >
            Lanjut Pesan Titip
          </button>
        </div>
      </div>

      {/* ── Product Detail Modal (Shopee-style) ── */}
      {selectedProduct &&
        (() => {
          const p = selectedProduct;
          const images: string[] = p.images && p.images.length > 0 ? p.images : [];
          const qty = cart[p.id] || 0;

          return (
            <div
              className="fixed inset-0 z-50 flex flex-col"
              onClick={() => setSelectedProduct(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              {/* Modal Content — slides up from bottom */}
              <div
                className="relative mt-auto w-full max-w-[480px] mx-auto bg-surface rounded-t-3xl overflow-hidden flex flex-col animate-[slideUp_0.3s_ease-out]"
                style={{ maxHeight: '92vh' }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={() => setSelectedProduct(null)}
                  className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center backdrop-blur-sm hover:bg-black/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Image Carousel */}
                {images.length > 0 ? (
                  <div className="relative w-full aspect-square bg-[#F8F8F8] overflow-hidden">
                    <img
                      src={images[imgIndex]}
                      alt={p.title}
                      className="w-full h-full object-contain"
                      draggable={false}
                      onTouchStart={(e) => {
                        touchStartX.current = e.touches[0].clientX;
                      }}
                      onTouchEnd={(e) => {
                        const diff = touchStartX.current - e.changedTouches[0].clientX;
                        if (Math.abs(diff) > 50) {
                          if (diff > 0 && imgIndex < images.length - 1) setImgIndex(imgIndex + 1);
                          if (diff < 0 && imgIndex > 0) setImgIndex(imgIndex - 1);
                        }
                      }}
                    />

                    {/* Arrow nav (desktop) */}
                    {images.length > 1 && (
                      <>
                        {imgIndex > 0 && (
                          <button
                            onClick={() => setImgIndex(imgIndex - 1)}
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-ink" />
                          </button>
                        )}
                        {imgIndex < images.length - 1 && (
                          <button
                            onClick={() => setImgIndex(imgIndex + 1)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-ink" />
                          </button>
                        )}
                      </>
                    )}

                    {/* Dots indicator */}
                    {images.length > 1 && (
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {images.map((_: string, i: number) => (
                          <button
                            key={i}
                            onClick={() => setImgIndex(i)}
                            className={`rounded-full transition-all ${
                              i === imgIndex ? 'w-5 h-2 bg-primary' : 'w-2 h-2 bg-white/70'
                            }`}
                          />
                        ))}
                      </div>
                    )}

                    {/* Image counter badge */}
                    <div className="absolute top-3 left-3 bg-black/50 text-white text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm">
                      {imgIndex + 1}/{images.length}
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] bg-surface-hover flex items-center justify-center">
                    <span className="text-6xl opacity-40">🛍️</span>
                  </div>
                )}

                {/* Product Info */}
                <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6">
                  {/* Price */}
                  <p className="text-2xl font-black text-primary">{formatRupiah(p.price)}</p>

                  {/* Title */}
                  <h3 className="text-base font-bold text-ink mt-2 leading-snug">{p.title}</h3>

                  {/* Category tag */}
                  {p.category && (
                    <span className="inline-block mt-2 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {p.category}
                    </span>
                  )}

                  {/* Divider */}
                  <div className="border-t border-border my-4" />

                  {/* Description */}
                  <div>
                    <p className="text-xs font-bold text-ink mb-1.5">Deskripsi Produk</p>
                    <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line">
                      {p.description || 'Tidak ada deskripsi.'}
                    </p>
                  </div>

                  {/* Extra info if available */}
                  {(p.weight || p.origin) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {p.weight && (
                        <span className="text-[11px] bg-surface-hover px-2.5 py-1 rounded-lg text-ink-secondary">
                          ⚖️ {p.weight}
                        </span>
                      )}
                      {p.origin && (
                        <span className="text-[11px] bg-surface-hover px-2.5 py-1 rounded-lg text-ink-secondary">
                          📍 {p.origin}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Add-to-Cart Bar */}
                <div className="border-t border-border px-5 py-4 flex items-center gap-3 bg-surface">
                  <div className="flex items-center gap-2 bg-[#F3F4F6] border border-border/60 rounded-xl p-1">
                    <button
                      onClick={() => updateCart(p.id, -1)}
                      disabled={qty === 0}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        qty > 0
                          ? 'bg-white text-ink shadow-sm active:scale-95'
                          : 'text-ink-secondary/30'
                      }`}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold text-ink">{qty}</span>
                    <button
                      onClick={() => updateCart(p.id, 1)}
                      className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center active:scale-95 transition-transform shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      if (qty === 0) updateCart(p.id, 1);
                      setSelectedProduct(null);
                      enqueueSnackbar(`${p.title} ditambahkan ke keranjang`, {
                        variant: 'success',
                      });
                    }}
                    className="btn-primary flex-1 !h-11 text-sm font-bold rounded-xl shadow-md"
                  >
                    {qty > 0 ? `Dalam Keranjang (${qty})` : '+ Keranjang'}
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
