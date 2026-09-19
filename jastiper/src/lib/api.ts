import axios from 'axios';

/** API client driver — axios dengan baseURL yang sama (Vite proxy '/api' → server :4000). */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-App': 'driver' },
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    const msg =
      error?.response?.data?.message ||
      (error?.code === 'ECONNABORTED' ? 'Koneksi timeout' : 'Terjadi kesalahan');
    const code = error?.response?.data?.code;
    return Promise.reject({ message: msg, code, status: error?.response?.status, original: error });
  },
);

export const API = {
  auth: {
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then((r) => r.data),
    me: () => api.get('/auth/me').then((r) => r.data),
    logout: () => api.post('/auth/logout').then((r) => r.data),
  },
  jastiper: {
    register: (data: { name: string; email: string; password: string; phone: string }) =>
      api.post('/jastiper/register', data).then((r) => r.data),
    me: () => api.get('/jastiper/me').then((r) => r.data),
    updateProfile: (data: Record<string, unknown>) =>
      api.put('/jastiper/profile', data).then((r) => r.data),
    kyc: (data: { ktpUrl: string; selfieUrl: string }) =>
      api.post('/jastiper/kyc', data).then((r) => r.data),
    setOnline: (isOnline: boolean) =>
      api.post('/jastiper/online', { isOnline }).then((r) => r.data),
    availableOrders: () => api.get('/jastiper/orders/available').then((r) => r.data),
    myOrders: () => api.get('/jastiper/orders/mine').then((r) => r.data),
    acceptOrder: (id: string) => api.post(`/jastiper/orders/${id}/accept`).then((r) => r.data),
    updateStatus: (id: string, statusText: string, extra?: Record<string, unknown>) =>
      api.patch(`/jastiper/orders/${id}/status`, { statusText, ...extra }).then((r) => r.data),
    sendLocation: (id: string, lat: number, lng: number) =>
      api.post(`/jastiper/orders/${id}/location`, { lat, lng }).then((r) => r.data),
    submitReceipt: (id: string, data: { strukImageUrl: string; totalBelanjaStruk: number }) =>
      api.post(`/jastiper/orders/${id}/receipt`, data).then((r) => r.data),
    completeOrder: (id: string, deliveryProofUrl: string) =>
      api.post(`/jastiper/orders/${id}/complete`, { deliveryProofUrl }).then((r) => r.data),
    earnings: () => api.get('/jastiper/earnings').then((r) => r.data),
    withdrawals: () => api.get('/jastiper/withdrawals').then((r) => r.data),
    createWithdrawal: (data: { amount: number; bankName: string; accountNumber: string }) =>
      api.post('/jastiper/withdrawals', data).then((r) => r.data),
  },
  orders: {
    get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
  },
  chat: {
    rooms: () => api.get('/chat/rooms').then((r) => r.data),
    messages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`).then((r) => r.data),
    send: (roomId: string, data: Record<string, unknown>) =>
      api.post(`/chat/rooms/${roomId}/messages`, data).then((r) => r.data),
    read: (roomId: string) => api.post(`/chat/rooms/${roomId}/read`).then((r) => r.data),
    csBot: (text: string) => api.post('/chat/cs/bot-reply', { text }).then((r) => r.data),
  },
  notifications: {
    list: () => api.get('/notifications').then((r) => r.data),
    read: (id: string) => api.post(`/notifications/read/${id}`).then((r) => r.data),
    readAll: () => api.post('/notifications/read-all').then((r) => r.data),
  },
  location: {
    distance: (p: { fromLat: number; fromLng: number; toLat: number; toLng: number }) =>
      api.get('/distance', { params: p }).then((r) => r.data),
  },
  jastipProfile: {
    /** Ambil profil jastiper saya sendiri (null jika belum daftar) */
    me: () => api.get('/jastipers/me').then((r) => r.data),
    /** Daftar atau update profil jastiper */
    register: (data: Record<string, unknown>) =>
      api.post('/jastipers/register', data).then((r) => r.data),
    update: (data: Record<string, unknown>) => api.put('/jastipers/me', data).then((r) => r.data),
    products: {
      list: () => api.get('/jastip-products').then((r) => r.data),
      create: (data: Record<string, unknown>) =>
        api.post('/jastip-products', data).then((r) => r.data),
      update: (id: string, data: Record<string, unknown>) =>
        api.patch(`/jastip-products/${id}`, data).then((r) => r.data),
      remove: (id: string) => api.delete(`/jastip-products/${id}`).then((r) => r.data),
      togglePublish: (id: string) =>
        api.post(`/jastip-products/${id}/toggle-publish`).then((r) => r.data),
    },
  },
  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

/** Helper mengekstrak pesan kesalahan terpadu. */
export function errMsg(e: unknown, fallback = 'Terjadi kesalahan'): string {
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as { message: string }).message);
  return fallback;
}
