import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API, errMsg } from '../lib/api';
import type { JastiperProfile, JastipProduct } from '../types';
import { useAuthStore } from '../store/auth';
import {
  ShoppingBag,
  Plus,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  MapPin,
  Clock,
  ChevronRight,
  Sparkles,
  X,
  Star,
  Search,
  Package,
  Settings2,
  Camera,
} from 'lucide-react';

const PRESET_CATEGORIES = ['Kuliner', 'Home & Living', 'Beauty', 'Fashion', 'Snack', 'Umum'];

function formatRupiah(n: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(n);
}

// ── Sub-components ──────────────────────────────────────────────────────────

function TripActiveCard({
  jastiper,
  onEdit,
  onUploadCover,
  uploadingCover,
}: {
  jastiper: JastiperProfile;
  onEdit: () => void;
  onUploadCover: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingCover: boolean;
}) {
  return (
    <div className="card-pad space-y-3">
      {/* Trip banner with Cover Image Support */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary via-primary to-[#7a1535] p-4 text-white relative min-h-[150px] flex flex-col justify-between shadow-md">
        {jastiper.coverUrl ? (
          <img
            src={jastiper.coverUrl}
            alt="Trip Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs text-[10px] font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {jastiper.isJastipActive ? 'TRIP AKTIF' : 'TIDAK AKTIF'}
            </span>
            <div className="flex items-center gap-1.5">
              <label
                className={`cursor-pointer px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-xs hover:bg-white/30 text-[10px] font-semibold flex items-center gap-1 transition-all active:scale-95 ${
                  uploadingCover ? 'opacity-50 pointer-events-none' : ''
                }`}
                title="Ganti Foto Banner Trip"
              >
                <Camera size={12} />
                <span>
                  {uploadingCover
                    ? 'Mengunggah...'
                    : jastiper.coverUrl
                      ? 'Ganti Banner'
                      : 'Upload Banner'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={onUploadCover}
                  className="hidden"
                  disabled={uploadingCover}
                />
              </label>
              <button
                onClick={onEdit}
                className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-xs flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all"
                aria-label="Edit trip"
              >
                <Edit3 size={13} />
              </button>
            </div>
          </div>

          <h2 className="font-bold text-base mt-2.5 leading-tight drop-shadow-sm">
            {jastiper.openTripTitle || `Trip Jastip ${jastiper.name}`}
          </h2>
          <div className="flex items-center gap-1.5 text-[11px] text-white/90 mt-1 drop-shadow-sm">
            <MapPin size={12} className="shrink-0 text-amber-300" />
            <span className="truncate">
              {jastiper.openTripDestination || jastiper.area || 'Belum diatur'}
            </span>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between pt-2 text-xs border-t border-white/15 mt-2">
          <div className="flex items-center gap-1 text-white/90 text-[11px]">
            <Clock size={11} className="text-amber-300" />
            <span>
              Tutup: <strong className="text-white">{jastiper.openTripClosing || '-'}</strong>
            </span>
          </div>
          <div className="text-white/90 text-[11px]">
            Kirim: <strong className="text-emerald-300">{jastiper.openTripSchedule || '-'}</strong>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface rounded-xl p-2.5 text-center border border-border/60">
          <Star size={14} className="text-amber-400 mx-auto mb-0.5" />
          <p className="font-bold text-sm text-ink">{jastiper.rating?.toFixed(1) ?? '5.0'}</p>
          <p className="text-[10px] text-ink-secondary">Rating</p>
        </div>
        <div className="bg-surface rounded-xl p-2.5 text-center border border-border/60">
          <Package size={14} className="text-primary mx-auto mb-0.5" />
          <p className="font-bold text-sm text-ink">{jastiper.totalOrders ?? 0}</p>
          <p className="text-[10px] text-ink-secondary">Total Trip</p>
        </div>
        <div className="bg-surface rounded-xl p-2.5 text-center border border-border/60">
          <ShoppingBag size={14} className="text-emerald-500 mx-auto mb-0.5" />
          <p className="font-bold text-sm text-ink">{jastiper.products?.length ?? 0}</p>
          <p className="text-[10px] text-ink-secondary">Produk</p>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  product,
  onToggle,
  onEdit,
  onDelete,
}: {
  product: JastipProduct;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`card p-3.5 border border-border/80 ${!product.published ? 'opacity-60 bg-surface/50' : 'bg-surface'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {product.images && product.images.length > 0 && (
            <img
              src={product.images[0]}
              alt={product.title}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-border/60"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold text-xs text-ink truncate">{product.title}</p>
              <span
                className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${
                  product.published
                    ? 'bg-emerald-500/15 text-emerald-700'
                    : 'bg-ink-secondary/15 text-ink-secondary'
                }`}
              >
                {product.published ? 'AKTIF' : 'NONAKTIF'}
              </span>
            </div>
            <p className="text-[11px] text-ink-secondary mt-0.5 line-clamp-2 leading-relaxed">
              {product.description || 'Tidak ada deskripsi'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-primary truncate">
                {formatRupiah(product.price)}
              </span>
              {product.category && (
                <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] font-medium text-primary whitespace-nowrap shrink-0">
                  {product.category}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggle}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover active:scale-95"
            aria-label={product.published ? 'Nonaktifkan' : 'Aktifkan'}
          >
            {product.published ? (
              <EyeOff size={14} className="text-ink-secondary" />
            ) : (
              <Eye size={14} className="text-primary" />
            )}
          </button>
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover active:scale-95"
            aria-label="Edit"
          >
            <Edit3 size={14} className="text-ink-secondary" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 active:scale-95"
            aria-label="Hapus"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Screen ──────────────────────────────────────────────────────────────

type ActiveTab = 'trip' | 'produk';

export default function JastipDashboard() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('trip');
  const [searchQ, setSearchQ] = useState('');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({
    title: '',
    description: '',
    price: '',
    category: 'Kuliner',
    images: [] as string[],
  });
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingProductImage, setUploadingProductImage] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(
    null,
  );

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch jastiper profile
  const { data: jastiperData, isLoading: loadingProfile } = useQuery({
    queryKey: ['jastiper-me'],
    queryFn: () => API.jastipProfile.me(),
    retry: false,
  });

  const jastiper: JastiperProfile | null = jastiperData?.jastiper ?? null;
  const isJastiper = jastiperData?.isJastiper === true;

  // Fetch products
  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['jastip-products-mine'],
    queryFn: () => API.jastipProfile.products.list(),
    enabled: isJastiper,
    staleTime: 30000,
  });

  const products: JastipProduct[] = productsData?.products ?? [];
  const filteredProducts = products.filter((p) => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return true;
    return `${p.title} ${p.category} ${p.description}`.toLowerCase().includes(q);
  });

  const [uploadingCover, setUploadingCover] = useState(false);

  // Upload cover banner
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const up = await API.upload(file);
      const fileUrl = up.url || up.fileUrl;
      await API.jastipProfile.update({ coverUrl: fileUrl });
      showToast('Foto banner trip berhasil diperbarui! 📸');
      qc.invalidateQueries({ queryKey: ['jastiper-me'] });
    } catch (err) {
      showToast(errMsg(err, 'Gagal mengunggah foto banner'), 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!productForm.title.trim() || !productForm.price) {
      showToast('Judul dan harga wajib diisi', 'error');
      return;
    }
    setSavingProduct(true);
    try {
      const payload = { ...productForm, price: Number(productForm.price) };
      if (editingProductId) {
        await API.jastipProfile.products.update(editingProductId, payload);
        showToast('Produk berhasil diperbarui');
      } else {
        await API.jastipProfile.products.create(payload);
        showToast('Produk berhasil ditambahkan ke katalog');
      }
      setShowProductForm(false);
      setEditingProductId(null);
      setProductForm({ title: '', description: '', price: '', category: 'Kuliner', images: [] });
      refetchProducts();
      qc.invalidateQueries({ queryKey: ['jastiper-me'] });
    } catch (e) {
      showToast(errMsg(e, 'Gagal menyimpan produk'), 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  const handleToggleProduct = async (id: string) => {
    try {
      await API.jastipProfile.products.togglePublish(id);
      refetchProducts();
      showToast('Status produk diperbarui', 'info');
    } catch (e) {
      showToast(errMsg(e, 'Gagal mengubah status'), 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Hapus produk ini dari katalog jastip?')) return;
    try {
      await API.jastipProfile.products.remove(id);
      refetchProducts();
      showToast('Produk dihapus', 'info');
    } catch (e) {
      showToast(errMsg(e, 'Gagal menghapus'), 'error');
    }
  };

  const handleEditProduct = (p: JastipProduct) => {
    setEditingProductId(p.id);
    setProductForm({
      title: p.title,
      description: p.description ?? '',
      price: String(p.price),
      category: p.category || 'Kuliner',
      images: p.images || [],
    });
    setShowProductForm(true);
  };

  const cancelProductForm = () => {
    setShowProductForm(false);
    setEditingProductId(null);
    setProductForm({ title: '', description: '', price: '', category: 'Kuliner', images: [] });
  };

  // ── Render: not yet a jastiper ──
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 px-6">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ink-secondary">Memuat profil jastiper...</p>
      </div>
    );
  }

  if (!isJastiper) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-primary px-5 pt-5 pb-8 rounded-b-[28px]">
          <h1 className="text-white font-bold text-lg">Mode Jastiper</h1>
          <p className="text-white/75 text-xs mt-0.5">Buka trip & terima titipan dari customer</p>
        </div>

        {/* Onboarding card */}
        <div className="px-5 -mt-4 space-y-4">
          <div className="card-pad space-y-4">
            <div className="text-4xl text-center">🛍️</div>
            <h2 className="font-bold text-base text-ink text-center">
              Belum Terdaftar sebagai Jastiper
            </h2>
            <p className="text-xs text-ink-secondary text-center leading-relaxed">
              Aktifkan mode Jastiper untuk membuka trip, mengelola katalog barang titipan, dan
              menerima pesanan dari customer langsung di driver app ini.
            </p>
            <div className="space-y-2.5 pt-1">
              {[
                { icon: '🗺️', text: 'Atur jadwal & destinasi trip sekali klik' },
                { icon: '📦', text: 'Buat katalog produk barang titipan' },
                { icon: '💰', text: 'Terima pembayaran aman via escrow Truzzi' },
                { icon: '⭐', text: 'Bangun reputasi & rating jastiper terpercaya' },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-2.5 bg-surface rounded-xl border border-border/60"
                >
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-xs text-ink font-medium">{item.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/jastip/register')}
              className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Daftar Jadi Jastiper Sekarang
            </button>
            <p className="text-[10px] text-ink-secondary text-center">
              Gratis • Tanpa biaya pendaftaran • Langsung bisa mulai
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Jastiper Dashboard ──
  return (
    <div className="min-h-screen bg-background pb-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-[99] px-4 py-2.5 rounded-2xl text-white text-xs font-semibold shadow-xl max-w-[320px] text-center ${
            toast.type === 'error'
              ? 'bg-red-500'
              : toast.type === 'info'
                ? 'bg-ink'
                : 'bg-emerald-600'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-primary px-5 pt-5 pb-14 rounded-b-[28px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Dashboard Jastiper</h1>
            <p className="text-white/75 text-xs mt-0.5">Halo, {jastiper?.name || user?.name} 👋</p>
          </div>
          <button
            onClick={() => navigate('/jastip/register')}
            className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 active:scale-95 transition-all"
            aria-label="Pengaturan jastiper"
          >
            <Settings2 size={18} className="text-white" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-10 space-y-4">
        {/* Trip Active Card */}
        {jastiper && (
          <TripActiveCard
            jastiper={jastiper}
            onEdit={() => navigate('/jastip/register')}
            onUploadCover={handleUploadCover}
            uploadingCover={uploadingCover}
          />
        )}

        {/* Tab Switcher */}
        <div className="bg-white border border-border/80 rounded-2xl p-1 flex gap-1 shadow-2xs">
          {(
            [
              { key: 'trip' as ActiveTab, label: '🗺️ Info Trip' },
              { key: 'produk' as ActiveTab, label: '📦 Katalog Produk' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                activeTab === t.key
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Trip Info */}
        {activeTab === 'trip' && jastiper && (
          <div className="card-pad space-y-3">
            <h3 className="font-bold text-sm text-ink">Detail Trip Saya</h3>
            <div className="space-y-2.5">
              {[
                { label: 'Judul Trip', value: jastiper.openTripTitle || '-' },
                { label: 'Destinasi', value: jastiper.openTripDestination || '-' },
                { label: 'Jadwal Kirim', value: jastiper.openTripSchedule || '-' },
                { label: 'Batas Order', value: jastiper.openTripClosing || '-' },
                { label: 'Wilayah', value: jastiper.area || '-' },
                { label: 'Kategori', value: jastiper.category || '-' },
                { label: 'Estimasi Fee', value: jastiper.feeEstimate || '-' },
                {
                  label: 'Ongkir Flat',
                  value: formatRupiah(jastiper.flatOngkir ?? 10000) + ' (Maks. 25rb)',
                },
                { label: 'Bio', value: jastiper.bio || '-' },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 border-b border-border/40 pb-2 last:border-0"
                >
                  <span className="text-[11px] text-ink-secondary w-28 shrink-0">{item.label}</span>
                  <span className="text-[11px] font-semibold text-ink flex-1 leading-snug">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/jastip/register')}
              className="w-full h-11 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Edit3 size={15} /> Edit Info Trip
            </button>
          </div>
        )}

        {/* TAB: Produk / Katalog */}
        {activeTab === 'produk' && (
          <div className="space-y-3">
            {/* Toolbar */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowProductForm(true);
                  setEditingProductId(null);
                  setProductForm({
                    title: '',
                    description: '',
                    price: '',
                    category: 'Kuliner',
                    images: [],
                  });
                }}
                className="h-10 px-4 rounded-xl bg-primary text-white font-bold text-xs shadow-sm shrink-0 flex items-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all"
              >
                <Plus size={16} /> Tambah
              </button>
              <div className="flex-1 bg-white border border-border rounded-xl flex items-center px-3 py-2 gap-2">
                <Search size={15} className="text-ink-secondary shrink-0" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="Cari produk..."
                  className="w-full bg-transparent text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ('')}>
                    <X size={13} className="text-ink-secondary" />
                  </button>
                )}
              </div>
            </div>

            {/* Product Form */}
            {showProductForm && (
              <div className="card-pad space-y-3 border border-primary/30">
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="font-bold text-xs text-ink flex items-center gap-1.5">
                    <Sparkles size={14} className="text-primary" />
                    {editingProductId ? 'Edit Produk Jastip' : 'Tambah Produk Baru'}
                  </h3>
                  <button onClick={cancelProductForm}>
                    <X size={16} className="text-ink-secondary" />
                  </button>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-secondary">
                    Nama / Judul Barang *
                  </label>
                  <input
                    value={productForm.title}
                    onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                    placeholder="Cth: Roti Unyil Venus Box Isi 10 Mix"
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-secondary">
                    Foto Produk
                  </label>
                  <div className="mt-1 flex items-center gap-3">
                    {productForm.images.length > 0 && (
                      <div className="relative w-14 h-14 rounded-xl border border-border overflow-hidden shrink-0">
                        <img
                          src={productForm.images[0]}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setProductForm({ ...productForm, images: [] })}
                          className="absolute top-0.5 right-0.5 bg-black/50 rounded-full p-0.5"
                        >
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    )}
                    <label className="w-14 h-14 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:bg-surface transition-colors shrink-0">
                      {uploadingProductImage ? (
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Plus size={16} className="text-ink-secondary mb-0.5" />
                          <span className="text-[9px] font-medium text-ink-secondary">Upload</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingProductImage(true);
                          try {
                            const up = await API.upload(file);
                            setProductForm({ ...productForm, images: [up.url] });
                          } catch {
                            showToast('Gagal mengunggah gambar', 'error');
                          } finally {
                            setUploadingProductImage(false);
                          }
                        }}
                        disabled={uploadingProductImage}
                      />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-ink-secondary">
                    Deskripsi & Varian
                  </label>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({ ...productForm, description: e.target.value })
                    }
                    placeholder="Cth: Varian jagung, keju, coklat. Fresh hari H."
                    rows={2}
                    className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-ink-secondary">
                      Harga (Rp) *
                    </label>
                    <input
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="45000"
                      type="number"
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-ink placeholder:text-ink-secondary/60 focus:outline-none focus:border-primary mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-ink-secondary">Kategori</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                      className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs text-ink focus:outline-none focus:border-primary mt-1"
                    >
                      {PRESET_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={cancelProductForm}
                    className="flex-1 h-10 rounded-xl border border-border text-ink-secondary text-xs font-semibold hover:bg-surface active:scale-95 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleSaveProduct}
                    disabled={savingProduct}
                    className="flex-1 h-10 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/90 active:scale-95 transition-all disabled:opacity-60"
                  >
                    {savingProduct ? 'Menyimpan...' : 'Simpan ke Katalog'}
                  </button>
                </div>
              </div>
            )}

            {/* Product List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xs text-ink">
                  Daftar Produk ({filteredProducts.length})
                </h3>
                <span className="text-[11px] text-ink-secondary">Aktif tampil di publik</span>
              </div>

              {loadingProducts ? (
                <div className="card p-10 text-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <p className="text-xs text-ink-secondary">Memuat katalog...</p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="card p-10 text-center space-y-2 bg-white">
                  <ShoppingBag size={36} className="text-primary/30 mx-auto" />
                  <p className="font-bold text-sm text-ink">Belum Ada Produk</p>
                  <p className="text-xs text-ink-secondary max-w-xs mx-auto">
                    Tambahkan barang titipan agar customer bisa langsung memesan lewat katalogmu.
                  </p>
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onToggle={() => handleToggleProduct(p.id)}
                    onEdit={() => handleEditProduct(p)}
                    onDelete={() => handleDeleteProduct(p.id)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* View public profile link */}
        <div className="card p-3.5 flex items-center justify-between border border-border/60 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Eye size={17} className="text-primary" />
            </div>
            <div>
              <p className="font-semibold text-xs text-ink">Lihat Tampilan Publik</p>
              <p className="text-[10px] text-ink-secondary">Tampilan yang dilihat customer</p>
            </div>
          </div>
          <ChevronRight size={16} className="text-ink-secondary" />
        </div>
      </div>
    </div>
  );
}
