import React, { useState, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSnackbar } from 'notistack';
import { AdminAPI, errMsg, formatRupiah } from './lib/api';
import {
  LayoutDashboard,
  Ticket,
  ArrowDownToLine,
  Users,
  ShoppingBag,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  Star,
  Clock,
  TrendingUp,
  Edit,
  Search,
  ShieldCheck,
  Lock,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

type Tab =
  | 'overview'
  | 'promos'
  | 'withdrawals'
  | 'orders'
  | 'jastipers'
  | 'customers'
  | 'admins'
  | 'kyc-review';

export default function AdminApp() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    !!localStorage.getItem('sg_admin_token'),
  );
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [activeWithdrawalTab, setActiveWithdrawalTab] = useState<'mitra' | 'customer'>('mitra');
  const { enqueueSnackbar } = useSnackbar();

  // Queries
  const { data: statsData, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: AdminAPI.stats,
    enabled: isAuthenticated,
  });
  const stats = statsData?.stats;

  const { data: promosData, refetch: refetchPromos } = useQuery({
    queryKey: ['admin-promos'],
    queryFn: AdminAPI.promos,
    enabled: isAuthenticated,
  });
  const promos: any[] = promosData?.promos ?? [];

  const { data: wdData, refetch: refetchWd } = useQuery({
    queryKey: ['admin-withdrawals'],
    queryFn: AdminAPI.withdrawals,
    enabled: isAuthenticated,
  });
  const withdrawals: any[] = wdData?.withdrawals ?? [];
  const mitraWithdrawals = withdrawals.filter((w) => w.userRole !== 'customer');
  const customerWithdrawals = withdrawals.filter((w) => w.userRole === 'customer');

  const { data: ordersData, refetch: refetchOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: AdminAPI.orders,
    enabled: isAuthenticated,
  });
  const orders: any[] = useMemo(() => ordersData?.orders ?? [], [ordersData?.orders]);

  const { data: jastipersData, refetch: refetchJastipers } = useQuery({
    queryKey: ['admin-jastipers'],
    queryFn: AdminAPI.jastipers,
    enabled: isAuthenticated,
  });
  const jastipers: any[] = jastipersData?.jastipers || jastipersData?.jastipers || [];
  const pendingKycJastipers = jastipers.filter((j) => !j.kycVerified && j.kycKtpUrl);

  const { data: usersData, refetch: refetchUsers } = useQuery({
    queryKey: ['admin-users'],
    queryFn: AdminAPI.users,
    enabled: isAuthenticated,
  });
  const usersList: any[] = usersData?.users || [];
  const customers = usersList.filter((u: any) => u.role === 'customer');

  const [searchJastiper, setSearchJastiper] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');

  const filteredJastipers = jastipers.filter(
    (j) =>
      (j.name || '').toLowerCase().includes(searchJastiper.toLowerCase()) ||
      (j.email || '').toLowerCase().includes(searchJastiper.toLowerCase()) ||
      (j.phone || '').includes(searchJastiper),
  );

  const filteredCustomers = customers.filter(
    (c) =>
      (c.name || '').toLowerCase().includes(searchCustomer.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(searchCustomer.toLowerCase()) ||
      (c.phone || '').includes(searchCustomer),
  );

  // Promo Form State
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoTitle, setPromoTitle] = useState('');
  const [promoSubtitle, setPromoSubtitle] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState('');
  const [promoMinSpend, setPromoMinSpend] = useState('');
  const [promoImageUrl, setPromoImageUrl] = useState('');

  // Advanced fields
  const [promoType, setPromoType] = useState('discount'); // discount, cashback, gratis_ongkir
  const [promoCategory, setPromoCategory] = useState('all'); // all, jastip, suruh
  const [promoDiscountPercent, setPromoDiscountPercent] = useState('');
  const [promoDiscountFlat, setPromoDiscountFlat] = useState('');
  const [promoMaxDiscount, setPromoMaxDiscount] = useState('');
  const [promoQuota, setPromoQuota] = useState('');
  const [promoBudgetMax, setPromoBudgetMax] = useState('');
  const [promoStartDate, setPromoStartDate] = useState('');
  const [promoEndDate, setPromoEndDate] = useState('');

  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingPromo, setSubmittingPromo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await AdminAPI.upload(file);
      if (res.url) {
        setPromoImageUrl(res.url);
        enqueueSnackbar('Gambar banner berhasil diupload!', { variant: 'success' });
      }
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal upload gambar'), { variant: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreatePromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoCode || !promoTitle) {
      enqueueSnackbar('Kode promo dan judul wajib diisi!', { variant: 'warning' });
      return;
    }
    setSubmittingPromo(true);
    try {
      await AdminAPI.createPromo({
        code: promoCode.toUpperCase(),
        title: promoTitle,
        subtitle: promoSubtitle,
        discountText: promoDiscount,
        imageUrl: promoImageUrl,
        type: promoType,
        category: promoCategory,
        minTransaction: promoMinSpend,
        discountPercent: promoDiscountPercent,
        discountFlat: promoDiscountFlat,
        maxDiscount: promoMaxDiscount,
        quota: promoQuota,
        budgetMax: promoBudgetMax,
        startDate: promoStartDate ? new Date(promoStartDate).toISOString() : undefined,
        endDate: promoEndDate ? new Date(promoEndDate).toISOString() : undefined,
      });
      enqueueSnackbar('Promo berhasil ditambahkan ke aplikasi customer!', { variant: 'success' });
      setShowPromoModal(false);
      setPromoCode('');
      setPromoTitle('');
      setPromoSubtitle('');
      setPromoDiscount('');
      setPromoMinSpend('');
      setPromoImageUrl('');
      setPromoType('discount');
      setPromoCategory('all');
      setPromoDiscountPercent('');
      setPromoDiscountFlat('');
      setPromoMaxDiscount('');
      setPromoQuota('');
      setPromoBudgetMax('');
      setPromoStartDate('');
      setPromoEndDate('');
      refetchPromos();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal membuat promo'), { variant: 'error' });
    } finally {
      setSubmittingPromo(false);
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus banner/promo ini?')) return;
    try {
      await AdminAPI.deletePromo(id);
      enqueueSnackbar('Promo berhasil dihapus!', { variant: 'info' });
      refetchPromos();
    } catch (err: any) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus promo'), { variant: 'error' });
    }
  };

  const handleApproveWd = async (id: string) => {
    if (!window.confirm('Setujui dan proses pencairan dana ini?')) return;
    try {
      await AdminAPI.approveWithdrawal(id);
      enqueueSnackbar('Penarikan dana disetujui!', { variant: 'success' });
      refetchWd();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menyetujui penarikan'), { variant: 'error' });
    }
  };

  const handleRejectWd = async (id: string) => {
    if (!window.confirm('Tolak permintaan penarikan ini?')) return;
    try {
      await AdminAPI.rejectWithdrawal(id);
      enqueueSnackbar('Penarikan dana ditolak!', { variant: 'info' });
      refetchWd();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menolak penarikan'), { variant: 'error' });
    }
  };

  const handleDeleteWd = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus data penarikan ini selamanya?')) return;
    try {
      await AdminAPI.deleteWithdrawal(id);
      enqueueSnackbar('Data penarikan dihapus!', { variant: 'info' });
      refetchWd();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus penarikan'), { variant: 'error' });
    }
  };

  // Jastiper Form State
  const [showEditJastiperModal, setShowEditJastiperModal] = useState(false);
  const [editingJastiperId, setEditingJastiperId] = useState('');
  const [jastiperName, setJastiperName] = useState('');
  const [jastiperPhone, setJastiperPhone] = useState('');
  const [jastiperIsActive, setJastiperIsActive] = useState(true);
  const [jastiperKycVerified, setJastiperKycVerified] = useState(false);
  const [submittingJastiper, setSubmittingJastiper] = useState(false);

  // KYC Modal State
  const [selectedKycJastiper, setSelectedKycJastiper] = useState<any | null>(null);

  const handleApproveKyc = async (id: string) => {
    try {
      await AdminAPI.updateJastiper(id, { kycVerified: true });
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
      await AdminAPI.updateJastiper(id, {
        kycVerified: false,
        kycKtpUrl: null,
        kycSelfieUrl: null,
      });
      enqueueSnackbar('Data KYC ditolak. Jastiper harus upload ulang.', { variant: 'info' });
      setSelectedKycJastiper(null);
      refetchJastipers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menolak KYC'), { variant: 'error' });
    }
  };

  const handleEditJastiperClick = (jastiper: any) => {
    setEditingJastiperId(jastiper.id);
    setJastiperName(jastiper.name || '');
    setJastiperPhone(jastiper.phone || '');
    setJastiperIsActive(jastiper.isActive ?? true);
    setJastiperKycVerified(jastiper.kycVerified ?? false);
    setShowEditJastiperModal(true);
  };

  const handleUpdateJastiper = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJastiper(true);
    try {
      await AdminAPI.updateJastiper(editingJastiperId, {
        name: jastiperName,
        phone: jastiperPhone,
        isActive: jastiperIsActive,
        kycVerified: jastiperKycVerified,
      });
      enqueueSnackbar('Data Jastiper berhasil diperbarui!', { variant: 'success' });
      setShowEditJastiperModal(false);
      refetchJastipers();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal mengupdate Jastiper'), { variant: 'error' });
    } finally {
      setSubmittingJastiper(false);
    }
  };

  const handleDeleteJastiper = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus jastiper ini secara permanen?')) return;
    try {
      await AdminAPI.deleteJastiper(id);
      enqueueSnackbar('Jastiper berhasil dihapus!', { variant: 'info' });
      refetchJastipers();
      refetchStats();
    } catch (err: any) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus Jastiper'), { variant: 'error' });
    }
  };

  // Customer Form State
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [submittingCustomer, setSubmittingCustomer] = useState(false);

  const handleEditCustomerClick = (customer: any) => {
    setEditingCustomerId(customer.id);
    setCustomerName(customer.name || '');
    setCustomerPhone(customer.phone || '');
    setShowEditCustomerModal(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCustomer(true);
    try {
      await AdminAPI.updateUser(editingCustomerId, {
        name: customerName,
        phone: customerPhone,
      });
      enqueueSnackbar('Data pelanggan berhasil diperbarui!', { variant: 'success' });
      setShowEditCustomerModal(false);
      refetchUsers();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal mengupdate pelanggan'), { variant: 'error' });
    } finally {
      setSubmittingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus pelanggan ini secara permanen?')) return;
    try {
      await AdminAPI.deleteUser(id);
      enqueueSnackbar('Pelanggan berhasil dihapus!', { variant: 'info' });
      refetchUsers();
      refetchStats();
    } catch (err) {
      enqueueSnackbar(errMsg(err, 'Gagal menghapus pelanggan'), { variant: 'error' });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await AdminAPI.loginAdmin({ email: loginEmail, password: loginPassword });
      if (res.token) {
        localStorage.setItem('sg_admin_token', res.token);
        setIsAuthenticated(true);
        setLoginError('');
        enqueueSnackbar('Login berhasil!', { variant: 'success' });
      } else {
        setLoginError('Email atau password salah!');
      }
    } catch (err: any) {
      setLoginError(err.response?.data?.error || 'Gagal terhubung ke server');
    }
  };

  // --- COMPUTE CHART DATA ---
  const chartData = React.useMemo(() => {
    if (!orders || orders.length === 0) return [];

    // Create an array of the last 7 days (YYYY-MM-DD)
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return dates.map((date) => {
      const dayOrders = orders.filter((o) => o.createdAt && o.createdAt.startsWith(date));
      const gmv = dayOrders.reduce(
        (sum, o) => sum + Number(o.totalAmount || o.danaBelanja || 0),
        0,
      );
      const fee = dayOrders.reduce((sum, o) => sum + Number(o.biayaLayanan || 0), 0);
      return {
        name: date.substring(5), // MM-DD
        gmv,
        fee,
        orders: dayOrders.length,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center font-black text-3xl text-white shadow-lg mb-4">
              S
            </div>
            <h1 className="font-bold text-2xl text-slate-800 tracking-tight">Truzzi</h1>
            <p className="text-slate-500 text-sm mt-1">Admin Dashboard Login</p>
          </div>

          {loginError && (
            <div className="bg-rose-50 text-rose-600 px-4 py-3 rounded-xl text-sm font-bold text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Email Admin</label>
              <div className="relative">
                <ShieldCheck
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Password</label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-colors shadow-sm mt-2"
            >
              Masuk
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-lg p-1.5 shrink-0">
              <img src="/logo.png" alt="Truzzi Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight text-white leading-none">Truzzi</h1>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Admin Center
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard size={18} /> Ringkasan
          </button>
          <button
            onClick={() => setActiveTab('promos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'promos'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Ticket size={18} /> Banner &amp; Promo
          </button>
          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'withdrawals'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ArrowDownToLine size={18} /> Penarikan Dana
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingBag size={18} /> Transaksi Jastip
          </button>
          <button
            onClick={() => setActiveTab('jastipers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'jastipers'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} /> Mitra Jastiper
          </button>
          <button
            onClick={() => setActiveTab('kyc-review')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'kyc-review'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck size={18} /> Verifikasi KYC
            </div>
            {pendingKycJastipers.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {pendingKycJastipers.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'customers'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} /> Pelanggan
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'admins'
                ? 'bg-primary text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShieldCheck size={18} /> Admin & Staff
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 space-y-3">
          <button
            onClick={() => {
              localStorage.removeItem('sg_admin_token');
              setIsAuthenticated(false);
              setLoginEmail('');
              setLoginPassword('');
            }}
            className="w-full py-2.5 rounded-xl border border-slate-700 hover:bg-rose-500 hover:text-white hover:border-rose-500 text-slate-400 font-bold transition-colors flex items-center justify-center gap-2"
          >
            Logout
          </button>
          <p className="text-center">&copy; 2026 Truzzi Admin.</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-800 capitalize">
              {activeTab === 'overview' && 'Dashboard Ringkasan Operasional'}
              {activeTab === 'promos' && 'Manajemen Banner & Kode Promo'}
              {activeTab === 'withdrawals' && 'Verifikasi Pencairan Saldo Jastiper'}
              {activeTab === 'orders' && 'Monitoring Transaksi Jastip'}
              {activeTab === 'jastipers' && 'Mitra Jastiper & Rating'}
              {activeTab === 'customers' && 'Daftar Pelanggan'}
              {activeTab === 'admins' && 'Kelola Admin & Staff'}
              {activeTab === 'kyc-review' && 'Verifikasi KYC Jastiper'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Truzzi On-Demand Marketplace Platform</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                refetchStats();
                refetchPromos();
                refetchWd();
                refetchOrders();
                refetchJastipers();
                refetchUsers();
              }}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw size={16} />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                AD
              </span>
              <span className="text-xs font-bold text-slate-700">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>TOTAL GMV</span>
                    <TrendingUp size={16} className="text-emerald-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-2">
                    {formatRupiah(stats?.totalGMV ?? 0)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Volume transaksi kotor
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>PENDAPATAN APLIKASI</span>
                    <ShieldCheck size={16} className="text-blue-500" />
                  </div>
                  <p className="text-2xl font-black text-blue-600 mt-2">
                    {formatRupiah(stats?.totalPlatformFee ?? 0)}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Total biaya layanan masuk
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>TOTAL PESANAN</span>
                    <ShoppingBag size={16} className="text-primary" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-2">
                    {stats?.totalOrders ?? orders.length}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Pesanan jastip terselesaikan
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>PENARIKAN PENDING</span>
                    <Clock size={16} className="text-amber-500" />
                  </div>
                  <p className="text-2xl font-black text-amber-600 mt-2">
                    {withdrawals.filter((w) => w.status === 'pending').length}
                  </p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Perlu approval admin
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
                    <span>PROMO AKTIF</span>
                    <Ticket size={16} className="text-indigo-500" />
                  </div>
                  <p className="text-2xl font-black text-slate-800 mt-2">{promos.length}</p>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Banner tayang di customer
                  </span>
                </div>
              </div>

              {/* NEW LAYOUT: Dashboard widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column (Chart & Orders) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Trend Chart */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-bold text-base text-slate-800">
                          Tren GMV & Pendapatan
                        </h3>
                        <p className="text-xs text-slate-500">7 Hari Terakhir</p>
                      </div>
                    </div>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={chartData}
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            dy={10}
                          />
                          <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickFormatter={(val) => `Rp${val / 1000}k`}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: '12px',
                              border: 'none',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                              fontSize: '12px',
                            }}
                            formatter={(value: any, name: any) => [
                              name === 'gmv' ? formatRupiah(value) : value,
                              name === 'gmv' ? 'GMV' : 'Pesanan',
                            ]}
                            labelStyle={{
                              fontWeight: 'bold',
                              color: '#334155',
                              marginBottom: '4px',
                            }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="gmv"
                            stroke="#0ea5e9"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Live Recent Orders */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          Transaksi Live
                        </h3>
                        <p className="text-xs text-slate-500">
                          Pesanan terbaru yang masuk ke platform
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('orders')}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1"
                      >
                        Semua Transaksi <ArrowRight size={14} />
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100 mt-2">
                      {orders.slice(0, 5).map((o) => (
                        <div key={o.id} className="py-3 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${o.orderType === 'suruh' ? 'bg-amber-50 text-amber-500' : 'bg-primary/10 text-primary'}`}
                            >
                              <ShoppingBag size={18} />
                            </span>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-800 truncate">
                                {o.serviceName || 'Layanan Truzzi'}
                              </p>
                              <p className="text-xs text-slate-500 truncate">
                                {o.title || o.id.split('-')[0]}
                              </p>
                            </div>
                          </div>
                          <div className="text-right shrink-0 ml-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                o.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : o.status === 'cancelled'
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-blue-50 text-blue-600'
                              }`}
                            >
                              {o.status.replace('_', ' ')}
                            </span>
                            <p className="text-[11px] font-bold text-slate-700 mt-1.5">
                              {formatRupiah(o.totalAmount || o.danaBelanja || 0)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {orders.length === 0 && (
                        <p className="text-xs text-slate-400 py-6 text-center">
                          Belum ada transaksi
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column (To-Do & Action Items) */}
                <div className="space-y-6">
                  {/* To-Do List Admin */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <AlertCircle size={80} />
                    </div>
                    <h3 className="font-bold text-base text-slate-800 relative z-10">
                      To-Do List Admin
                    </h3>

                    <div className="space-y-3 relative z-10">
                      <button
                        onClick={() => setActiveTab('kyc-review')}
                        className="w-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl p-3 flex items-center justify-between text-left"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-800">
                            Verifikasi KYC Jastiper
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Menunggu diproses</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${pendingKycJastipers.length > 0 ? 'bg-rose-100 text-rose-600' : 'bg-slate-200 text-slate-500'}`}
                        >
                          {pendingKycJastipers.length}
                        </span>
                      </button>

                      <button
                        onClick={() => setActiveTab('withdrawals')}
                        className="w-full bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-100 rounded-xl p-3 flex items-center justify-between text-left"
                      >
                        <div>
                          <p className="font-bold text-sm text-slate-800">
                            Penarikan Dana (Withdrawal)
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">Permintaan tertunda</p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold ${withdrawals.filter((w) => w.status === 'pending').length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-500'}`}
                        >
                          {withdrawals.filter((w) => w.status === 'pending').length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Active Promos Shortcut */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base text-slate-800">Promo Tayang</h3>
                      <button
                        onClick={() => setActiveTab('promos')}
                        className="text-xs text-primary font-bold hover:underline"
                      >
                        Kelola
                      </button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {promos.slice(0, 3).map((p) => (
                        <div key={p.id || p.code} className="py-3 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                            <Ticket size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-sm text-slate-800 truncate">{p.title}</p>
                            <p className="text-xs text-slate-500 font-mono mt-0.5">{p.code}</p>
                          </div>
                        </div>
                      ))}
                      {promos.length === 0 && (
                        <p className="text-xs text-slate-400 py-2">Belum ada promo tayang</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PROMOS & BANNERS */}
          {activeTab === 'promos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Daftar Banner &amp; Kode Promo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Semua promo di sini langsung tampil di banner beranda &amp; halaman voucher
                    customer
                  </p>
                </div>
                <button
                  onClick={() => setShowPromoModal(true)}
                  className="px-4 py-2.5 bg-primary text-white font-bold text-sm rounded-xl flex items-center gap-2 hover:bg-primary-dark transition-colors shadow-sm"
                >
                  <Plus size={16} /> Buat Promo Baru
                </button>
              </div>

              {/* Grid Promo Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {promos.map((p) => (
                  <div
                    key={p.id || p.code}
                    className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs flex flex-col"
                  >
                    <div className="h-40 bg-slate-100 relative overflow-hidden flex items-center justify-center">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="p-6 text-center">
                          <Ticket size={36} className="mx-auto text-slate-400 mb-2" />
                          <span className="font-bold font-mono text-primary text-base">
                            {p.code}
                          </span>
                        </div>
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 bg-white/90 backdrop-blur-xs font-mono font-bold text-xs rounded-lg text-primary shadow-xs">
                        {p.code}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-base text-slate-800">{p.title}</h4>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {p.subtitle || p.description}
                        </p>
                        {p.discountText && (
                          <div className="mt-2 inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md">
                            {p.discountText}
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          Min. {p.minSpend || 'Rp 0'}
                        </span>
                        <button
                          onClick={() => handleDeletePromo(p.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Promo"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: WITHDRAWALS */}
          {activeTab === 'withdrawals' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Permintaan Penarikan Dana</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Persetujuan pencairan saldo pengguna ke rekening bank
                  </p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    onClick={() => setActiveWithdrawalTab('mitra')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeWithdrawalTab === 'mitra'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Mitra Jastiper
                  </button>
                  <button
                    onClick={() => setActiveWithdrawalTab('customer')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      activeWithdrawalTab === 'customer'
                        ? 'bg-white text-primary shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Customer
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">
                        {activeWithdrawalTab === 'mitra' ? 'Mitra Jastiper' : 'Customer'}
                      </th>
                      <th className="px-6 py-4">Nominal</th>
                      <th className="px-6 py-4">Bank Tujuan</th>
                      <th className="px-6 py-4">No. Rekening</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(activeWithdrawalTab === 'mitra' ? mitraWithdrawals : customerWithdrawals).map(
                      (w) => (
                        <tr key={w.id} className="hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {w.accountName || 'Mitra Jastip'}
                          </td>
                          <td className="px-6 py-4 font-bold text-primary">
                            {formatRupiah(w.amount)}
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{w.bankName}</td>
                          <td className="px-6 py-4 font-mono text-slate-600">{w.accountNumber}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                w.status === 'approved'
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : w.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-amber-50 text-amber-600'
                              }`}
                            >
                              {w.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {w.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveWd(w.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                  >
                                    <CheckCircle2 size={14} /> Setujui
                                  </button>
                                  <button
                                    onClick={() => handleRejectWd(w.id)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                                  >
                                    <XCircle size={14} /> Tolak
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeleteWd(w.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Hapus Penarikan"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )}
                    {(activeWithdrawalTab === 'mitra' ? mitraWithdrawals : customerWithdrawals)
                      .length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                          Tidak ada data penarikan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Semua Transaksi Jastip</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Monitoring transaksi real-time seluruh pesanan
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Order ID</th>
                      <th className="px-6 py-4">Pesanan</th>
                      <th className="px-6 py-4">Jastiper</th>
                      <th className="px-6 py-4">Total Belanja</th>
                      <th className="px-6 py-4">Ongkir</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500 font-semibold">
                          #{o.id.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">{o.title}</td>
                        <td className="px-6 py-4 text-slate-600">
                          {o.jastiperName || 'Mencari Jastiper'}
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          {formatRupiah(o.danaBelanja || o.totalAmount)}
                        </td>
                        <td className="px-6 py-4 font-semibold text-primary">
                          {formatRupiah(o.ongkir || 10000)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                              o.status === 'completed'
                                ? 'bg-emerald-50 text-emerald-600'
                                : o.status === 'cancelled'
                                  ? 'bg-rose-50 text-rose-600'
                                  : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {o.statusText || o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {orders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                          Belum ada transaksi
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: JASTIPERS */}
          {activeTab === 'jastipers' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Daftar Mitra Jastiper &amp; Rating
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Rating nyata hasil ulasan customer di platform
                  </p>
                </div>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari Jastiper..."
                    value={searchJastiper}
                    onChange={(e) => setSearchJastiper(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Mitra</th>
                      <th className="px-6 py-4">Area Trip</th>
                      <th className="px-6 py-4">Rating Real</th>
                      <th className="px-6 py-4">Total Order</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredJastipers.map((j) => (
                      <tr key={j.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {j.photoUrl ? (
                              <img
                                src={j.photoUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                📦
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800">{j.name}</p>
                              <p className="text-xs text-slate-400">
                                {j.email || 'Tidak ada email'}
                              </p>
                              <p className="text-xs text-slate-400">{j.phone || '-'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {j.area || 'Nasional'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 font-bold text-amber-500">
                            <Star size={16} className="fill-amber-400 text-amber-400" />
                            <span>{Number(j.rating || 0).toFixed(1)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {j.totalOrders || 0} pesanan
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-bold ${j.isActive !== false ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}
                          >
                            {j.isActive !== false ? 'AKTIF' : 'SUSPEND'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditJastiperClick(j)}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                              title="Edit Jastiper"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteJastiper(j.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Hapus Jastiper"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredJastipers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                          Belum ada data jastiper
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTOMERS */}
          {activeTab === 'customers' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-800">
                    Daftar Pelanggan (Customer)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola pengguna aplikasi Truzzi</p>
                </div>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    placeholder="Cari Pelanggan..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm w-64 focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Pelanggan</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Nomor HP</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {c.photoUrl ? (
                              <img
                                src={c.photoUrl}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                🧑
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-800">{c.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{c.email || 'Tidak ada email'}</td>
                        <td className="px-6 py-4 text-slate-600">{c.phone || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditCustomerClick(c)}
                              className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                              title="Edit Pelanggan"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                              title="Hapus Pelanggan"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredCustomers.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                          Belum ada data pelanggan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: ADMINS */}
          {activeTab === 'admins' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base text-slate-800">Daftar Admin &amp; Staff</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Kelola akses ke Dashboard Truzzi</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Nama Admin</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs">
                            S
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">Super Admin</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">admin@truzzix.go</td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-50 text-rose-600 uppercase tracking-wider">
                          Owner
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-xs text-slate-400 italic">Tidak bisa dihapus</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: KYC REVIEW */}
          {activeTab === 'kyc-review' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-xl text-slate-800">Persetujuan Identitas (KYC)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review foto KTP dan wajah pendaftar Jastiper baru.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                {pendingKycJastipers.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-800 font-bold mb-1">Semua Selesai!</h3>
                    <p className="text-slate-500 text-sm">
                      Tidak ada Jastiper yang menunggu verifikasi saat ini.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pendingKycJastipers.map((j) => (
                      <div
                        key={j.id || j.$id}
                        className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col"
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <img
                            src={
                              j.photoUrl ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(j.name)}&background=random`
                            }
                            alt={j.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{j.name}</p>
                            <p className="text-xs text-slate-500">{j.email}</p>
                          </div>
                        </div>

                        <div className="mt-auto space-y-3">
                          <div className="flex items-center justify-between text-xs border-t border-slate-200 pt-3">
                            <span className="text-slate-500">Status</span>
                            <span className="text-amber-600 font-bold px-2 py-0.5 bg-amber-100 rounded-full">
                              Pending
                            </span>
                          </div>
                          <button
                            onClick={() => setSelectedKycJastiper(j)}
                            className="w-full py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-sm rounded-lg border border-primary/20 transition-all"
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
        </div>
      </main>

      {/* Modal Verifikasi KYC */}
      {selectedKycJastiper && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-4xl shadow-2xl space-y-4 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" /> Verifikasi KYC:{' '}
                {selectedKycJastiper.name}
              </h3>
              <button
                onClick={() => setSelectedKycJastiper(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* KTP */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Foto KTP</h4>
                  <div className="aspect-[16/10] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm">
                    <img
                      src={selectedKycJastiper.kycKtpUrl}
                      alt="KTP"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={selectedKycJastiper.kycKtpUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-white rounded-lg text-slate-800 text-xs font-bold shadow-lg"
                      >
                        Perbesar Gambar
                      </a>
                    </div>
                  </div>
                </div>

                {/* Selfie */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-800">Foto Selfie (Wajah)</h4>
                  <div className="aspect-[16/10] bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden relative group shadow-sm">
                    <img
                      src={selectedKycJastiper.kycSelfieUrl}
                      alt="Selfie"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={selectedKycJastiper.kycSelfieUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-white rounded-lg text-slate-800 text-xs font-bold shadow-lg"
                      >
                        Perbesar Gambar
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
                  Panduan Verifikasi Admin
                </h4>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Pastikan wajah di KTP sama persis dengan foto Selfie.</li>
                  <li>Pastikan tulisan di KTP (NIK, Nama, dll) dapat terbaca dengan jelas.</li>
                  <li>
                    Pastikan foto KTP asli dan bukan merupakan hasil manipulasi/editan komputer.
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => handleRejectKyc(selectedKycJastiper.id || selectedKycJastiper.$id)}
                className="px-6 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-sm transition-colors"
              >
                Tolak &amp; Minta Foto Ulang
              </button>
              <button
                onClick={() => handleApproveKyc(selectedKycJastiper.id || selectedKycJastiper.$id)}
                className="px-6 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition-colors shadow-md"
              >
                Setujui Jastiper
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Promo Baru */}
      {showPromoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPromoModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">
                Buat Banner &amp; Kode Promo Baru
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePromo} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Kode Voucher (Kapital)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Mis: JASTIPHEMAT"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono uppercase text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Judul Promo</label>
                <input
                  type="text"
                  required
                  placeholder="Mis: Gratis Ongkir Super Jastip"
                  value={promoTitle}
                  onChange={(e) => setPromoTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Deskripsi / Subtitle
                </label>
                <input
                  type="text"
                  placeholder="Mis: Diskon ongkir s.d Rp 10.000 untuk pengguna baru"
                  value={promoSubtitle}
                  onChange={(e) => setPromoSubtitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teks Diskon</label>
                  <input
                    type="text"
                    placeholder="Mis: Diskon Rp 10.000"
                    value={promoDiscount}
                    onChange={(e) => setPromoDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipe Promo</label>
                  <select
                    value={promoType}
                    onChange={(e) => setPromoType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="discount">Diskon Persen</option>
                    <option value="cashback">Diskon Flat (Rupiah)</option>
                    <option value="gratis_ongkir">Gratis Ongkir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={promoCategory}
                    onChange={(e) => setPromoCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:border-primary"
                  >
                    <option value="all">Semua</option>
                    <option value="jastip">Jastip</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Min. Belanja (Rp)
                  </label>
                  <input
                    type="text"
                    placeholder="Mis: 30.000"
                    value={
                      promoMinSpend
                        ? new Intl.NumberFormat('id-ID').format(Number(promoMinSpend))
                        : ''
                    }
                    onChange={(e) => setPromoMinSpend(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Kuota Promo</label>
                  <input
                    type="number"
                    placeholder="Mis: 100"
                    value={promoQuota}
                    onChange={(e) => setPromoQuota(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {promoType === 'discount' ? (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Persen Diskon (%)
                      </label>
                      <input
                        type="number"
                        placeholder="20"
                        value={promoDiscountPercent}
                        onChange={(e) => setPromoDiscountPercent(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Maks. Diskon (Rp)
                      </label>
                      <input
                        type="text"
                        placeholder="Mis: 10.000"
                        value={
                          promoMaxDiscount
                            ? new Intl.NumberFormat('id-ID').format(Number(promoMaxDiscount))
                            : ''
                        }
                        onChange={(e) => setPromoMaxDiscount(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Nominal Diskon (Rp)
                      </label>
                      <input
                        type="text"
                        placeholder="Mis: 10.000"
                        value={
                          promoDiscountFlat
                            ? new Intl.NumberFormat('id-ID').format(Number(promoDiscountFlat))
                            : ''
                        }
                        onChange={(e) => setPromoDiscountFlat(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Max Budget Total (Rp)
                      </label>
                      <input
                        type="text"
                        placeholder="Mis: 500.000"
                        value={
                          promoBudgetMax
                            ? new Intl.NumberFormat('id-ID').format(Number(promoBudgetMax))
                            : ''
                        }
                        onChange={(e) => setPromoBudgetMax(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tgl Mulai</label>
                  <input
                    type="datetime-local"
                    value={promoStartDate}
                    onChange={(e) => setPromoStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tgl Berakhir
                  </label>
                  <input
                    type="datetime-local"
                    value={promoEndDate}
                    onChange={(e) => setPromoEndDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Upload Gambar Banner
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-2 transition-colors"
                  >
                    <Upload size={14} /> {uploadingImage ? 'Mengunggah...' : 'Pilih File Gambar'}
                  </button>
                  {promoImageUrl && (
                    <span className="text-xs text-emerald-600 font-bold truncate">
                      ✓ Gambar Terpasang
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPromoModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingPromo}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingPromo ? 'Menyimpan...' : 'Simpan & Publikasikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Jastiper */}
      {showEditJastiperModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowEditJastiperModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Edit Data Jastiper</h3>
              <button
                onClick={() => setShowEditJastiperModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateJastiper} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nama Mitra</label>
                <input
                  type="text"
                  required
                  value={jastiperName}
                  onChange={(e) => setJastiperName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Handphone
                </label>
                <input
                  type="text"
                  required
                  value={jastiperPhone}
                  onChange={(e) => setJastiperPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="text-sm font-bold text-slate-700">Status Akun Aktif</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={jastiperIsActive}
                    onChange={(e) => setJastiperIsActive(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-bold text-slate-700">Verifikasi KYC (KTP)</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={jastiperKycVerified}
                    onChange={(e) => setJastiperKycVerified(e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditJastiperModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingJastiper}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingJastiper ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Customer */}
      {showEditCustomerModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowEditCustomerModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Edit Data Pelanggan</h3>
              <button
                onClick={() => setShowEditCustomerModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Pelanggan
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor Handphone
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditCustomerModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingCustomer}
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  {submittingCustomer ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
