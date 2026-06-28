import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { subscribe as subscribeToAuth, getAuthState } from "../lib/auth-store";

// const STORAGE_KEY = "wishlist-storage";
const storageKey = (userId) =>
  userId ? `wishlist-storage-${userId}` : "wishlist-storage-guest";

export const useWishlistStore = create((set, get) => ({
  wishlist: [],
  hasHydrated: false,

  // Call this once on app start — listens to auth changes and reloads wishlist
  init: () => {
    const load = async () => {
      const { user } = getAuthState();
      const key = storageKey(user?.id);
      try {
        const json = await AsyncStorage.getItem(key);
        set({ wishlist: json ? JSON.parse(json) : [], hasHydrated: true });
      } catch (e) {
        console.error("Failed to hydrate wishlist:", e);
        set({ hasHydrated: true });
      }
    };

    load(); // load immediately for current session

    // Reload wishlist whenever auth state changes (login/logout/switch)
    const unsubscribe = subscribeToAuth(load);
    return unsubscribe; // call this to clean up if needed
  },

  hydrate: async () => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    try {
      const json = await AsyncStorage.getItem(key);
      if (json) set({ wishlist: JSON.parse(json) });
    } catch (e) {
      console.error("Failed to hydrate wishlist:", e);
    } finally {
      set({ hasHydrated: true });
    }
  },

  _persist: (wishlist) => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    AsyncStorage.setItem(key, JSON.stringify(wishlist)).catch((e) =>
      console.error("Failed to persist wishlist:", e)
    );
  },

  toggleWishlist: (product) => {
    const { wishlist, _persist } = get();

    const exists = wishlist.find((item) => item.id === product.id);

    const newWishlist = exists
      ? wishlist.filter((item) => item.id !== product.id)
      : [...wishlist, product];

    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  addToWishlist: (product) => {
    const { wishlist, _persist } = get();

    const exists = wishlist.find((item) => item.id === product.id);

    if (exists) return;

    const newWishlist = [...wishlist, product];

    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  removeFromWishlist: (id) => {
    const { wishlist, _persist } = get();

    const newWishlist = wishlist.filter((item) => item.id !== id);

    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  clearWishlist: () => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    set({ wishlist: [] });
    AsyncStorage.removeItem(key).catch(() => {});
  },
}));
