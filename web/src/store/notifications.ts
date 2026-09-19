import { create } from 'zustand';
import { useAuthStore } from './auth';
import { API } from '../lib/api';
import type { AppNotification } from '../types';

interface NotificationState {
  notifications: AppNotification[];
  loading: boolean;
  load: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  unreadCount: number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  loading: false,
  unreadCount: 0,

  load: async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    set({ loading: true });
    try {
      const { notifications } = await API.notifications.list();
      set({
        notifications,
        unreadCount: notifications.filter((n: AppNotification) => !n.isRead).length,
      });
    } catch {
      /* ignore */
    } finally {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    await API.notifications.read(id);
    const notifications = get().notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    set({ notifications, unreadCount: notifications.filter((n) => !n.isRead).length });
  },

  markAllRead: async () => {
    await API.notifications.readAll();
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
  },
}));
