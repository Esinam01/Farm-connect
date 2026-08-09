import { create } from 'zustand';
import {
  fetchNotifications,
  markNotificationRead,
  clearAllNotifications,
  addNotification,
} from '../lib/notifications';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  userId: null,

  // call this once you know the logged-in user (e.g. in a useEffect on your header/home screen)
  init: async (userId) => {
    set({ userId, loading: true });
    const data = await fetchNotifications(userId);
    set({ notifications: data, loading: false });
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) return;
    const data = await fetchNotifications(userId);
    set({ notifications: data });
  },

  markAsRead: async (id) => {
    // optimistic update
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      ),
    }));
    await markNotificationRead(id);
  },

  clearAll: async () => {
    const { userId } = get();
    if (!userId) return;
    set({ notifications: [] }); // optimistic
    await clearAllNotifications(userId);
  },

  // convenience so other screens can do useNotificationStore.getState().notify(...)
  notify: async ({ title, message, type }) => {
    const { userId } = get();
    if (!userId) return;
    const created = await addNotification({ userId, title, message, type });
    if (created) {
      set((state) => ({ notifications: [created, ...state.notifications] }));
    }
  },

  unreadCount: () => get().notifications.filter((n) => !n.is_read).length,
}));