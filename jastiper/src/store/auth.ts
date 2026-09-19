import { create } from 'zustand';
import { API } from '../lib/api';
import type { JastiperProfile } from '../types';

export type AuthStatus = 'initial' | 'loading' | 'authenticated' | 'unauthenticated' | 'error';

interface AuthState {
  status: AuthStatus;
  user: JastiperProfile | null;
  errorMessage: string | null;
  checkAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, phone: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: JastiperProfile) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'initial',
  user: null,
  errorMessage: null,

  checkAuth: async () => {
    set({ status: 'loading', errorMessage: null });
    try {
      const data = await API.jastiper.me();
      set({ status: 'authenticated', user: data.user });
    } catch (e) {
      const statusErr = (e as { status?: number })?.status;
      if (statusErr && statusErr >= 400 && statusErr < 500) {
        set({ status: 'unauthenticated', user: null, errorMessage: null });
      } else {
        set({ status: 'unauthenticated', user: null, errorMessage: 'Gagal memeriksa sesi' });
      }
    }
  },

  login: async (email, password) => {
    set({ status: 'loading', errorMessage: null });
    try {
      const data = await API.auth.login({ email, password });
      // Ambil profil jastiper lengkap setelah login sukses.
      const me = await API.jastiper.me();
      set({ status: 'authenticated', user: me.user ?? data.user, errorMessage: null });
    } catch (e) {
      set({
        status: 'error',
        errorMessage: `Login Gagal: ${(e as { message?: string })?.message ?? 'Terjadi kesalahan'}`,
      });
    }
  },

  register: async (name, email, password, phone) => {
    set({ status: 'loading', errorMessage: null });
    try {
      await API.jastiper.register({ name, email, password, phone });
      const me = await API.jastiper.me();
      set({ status: 'authenticated', user: me.user, errorMessage: null });
    } catch (e) {
      set({
        status: 'error',
        errorMessage: `Register Gagal: ${(e as { message?: string })?.message ?? 'Terjadi kesalahan'}`,
      });
    }
  },

  logout: async () => {
    try {
      await API.auth.logout();
    } catch {
      /* ignore */
    }
    set({ status: 'unauthenticated', user: null, errorMessage: null });
  },

  setUser: (user) => set({ user, status: 'authenticated' }),
}));
