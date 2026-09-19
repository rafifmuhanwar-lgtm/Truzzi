import axios from 'axios';

/** API client — axios dengan baseURL yang sama (Vite proxy '/api' → server :4000). */
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json', 'X-App': 'customer' },
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
    register: (data: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      selectedArea?: string;
    }) => api.post('/auth/register', data).then((r) => r.data),
    login: (data: { email: string; password: string }) =>
      api.post('/auth/login', data).then((r) => r.data),
    google: () => api.post('/auth/google').then((r) => r.data),
    googleCallback: (code: string) =>
      api.post('/auth/google/callback', { code }).then((r) => r.data),
    me: () => api.get('/auth/me').then((r) => r.data),
    logout: () => api.post('/auth/logout').then((r) => r.data),
    updateProfile: (data: {
      name?: string;
      phone?: string;
      photoUrl?: string;
      selectedArea?: string;
    }) => api.put('/auth/profile', data).then((r) => r.data),
  },
  jastipers: {
    list: (params?: {
      area?: string;
      sort?: string;
      search?: string;
      lat?: number;
      lng?: number;
    }) => api.get('/jastipers', { params }).then((r) => r.data),
    get: (id: string) => api.get(`/jastipers/${id}`).then((r) => r.data),
    nearBy: (lat: number, lng: number, radius?: number) =>
      api
        .get('/jastipers/nearby', { params: { lat, lng, radius: radius ?? 5 } })
        .then((r) => r.data),
    popular: () => api.get('/jastipers/popular').then((r) => r.data),
    newest: () => api.get('/jastipers/newest').then((r) => r.data),
  },
  favorites: {
    list: () => api.get('/favorites').then((r) => r.data),
    add: (jastiperId: string) => api.post('/favorites', { jastiperId }).then((r) => r.data),
    remove: (id: string) => api.delete(`/favorites/${id}`).then((r) => r.data),
    isFavorite: (jastiperId: string) =>
      api.get(`/favorites/check/${jastiperId}`).then((r) => r.data),
  },
  orders: {
    create: (data: Record<string, unknown>) => api.post('/orders', data).then((r) => r.data),
    list: (params?: Record<string, unknown>) => api.get('/orders', { params }).then((r) => r.data),
    get: (id: string) => api.get(`/orders/${id}`).then((r) => r.data),
    patch: (id: string, data: Record<string, unknown>) =>
      api.patch(`/orders/${id}`, data).then((r) => r.data),
    jastiper: (id: string) => api.get(`/orders/${id}/jastiper`).then((r) => r.data),
    escrow: (id: string, data?: Record<string, unknown>) =>
      api.post(`/orders/${id}/escrow`, data ?? {}).then((r) => r.data),
    report: (id: string, data: Record<string, unknown>) =>
      api.post(`/orders/${id}/report`, data).then((r) => r.data),
    review: (id: string, data: Record<string, unknown>) =>
      api.post(`/orders/${id}/review`, data).then((r) => r.data),
    confirmReceived: (id: string, data: { rating: number; reviewText: string }) =>
      api.post(`/jastiper/orders/${id}/confirm-received`, data).then((r) => r.data),
  },
  jastipProducts: {
    list: (jastiperId: string) => api.get(`/jastipers/${jastiperId}/products`).then((r) => r.data),
    create: (data: Record<string, unknown>) =>
      api.post('/jastip-products', data).then((r) => r.data),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/jastip-products/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/jastip-products/${id}`).then((r) => r.data),
    togglePublish: (id: string) =>
      api.post(`/jastip-products/${id}/toggle-publish`).then((r) => r.data),
  },
  chat: {
    rooms: () => api.get('/chat/rooms').then((r) => r.data),
    messages: (roomId: string) => api.get(`/chat/rooms/${roomId}/messages`).then((r) => r.data),
    send: (roomId: string, data: Record<string, unknown>) =>
      api.post(`/chat/rooms/${roomId}/messages`, data).then((r) => r.data),
    read: (roomId: string) => api.post(`/chat/rooms/${roomId}/read`).then((r) => r.data),
    csBot: (text: string) => api.post('/chat/cs/bot-reply', { text }).then((r) => r.data),
    generateResi: (orderId: string) =>
      api.post(`/orders/${orderId}/generate-resi`).then((r) => r.data),
    editOrder: (orderId: string, data: Record<string, unknown>) =>
      api.patch(`/orders/${orderId}`, data).then((r) => r.data),
    cancelOrder: (orderId: string) => api.post(`/orders/${orderId}/cancel`).then((r) => r.data),
    takeOrder: (orderId: string) => api.post(`/orders/${orderId}/take`).then((r) => r.data),
  },
  wallet: {
    get: (userId: string) => api.get(`/wallet/${userId}`).then((r) => r.data),
    topup: (data: { amount: number; method?: string }) =>
      api.post('/topup', data).then((r) => r.data),
    withdraw: (data: {
      amount: number;
      method: string;
      accountNumber: string;
      accountName?: string;
    }) => api.post('/wallet/withdraw', data).then((r) => r.data),
    topupDetail: (id: string) => api.get(`/topup/${id}`).then((r) => r.data),
    topupSimulate: (id: string) => api.post(`/topup/${id}/simulate`).then((r) => r.data),
    escrows: (userId: string) => api.get(`/wallet/${userId}/escrows`).then((r) => r.data),
    topups: (userId: string) => api.get(`/wallet/${userId}/topups`).then((r) => r.data),
    withdrawals: (userId: string) => api.get(`/wallet/${userId}/withdrawals`).then((r) => r.data),
  },
  location: {
    geocode: (q: string) => api.get('/geocode', { params: { q } }).then((r) => r.data),
    reverseGeocode: (lat: number, lng: number) =>
      api.get('/reverse-geocode', { params: { lat, lng } }).then((r) => r.data),
    distance: (p: { fromLat: number; fromLng: number; toLat: number; toLng: number }) =>
      api.get('/distance', { params: p }).then((r) => r.data),
    places: (q: string, lat?: number, lng?: number) =>
      api
        .get('/places/search', {
          params: {
            q,
            ...(lat !== undefined ? { lat } : {}),
            ...(lng !== undefined ? { lng } : {}),
          },
        })
        .then((r) => r.data),
  },
  promos: {
    list: () => api.get('/promos').then((r) => r.data),
    validate: (data: { code: string; cartAmount: number; category: string }) =>
      api.post('/promos/validate', data).then((r) => r.data),
    claim: (data: { code: string }) => api.post('/promos/claim', data).then((r) => r.data),
    mine: () => api.get('/promos/mine').then((r) => r.data),
  },
  gigs: {
    list: (params?: { category?: string; status?: string }) =>
      api.get('/gigs', { params }).then((r) => r.data),
    mine: (role: 'posted' | 'worked') =>
      api.get('/gigs/mine', { params: { role } }).then((r) => r.data),
    get: (id: string) => api.get(`/gigs/${id}`).then((r) => r.data),
    create: (data: Record<string, unknown>) => api.post('/gigs', data).then((r) => r.data),
    take: (id: string) => api.post(`/gigs/${id}/take`).then((r) => r.data),
    submit: (id: string, data: Record<string, unknown>) =>
      api.post(`/gigs/${id}/submit`, data).then((r) => r.data),
    approve: (id: string) => api.post(`/gigs/${id}/approve`).then((r) => r.data),
    cancel: (id: string) => api.post(`/gigs/${id}/cancel`).then((r) => r.data),
    review: (id: string, data: Record<string, unknown>) =>
      api.post(`/gigs/${id}/review`, data).then((r) => r.data),
  },
  notifications: {
    list: () => api.get('/notifications').then((r) => r.data),
    read: (id: string) => api.post(`/notifications/read/${id}`).then((r) => r.data),
    readAll: () => api.post('/notifications/read-all').then((r) => r.data),
  },
  addresses: {
    list: () => api.get('/addresses').then((r) => r.data),
    create: (data: Record<string, unknown>) => api.post('/addresses', data).then((r) => r.data),
    update: (id: string, data: Record<string, unknown>) =>
      api.patch(`/addresses/${id}`, data).then((r) => r.data),
    remove: (id: string) => api.delete(`/addresses/${id}`).then((r) => r.data),
  },
  admin: {
    stats: () => api.get('/admin/stats').then((r) => r.data),
    withdrawals: () => api.get('/admin/withdrawals').then((r) => r.data),
    approveWithdrawal: (id: string) =>
      api.post(`/admin/withdrawals/${id}/approve`).then((r) => r.data),
    rejectWithdrawal: (id: string) =>
      api.post(`/admin/withdrawals/${id}/reject`).then((r) => r.data),
    promos: () => api.get('/admin/promos').then((r) => r.data),
    createPromo: (data: Record<string, unknown>) =>
      api.post('/admin/promos', data).then((r) => r.data),
    deletePromo: (id: string) => api.delete(`/admin/promos/${id}`).then((r) => r.data),
    // Users CRUD
    users: () => api.get('/admin/users').then((r) => r.data),
    updateUser: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/users/${id}`, data).then((r) => r.data),
    deleteUser: (id: string) => api.delete(`/admin/users/${id}`).then((r) => r.data),
    // Jastipers CRUD
    jastipers: () => api.get('/admin/jastipers').then((r) => r.data),
    updateJastiper: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/jastipers/${id}`, data).then((r) => r.data),
    deleteJastiper: (id: string) => api.delete(`/admin/jastipers/${id}`).then((r) => r.data),
    // Orders CRUD
    orders: () => api.get('/admin/orders').then((r) => r.data),
    updateOrder: (id: string, data: Record<string, unknown>) =>
      api.patch(`/admin/orders/${id}`, data).then((r) => r.data),
    deleteOrder: (id: string) => api.delete(`/admin/orders/${id}`).then((r) => r.data),
    // Gigs CRUD
    gigs: () => api.get('/admin/gigs').then((r) => r.data),
    deleteGig: (id: string) => api.delete(`/admin/gigs/${id}`).then((r) => r.data),
  },

  upload: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post('/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((r) => r.data);
  },
};

export function errMsg(e: unknown, fallback = 'Terjadi kesalahan'): string {
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as { message: string }).message);
  return fallback;
}
