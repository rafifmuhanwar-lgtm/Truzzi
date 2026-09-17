import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sg_admin_token') || localStorage.getItem('sg_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const AdminAPI = {
  loginAdmin: (data: Record<string, unknown>) => api.post('/admin/login', data).then((r) => r.data),
  stats: () => api.get('/admin/stats').then((r) => r.data),
  orders: () => api.get('/admin/orders').then((r) => r.data).catch(() => api.get('/orders').then((r) => r.data)),
  withdrawals: () => api.get('/admin/withdrawals').then((r) => r.data),
  approveWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/approve`).then((r) => r.data),
  rejectWithdrawal: (id: string) => api.post(`/admin/withdrawals/${id}/reject`).then((r) => r.data),
  deleteWithdrawal: (id: string) => api.delete(`/admin/withdrawals/${id}`).then((r) => r.data),
  promos: () => api.get('/admin/promos').then((r) => r.data).catch(() => api.get('/promos').then((r) => r.data)),
  createPromo: (data: Record<string, unknown>) => api.post('/admin/promos', data).then((r) => r.data),
  deletePromo: (id: string) => api.delete(`/admin/promos/${id}`).then((r) => r.data),
  users: () => api.get('/admin/users').then((r) => r.data),
  updateUser: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data).then((r) => r.data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
  jastipers: () => api.get('/admin/jastipers').then((r) => r.data).catch(() => api.get('/jastipers').then((r) => r.data)),
  updateJastiper: (id: string, data: Record<string, unknown>) => api.patch(`/admin/jastipers/${id}`, data).then((r) => r.data),
  deleteJastiper: (id: string) => api.delete(`/admin/jastipers/${id}`).then((r) => r.data),
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data);
  },
};

export function errMsg(e: unknown, fallback = 'Terjadi kesalahan'): string {
  if (axios.isAxiosError(e)) {
    return e.response?.data?.message || e.message || fallback;
  }
  if (e instanceof Error) return e.message;
  return fallback;
}

export function formatRupiah(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

