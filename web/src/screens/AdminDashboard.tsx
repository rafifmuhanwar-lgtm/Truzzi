import { useState, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { API, errMsg } from '../lib/api';
import { formatRupiah } from '../lib/format';
import {
  ArrowLeft,
  ShieldCheck,
  TrendingUp,
  Wallet as WalletIcon,
  ShoppingBasket,
  Bike,
  Check,
  X,
  Upload,
  Camera as ImageIcon,
  Sparkles,
  Ticket,
  Search,
  ChevronRight,
  RefreshCw,
} from '../components/icons';

type AdminTab = 'overview' | 'orders' | 'users' | 'jastipers' | 'gigs' | 'withdrawals' | 'banners' | 'monitoring' | 'review' | 'kyc-review';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  // Form Upload Banner Promo
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerCode, setBannerCode] = useState('');
  const [bannerBadge, setBannerBadge] = useState('PROMO EKSKLUSIF');
  const [bannerImage, setBannerImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingBanner, setSubmittingBanner] = useState(false);

  // Modal KYC
  const [selectedKycJastiper, setSelectedKycJastiper] = useState<any | null>(null);

  // Queries
  const { data: statsData, refetch: refetchStats, isFetching: fetchingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => API.admin.stats(),
  });
  const stats = statsData?.stats;

  const { data: withdrawalsData, refetch: refetchWithdrawals, isFetching: fetchingWd } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: () => API.admin.withdrawals(),
  });
  const withdrawals: any[] = withdrawalsData?.withdrawals ?? [];

  const { data: promosData, refetch: refetchPromos } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: () => API.admin.promos(),
  });
  const promos: any[] = promosData?.promos ?? [];

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => API.admin.users(),
  });
  const users: any[] = usersData?.users ?? [];

  const { data: jastipersData, refetch: refetchJastipers } = useQuery({
    queryKey: ['admin-jastipers'],
    queryFn: () => API.admin.jastipers(),
  });
  const jastipers: any[] = jastipersData?.jastipers ?? [];
  const pendingKycJastipers = jastipers.filter(j => !j.kycVerified && j.kycKtpUrl);

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => API.admin.orders(),
  });
  const orders: any[] = ordersData?.orders ?? [];

  const { data: gigsData, refetch: refetchGigs } = useQuery({
    queryKey: ['admin-gigs'],
    queryFn: () => API.admin.gigs(),
  });
  const gigs: any[] = gigsData?.gigs ?? [];

  // Upload gambar banner
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await API.upload(file);
      if (res.fileUrl) {
        setBannerImage(res.fileUrl);
        enqueueSnackbar('Media promo berhasil diunggah! 🖼️', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal mengunggah media promo'), { variant: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  // Submit banner promo baru
  const handleCreateBanner = async (e: FormEvent) => {
    e.preventDefault();
    if (!bannerTitle.trim()) {
      enqueueSnackbar('Judul banner promo wajib diisi', { variant: 'warning' });
      return;
    }
    if (!bannerImage) {
      enqueueSnackbar('Silakan unggah aset gambar promo terlebih dahulu', { variant: 'warning' });
      return;
    }

    setSubmittingBanner(true);
    try {
      await API.admin.createPromo({
        title: bannerTitle.trim(),
        subtitle: bannerSubtitle.trim(),
        code: bannerCode.trim().toUpperCase() || 'TRUZZI',
        badge: bannerBadge.trim() || 'PROMO TRUZZI',
        period: 'Berlaku s.d. 31 Des 2026',
        imageUrl: bannerImage,
      });
      enqueueSnackbar('Banner promo resmi dipublikasikan ke Beranda Customer! 🎉', { variant: 'success' });
      setBannerTitle('');
      setBannerSubtitle('');
      setBannerCode('');
      setBannerImage('');
      refetchPromos();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menerbitkan banner promo'), { variant: 'error' });
    } finally {
      setSubmittingBanner(false);
    }
  };

  // Hapus banner promo
  const handleDeleteBanner = async (id: string) => {
    try {
      await API.admin.deletePromo(id);
      enqueueSnackbar('Banner promo telah dinonaktifkan', { variant: 'info' });
      refetchPromos();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus banner promo'), { variant: 'error' });
    }
  };

  // Approve Penarikan
  const handleApproveWithdrawal = async (id: string) => {
    try {
      await API.admin.approveWithdrawal(id);
      enqueueSnackbar('Penarikan saldo terverifikasi & disetujui! 💸', { variant: 'success' });
      refetchWithdrawals();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal memproses persetujuan penarikan'), { variant: 'error' });
    }
  };

  // Reject Penarikan
  const handleRejectWithdrawal = async (id: string) => {
    try {
      await API.admin.rejectWithdrawal(id);
      enqueueSnackbar('Penarikan saldo ditolak dan saldo berhasil direfund', { variant: 'info' });
      refetchWithdrawals();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menolak penarikan saldo'), { variant: 'error' });
    }
  };

  // CRUD Handler Users
  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pengguna ini dari sistem?')) return;
    try {
      await API.admin.deleteUser(id);
      enqueueSnackbar('Pengguna berhasil dihapus', { variant: 'info' });
      refetchUsers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus user'), { variant: 'error' });
    }
  };

  // CRUD Handler Mitra
  const handleDeleteJastiper = async (id: string) => {
    if (!window.confirm('Yakin ingin menonaktifkan/menghapus mitra jastiper/jastiper ini?')) return;
    try {
      await API.admin.deleteJastiper(id);
      enqueueSnackbar('Mitra jastiper/jastiper berhasil dihapus', { variant: 'info' });
      refetchJastipers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus mitra'), { variant: 'error' });
    }
  };

  const handleToggleOnline = async (id: string, currentOnline: boolean) => {
    try {
      await API.admin.updateJastiper(id, { isOnline: !currentOnline, status: !currentOnline ? 'online' : 'offline' });
      enqueueSnackbar(`Status mitra diubah menjadi ${!currentOnline ? 'Online' : 'Offline'}`, { variant: 'success' });
      refetchJastipers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal mengubah status mitra'), { variant: 'error' });
    }
  };

  const handleApproveKyc = async (id: string) => {
    try {
      await API.admin.updateJastiper(id, { kycVerified: true });
      enqueueSnackbar('Data KYC Jastiper berhasil disetujui', { variant: 'success' });
      setSelectedKycJastiper(null);
      refetchJastipers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menyetujui KYC'), { variant: 'error' });
    }
  };

  const handleRejectKyc = async (id: string) => {
    try {
      // Rejecting KYC: we set kycVerified to false and clear the KTP/Selfie URLs
      // so they can upload again.
      await API.admin.updateJastiper(id, { kycVerified: false, kycKtpUrl: null, kycSelfieUrl: null });
      enqueueSnackbar('Data KYC ditolak. Jastiper harus upload ulang.', { variant: 'info' });
      setSelectedKycJastiper(null);
      refetchJastipers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menolak KYC'), { variant: 'error' });
    }
  };

  // CRUD Handler Orders
  const handleDeleteOrder = async (id: string) => {
    if (!window.confirm('Hapus data pesanan ini secara permanen?')) return;
    try {
      await API.admin.deleteOrder(id);
      enqueueSnackbar('Pesanan berhasil dihapus', { variant: 'info' });
      refetchOrders();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus pesanan'), { variant: 'error' });
    }
  };

  const handleUpdateOrderStatus = async (id: string, newStatus: string) => {
    try {
      await API.admin.updateOrder(id, { status: newStatus, statusText: `Diperbarui Admin: ${newStatus}` });
      enqueueSnackbar(`Status pesanan diubah ke "${newStatus}"`, { variant: 'success' });
      refetchOrders();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal memperbarui pesanan'), { variant: 'error' });
    }
  };

  // CRUD Handler Gigs
  const handleDeleteGig = async (id: string) => {
    if (!window.confirm('Hapus tugas Cari Cuan ini?')) return;
    try {
      await API.admin.deleteGig(id);
      enqueueSnackbar('Tugas Cari Cuan berhasil dihapus', { variant: 'info' });
      refetchGigs();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus tugas'), { variant: 'error' });
    }
  };

  // Filter Penarikan
  const filteredWithdrawals = withdrawals.filter((w) => {
    const matchSearch =
      (w.bankName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.accountNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.userId ?? w.jastiperId ?? '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'pending').length;

  const refreshAll = () => {
    refetchStats();
    refetchWithdrawals();
    refetchPromos();
    refetchUsers();
    refetchJastipers();
    refetchOrders();
    refetchGigs();
    enqueueSnackbar('Semua data berhasil disinkronkan', { variant: 'info' });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans antialiased selection:bg-primary/30 selection:text-white">
      {/* ── Top Bar Header Dashboard ── */}
      <header className="bg-[#1E293B]/90 backdrop-blur-xl border-b border-slate-800/80 px-6 h-16 sticky top-0 z-40 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all border border-slate-700/50"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-[#A82B50] flex items-center justify-center font-black text-white text-sm shadow-md shadow-primary/20">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-sm tracking-tight text-white font-sans">Truzzi Control Tower</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> OPERATIONAL LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Management & Real-time Operations Console</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            disabled={fetchingStats || fetchingWd}
            className="h-9 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary-light ${fetchingStats || fetchingWd ? 'animate-spin' : ''}`} />
            <span>Sinkronisasi Data</span>
          </button>
        </div>
      </header>

      {/* ── Sub Navigation Tabs ── */}
      <div className="bg-[#1E293B]/40 border-b border-slate-800/80 px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-primary-light" /> Ringkasan
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShoppingBasket className="w-4 h-4 text-emerald-400" /> Kelola Pesanan ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('jastipers')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'jastipers'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Bike className="w-4 h-4 text-purple-400" /> Mitra Jastiper/Jastiper ({jastipers.length})
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'users'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-blue-400" /> Data Customer ({users.length})
          </button>

          <button
            onClick={() => setActiveTab('gigs')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'gigs'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" /> Cari Cuan ({gigs.length})
          </button>

          <button
            onClick={() => setActiveTab('banners')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-amber-400" /> Banner ({promos.length})
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'withdrawals'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <WalletIcon className="w-4 h-4 text-emerald-400" /> Penarikan ({pendingCount})
          </button>

          <button
            onClick={() => setActiveTab('review')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'review'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-red-400" /> Sengketa ({orders.filter((o: any) => o.needsAdminReview && !o.adminReviewed).length})
          </button>

          <button
            onClick={() => setActiveTab('kyc-review')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'kyc-review'
                ? 'border-primary text-white bg-primary/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" /> Verifikasi KYC ({pendingKycJastipers.length})
          </button>
        </div>
      </div>

      {/* ── Main Workspace Body ── */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ──────────────── TAB 1: OVERVIEW METRICS ──────────────── */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards (Enterprise Layout) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1 */}
              <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold tracking-wide uppercase">Volume GMV Platform</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white tracking-tight">{formatRupiah(stats?.totalGMV ?? 0)}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Gross Merchandise Volume</span>
                  <span className="text-emerald-400 font-bold">100% Real-time</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold tracking-wide uppercase">Saldo Escrow Terkunci</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-amber-400 tracking-tight">{formatRupiah(stats?.totalEscrowLocked ?? 0)}</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Dana Terikat Order Aktif</span>
                  <span className="text-amber-400 font-bold">Aman di Escrow</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold tracking-wide uppercase">Pesanan Sukses</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <ShoppingBasket className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white tracking-tight">{stats?.completedOrdersCount ?? 0} Transaksi</p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Jastip & Suruh Jastiper</span>
                  <span className="text-blue-400 font-bold">Terselesaikan</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-lg">
                <div className="flex items-center justify-between text-slate-400 mb-3">
                  <span className="text-xs font-bold tracking-wide uppercase">Driver Siaga Lapangan</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <Bike className="w-4 h-4" />
                  </div>
                </div>
                <p className="text-2xl font-black text-white tracking-tight">
                  {stats?.activeJastipersCount ?? 0} <span className="text-xs font-semibold text-slate-400">/ {stats?.totalJastipersCount ?? 0} Mitras</span>
                </p>
                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Status Jastiper Aktif</span>
                  <span className="text-purple-400 font-bold">Online</span>
                </div>
              </div>
            </div>

            {/* Dashboard Insights Box */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#1E293B]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-white">Status Operasional & Tugas Cari Cuan</h3>
                    <p className="text-xs text-slate-400">Pengawasan layanan antar customer dan tugas antar customer (Cari Cuan).</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary-light text-xs font-bold border border-primary/20">
                    Truzzi Ecosystem
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[11px] font-medium block">Tugas Cari Cuan:</span>
                    <p className="text-lg font-black text-white">{stats?.totalGigsCount ?? 0}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold">Tugas Dipublikasikan</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[11px] font-medium block">Total Customer:</span>
                    <p className="text-lg font-black text-white">{stats?.totalUsersCount ?? 0}</p>
                    <span className="text-[10px] text-blue-400 font-semibold">Akun Terverifikasi</span>
                  </div>
                  <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800/80 space-y-1">
                    <span className="text-slate-400 text-[11px] font-medium block">Antrean Penarikan:</span>
                    <p className="text-lg font-black text-amber-400">{pendingCount}</p>
                    <span className="text-[10px] text-amber-400/90 font-semibold">Perlu Tindakan Admin</span>
                  </div>
                </div>
              </div>

              <div className="bg-[#1E293B]/60 border border-slate-800 rounded-2xl p-6 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" /> Aksi Cepat Control Center
                </h3>
                <div className="space-y-2.5">
                  <button
                    onClick={() => setActiveTab('banners')}
                    className="w-full p-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-primary-light transition-colors">🖼️ Upload Banner Beranda</p>
                      <p className="text-[11px] text-slate-400">Tambahkan promo terbaru untuk customer</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>

                  <button
                    onClick={() => setActiveTab('withdrawals')}
                    className="w-full p-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">💸 Verifikasi Penarikan Saldo</p>
                      <p className="text-[11px] text-slate-400">Proses pencairan dana bank & e-wallet</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────── TAB: KELOLA PESANAN (ORDERS) ──────────────── */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">Kelola & Pantau Semua Pesanan ({orders.length})</h2>
                <p className="text-[11px] text-slate-400">Ubah status alur pengiriman atau hapus data pesanan.</p>
              </div>
            </div>

            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {orders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">Belum ada data pesanan</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A]/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3.5">ID & Layanan</th>
                        <th className="p-3.5">Judul & Rincian</th>
                        <th className="p-3.5">Total Tagihan</th>
                        <th className="p-3.5">Status Saat Ini</th>
                        <th className="p-3.5 text-right">Ubah Status / Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {orders.map((o) => (
                        <tr key={o.id || o.$id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <span className="text-slate-300 font-mono text-[11px] block">{o.id || o.$id}</span>
                            <span className="text-[10px] font-bold text-primary-light uppercase">{o.serviceName || o.orderType}</span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="font-bold text-white text-xs truncate">{o.title}</p>
                            <p className="text-slate-400 text-[11px] truncate">{o.deliveryAddress || '-'}</p>
                          </td>
                          <td className="p-3.5 font-extrabold text-emerald-400">
                            {formatRupiah(o.totalAmount || o.totalPrice || 0)}
                          </td>
                          <td className="p-3.5">
                            <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              o.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : o.status === 'cancelled'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {o.status?.toUpperCase() || 'ONGOING'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="inline-flex items-center gap-2 justify-end">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id || o.$id, e.target.value)}
                                className="h-7 px-2 rounded-lg bg-[#0F172A] border border-slate-700 text-[11px] text-slate-200 focus:outline-none"
                              >
                                <option value="ongoing">Ongoing</option>
                                <option value="completed">Selesai (Completed)</option>
                                <option value="cancelled">Dibatalkan (Cancelled)</option>
                              </select>
                              <button
                                onClick={() => handleDeleteOrder(o.id || o.$id)}
                                className="h-7 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] transition-colors"
                              >
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── TAB: MITRA JASTIPER & KURIR ──────────────── */}
        {activeTab === 'jastipers' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">Mitra Jastiper & Driver Lapangan ({jastipers.length})</h2>
                <p className="text-[11px] text-slate-400">Kelola status online/offline mitra, rating, dan verifikasi akun.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {jastipers.map((c) => (
                <div key={c.id || c.$id} className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg">
                  <div className="flex items-center gap-3">
                    {c.photoUrl ? (
                      <img src={c.photoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary-light">
                        {c.name?.slice(0, 2).toUpperCase() || 'JS'}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-xs text-white truncate">{c.name}</h4>
                      <p className="text-[11px] text-slate-400 truncate">{c.area || 'Wilayah Terdaftar'}</p>
                      <span className="text-[10px] text-emerald-400 font-semibold">{c.phone || '-'}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#0F172A] flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Status Akun:</span>
                    <span className={`font-bold ${c.isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {c.isOnline ? '🟢 ONLINE' : '⚪ OFFLINE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleToggleOnline(c.id || c.$id, !!c.isOnline)}
                      className="flex-1 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-slate-200 transition-colors"
                    >
                      {c.isOnline ? 'Set Offline' : 'Set Online'}
                    </button>
                    <button
                      onClick={() => handleDeleteJastiper(c.id || c.$id)}
                      className="h-8 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────── TAB: DATA CUSTOMER (USERS) ──────────────── */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">Data Pengguna Terdaftar ({users.length})</h2>
                <p className="text-[11px] text-slate-400">Daftar customer aktif di aplikasi Truzzi.</p>
              </div>
            </div>

            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {users.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">Belum ada customer terdaftar</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A]/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3.5">Nama & Kontak</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">ID User</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {users.map((u) => (
                        <tr key={u.id || u.$id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <p className="font-bold text-white text-xs">{u.name}</p>
                            <p className="text-slate-400 text-[11px] mt-0.5">{u.phone || '-'}</p>
                          </td>
                          <td className="p-3.5 text-slate-300 text-xs">{u.email}</td>
                          <td className="p-3.5 text-slate-400 font-mono text-[11px]">{u.id || u.$id}</td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleDeleteUser(u.id || u.$id)}
                              className="h-7 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-bold text-[11px] transition-colors"
                            >
                              Hapus User
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── TAB: CARI CUAN (GIGS) ──────────────── */}
        {activeTab === 'gigs' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">Tugas Komunitas Cari Cuan ({gigs.length})</h2>
                <p className="text-[11px] text-slate-400">Moderasi tugas & pekerjaan freelance yang diposting sesama pengguna.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {gigs.map((g) => (
                <div key={g.id || g.$id} className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-4 space-y-3 relative overflow-hidden shadow-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      {g.category || 'Tugas Umum'}
                    </span>
                    <span className="text-xs font-black text-emerald-400">{formatRupiah(g.reward || g.price || 0)}</span>
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{g.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{g.description}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">Status: {g.status || 'open'}</span>
                    <button
                      onClick={() => handleDeleteGig(g.id || g.$id)}
                      className="h-7 px-2.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-[11px] font-bold transition-colors"
                    >
                      Hapus Tugas
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ──────────────── TAB 2: KELOLA BANNER BERANDA CUSTOMER ──────────────── */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Form Upload Left Column */}
              <div className="lg:col-span-1 bg-[#1E293B]/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
                <div className="border-b border-slate-800 pb-3">
                  <h2 className="font-bold text-sm text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-primary-light" /> Upload Banner Promo Baru
                  </h2>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Banner yang dipublikasikan di sini akan tampil di Carousel halaman Beranda Customer (`HomeScreen.tsx`).
                  </p>
                </div>

                <form onSubmit={handleCreateBanner} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Judul Banner Promo</label>
                    <input
                      type="text"
                      value={bannerTitle}
                      onChange={(e) => setBannerTitle(e.target.value)}
                      placeholder="Contoh: Diskon Ongkir Merdeka 50%"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#0F172A] border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Subtitle / Keterangan Singkat</label>
                    <input
                      type="text"
                      value={bannerSubtitle}
                      onChange={(e) => setBannerSubtitle(e.target.value)}
                      placeholder="Contoh: Berlaku khusus layanan Titip Belanja"
                      className="w-full h-10 px-3.5 rounded-xl bg-[#0F172A] border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">Kode Voucher</label>
                      <input
                        type="text"
                        value={bannerCode}
                        onChange={(e) => setBannerCode(e.target.value)}
                        placeholder="MERDEKA50"
                        className="w-full h-10 px-3 rounded-xl bg-[#0F172A] border border-slate-700/80 text-xs font-mono font-bold text-amber-400 placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all uppercase"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-300 mb-1.5 block">Badge Label</label>
                      <input
                        type="text"
                        value={bannerBadge}
                        onChange={(e) => setBannerBadge(e.target.value)}
                        placeholder="PROMO EKSKLUSIF"
                        className="w-full h-10 px-3 rounded-xl bg-[#0F172A] border border-slate-700/80 text-xs font-semibold text-white placeholder:text-slate-500 focus:outline-none focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Upload Image Slot */}
                  <div>
                    <label className="text-xs font-bold text-slate-300 mb-1.5 block">Aset Gambar Promo</label>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                    {bannerImage ? (
                      <div className="relative rounded-xl overflow-hidden border border-primary/50 bg-[#0F172A] h-36 group">
                        <img src={bannerImage} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 text-white text-[11px] font-bold hover:bg-slate-700"
                          >
                            Ganti
                          </button>
                          <button
                            type="button"
                            onClick={() => setBannerImage('')}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-[11px] font-bold hover:bg-rose-700"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                        className="w-full h-32 rounded-xl border border-dashed border-slate-700 hover:border-primary bg-[#0F172A]/60 flex flex-col items-center justify-center gap-1.5 text-slate-400 hover:text-white transition-all"
                      >
                        {uploadingImage ? (
                          <span className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-primary-light" />
                            <span className="text-xs font-semibold">Unggah Gambar Promo</span>
                            <span className="text-[10px] text-slate-500">Rasio 16:9 disarankan</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={submittingBanner || !bannerImage}
                    className="w-full h-10 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    {submittingBanner && <span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" />}
                    {submittingBanner ? 'Menerbitkan...' : '🚀 Terbitkan ke Beranda Customer'}
                  </button>
                </form>
              </div>

              {/* List Active Banners Right Column */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-amber-400" /> Daftar Banner Promo Dipublikasikan ({promos.length})
                  </h3>
                </div>

                {promos.length === 0 ? (
                  <div className="p-12 rounded-2xl border border-slate-800 bg-[#1E293B]/40 text-center space-y-1.5">
                    <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-300">Belum ada banner promo custom yang aktif</p>
                    <p className="text-[11px] text-slate-500">Gunakan form di sebelah kiri untuk mengunggah dan menerbitkan banner promo baru.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {promos.map((p) => (
                      <div key={p.id} className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-4 flex gap-3.5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-md">
                        {p.imageUrl && (
                          <img src={p.imageUrl} alt={p.title} className="w-20 h-20 rounded-xl object-cover shrink-0 border border-slate-700/50" />
                        )}
                        <div className="flex-1 space-y-1 min-w-0">
                          <span className="text-[9px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full inline-block border border-amber-400/20">
                            {p.badge}
                          </span>
                          <h4 className="font-bold text-xs text-white truncate">{p.title}</h4>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{p.subtitle}</p>
                          <p className="text-[10px] font-mono font-extrabold text-emerald-400">Kode: {p.code}</p>
                          <button
                            onClick={() => handleDeleteBanner(p.id)}
                            className="pt-1 text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                          >
                            <X className="w-3 h-3" /> Hapus Banner Ini
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ──────────────── TAB 3: MANAJEMEN PENARIKAN SALDO ──────────────── */}
        {activeTab === 'withdrawals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#1E293B]/60 p-4 rounded-2xl border border-slate-800">
              <div>
                <h2 className="font-bold text-sm text-white">Antrean &amp; Verifikasi Penarikan Saldo</h2>
                <p className="text-[11px] text-slate-400">Konfirmasi pencairan dana ke Bank (Gratis Admin) &amp; E-Wallet (Admin Rp 2.500).</p>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Cari bank / akun..."
                    className="w-full h-8 pl-8 pr-3 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-primary"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="h-8 px-2.5 rounded-lg bg-[#0F172A] border border-slate-700/80 text-[11px] font-semibold text-slate-300 focus:outline-none focus:border-primary"
                >
                  <option value="all">Semua Status</option>
                  <option value="pending">Pending (Perlu Verifikasi)</option>
                  <option value="completed">Sudah Ditransfer</option>
                  <option value="rejected">Ditolak</option>
                </select>
              </div>
            </div>

            {/* Table Layout */}
            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {filteredWithdrawals.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  Tidak ada data penarikan saldo yang sesuai filter
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A]/80 border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                        <th className="p-3.5">Metode &amp; Akun Tujuan</th>
                        <th className="p-3.5">ID Akun</th>
                        <th className="p-3.5">Waktu Pengajuan</th>
                        <th className="p-3.5">Nominal Penarikan</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Tindakan Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-medium">
                      {filteredWithdrawals.map((w) => (
                        <tr key={w.id || w.$id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5">
                            <p className="font-bold text-white text-sm">{w.bankName?.toUpperCase()}</p>
                            <p className="text-slate-400 font-mono text-[11px] mt-0.5">{w.accountNumber}</p>
                          </td>
                          <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                            {w.jastiperId || w.userId || 'User'}
                          </td>
                          <td className="p-3.5 text-slate-400 text-[11px]">
                            {new Date(w.createdAt || Date.now()).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="p-3.5 font-extrabold text-amber-400 text-sm">
                            {formatRupiah(w.amount)}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                                w.status === 'completed'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : w.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {w.status === 'completed' ? 'SUDAH DITRANSFER' : w.status === 'rejected' ? 'DITOLAK' : 'MENUNGGU APPROVAL'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {w.status === 'pending' ? (
                              <div className="inline-flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleApproveWithdrawal(w.id || w.$id)}
                                  className="h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <Check className="w-3 h-3" /> Setujui
                                </button>
                                <button
                                  onClick={() => handleRejectWithdrawal(w.id || w.$id)}
                                  className="h-7 px-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-sm transition-all"
                                >
                                  <X className="w-3 h-3" /> Tolak
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-[11px]">Selesai</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ──────────────── TAB 4: SAFETY & MONITORING ──────────────── */}
        {activeTab === 'monitoring' && (
          <div className="space-y-4">
            <div className="bg-[#1E293B]/80 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl">
              <div>
                <h2 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" /> Platform Escrow & Safety Architecture
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Truzzi menjamin keamanan transaksi 100% untuk Customer dan Jastiper/Pengerja melalui enkripsi & proteksi escrow.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-amber-400 block">🔒 Escrow Payment Locking</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Dana pembayaran tertahan di rekening escrow platform dan baru diteruskan setelah konfirmasi penerimaan pekerjaan.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-blue-400">💬 Communication Safety Audit</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Ruang obrolan terpantau untuk memastikan tidak terjadi transaksi ilegal atau pelecehan antar pengguna.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0F172A] border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-purple-400">📑 Fraud Prevention & Proof Verification</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Setiap pengerjaan tugas & pengantaran barang wajib melampirkan foto bukti fisik untuk validasi admin.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ──────────────── TAB: REVIEW PESANAN NOMINAL TINGGI ──────────────── */}
        {activeTab === 'review' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-red-400" /> Review Pesanan Nominal Tinggi (≥ Rp1.000.000)
              </h2>
              <button onClick={() => refetchOrders()} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {orders.filter((o: any) => o.needsAdminReview).length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">Tidak ada pesanan yang memerlukan review</div>
            ) : (
              <div className="space-y-3">
                {orders.filter((o: any) => o.needsAdminReview).map((o: any) => (
                  <div key={o.id} className={`p-4 rounded-xl border space-y-3 ${
                    o.adminReviewed
                      ? 'bg-[#0F172A]/60 border-emerald-800/30'
                      : 'bg-[#1E293B] border-red-800/40'
                  }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{o.title || o.serviceName}</p>
                        <p className="text-[11px] text-slate-400">ID: {o.id}</p>
                        <p className="text-[11px] text-slate-400">Customer: {o.userName || o.userId}</p>
                        <p className="text-[11px] text-slate-400">Jastiper: {o.jastiperName || o.jastiperId || '-'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-amber-400">{formatRupiah(o.totalAmount ?? 0)}</p>
                        <p className={`text-[10px] font-semibold mt-0.5 ${
                          o.status === 'completed' ? 'text-emerald-400' :
                          o.status === 'waiting_confirmation' ? 'text-amber-400' :
                          'text-slate-400'
                        }`}>
                          {o.statusText || o.status}
                        </p>
                      </div>
                    </div>

                    {/* Proof images */}
                    <div className="flex gap-2 flex-wrap">
                      {o.strukImageUrl && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500">Struk</p>
                          <img src={o.strukImageUrl} alt="struk" className="w-24 h-24 object-cover rounded-lg border border-slate-700 cursor-pointer" onClick={() => window.open(o.strukImageUrl, '_blank')} />
                        </div>
                      )}
                      {o.deliveryProofUrl && (
                        <div className="space-y-1">
                          <p className="text-[10px] text-slate-500">Bukti Kirim</p>
                          <img src={o.deliveryProofUrl} alt="bukti" className="w-24 h-24 object-cover rounded-lg border border-slate-700 cursor-pointer" onClick={() => window.open(o.deliveryProofUrl, '_blank')} />
                        </div>
                      )}
                    </div>

                    {/* Review info */}
                    {o.reviewRating && (
                      <div className="text-[11px] text-slate-400">
                        Rating: {'⭐'.repeat(o.reviewRating)} | Ulasan: {o.reviewText || '-'}
                      </div>
                    )}

                    {/* Admin action */}
                    <div className="flex items-center gap-2 pt-1">
                      {o.adminReviewed ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <Check className="w-4 h-4" /> Sudah Direview
                        </span>
                      ) : (
                        <button
                          onClick={async () => {
                            try {
                              await API.admin.updateOrder(o.id, { adminReviewed: true });
                              enqueueSnackbar('Pesanan ditandai sudah direview', { variant: 'success' });
                              refetchOrders();
                            } catch (err) {
                              enqueueSnackbar(errMsg(err, 'Gagal'), { variant: 'error' });
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Tandai Sudah Direview
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ──────────────── TAB KYC REVIEW ──────────────── */}
        {activeTab === 'kyc-review' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" /> Persetujuan Identitas (KYC)
                </h2>
                <p className="text-sm text-slate-400 mt-1">Review foto KTP dan wajah pendaftar Jastiper baru.</p>
              </div>
            </div>

            <div className="bg-[#1E293B]/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              {pendingKycJastipers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-white font-bold mb-1">Semua Selesai!</h3>
                  <p className="text-slate-400 text-sm">Tidak ada Jastiper yang menunggu verifikasi saat ini.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingKycJastipers.map(j => (
                    <div key={j.id || j.$id} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 flex flex-col">
                      <div className="flex items-center gap-3 mb-4">
                        <img 
                          src={j.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(j.name)}&background=random`} 
                          alt={j.name} 
                          className="w-10 h-10 rounded-full object-cover border border-slate-600"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{j.name}</p>
                          <p className="text-xs text-slate-400">{j.email}</p>
                        </div>
                      </div>
                      
                      <div className="mt-auto space-y-3">
                        <div className="flex items-center justify-between text-xs border-t border-slate-700/50 pt-3">
                          <span className="text-slate-400">Status</span>
                          <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-400/10 rounded-full">Pending</span>
                        </div>
                        <button
                          onClick={() => setSelectedKycJastiper(j)}
                          className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-sm rounded-lg border border-indigo-500/20 transition-all"
                        >
                          Tinjau Dokumen
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ──────────────── MODAL VERIFIKASI KYC ──────────────── */}
      {selectedKycJastiper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#1E293B] border border-slate-700 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-[#0F172A]">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-400" /> Verifikasi KYC: {selectedKycJastiper.name}
              </h3>
              <button 
                onClick={() => setSelectedKycJastiper(null)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KTP */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">Foto KTP</h4>
                  <div className="aspect-[16/10] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative group">
                    <img 
                      src={selectedKycJastiper.kycKtpUrl} 
                      alt="KTP" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={selectedKycJastiper.kycKtpUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 rounded-lg text-white text-xs font-bold">Perbesar</a>
                    </div>
                  </div>
                </div>
                
                {/* Selfie */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">Foto Selfie (Wajah)</h4>
                  <div className="aspect-[16/10] bg-slate-900 rounded-xl border border-slate-700 overflow-hidden relative group">
                    <img 
                      src={selectedKycJastiper.kycSelfieUrl} 
                      alt="Selfie" 
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a href={selectedKycJastiper.kycSelfieUrl} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-800 rounded-lg text-white text-xs font-bold">Perbesar</a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Panduan Verifikasi Admin</h4>
                <ul className="text-xs text-slate-300 space-y-1 list-disc pl-4">
                  <li>Pastikan wajah di KTP sama persis dengan foto Selfie.</li>
                  <li>Pastikan tulisan di KTP (NIK, Nama, dll) dapat terbaca dengan jelas.</li>
                  <li>Pastikan foto KTP bukan hasil rekayasa/ediatan komputer.</li>
                </ul>
              </div>
            </div>

            <div className="p-4 border-t border-slate-700 bg-[#0F172A] flex justify-end gap-3">
              <button 
                onClick={() => handleRejectKyc(selectedKycJastiper.id || selectedKycJastiper.$id)}
                className="px-6 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold text-sm border border-rose-500/20 transition-all"
              >
                Tolak & Minta Foto Ulang
              </button>
              <button 
                onClick={() => handleApproveKyc(selectedKycJastiper.id || selectedKycJastiper.$id)}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
              >
                Setujui Jastiper
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

