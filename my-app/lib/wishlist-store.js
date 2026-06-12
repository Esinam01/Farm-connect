import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "wishlist-storage";

export const useWishlistStore = create((set, get) => ({
  wishlist: [],
  hasHydrated: false,

  hydrate: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);

      if (json) {
        set({ wishlist: JSON.parse(json) });
      }
    } catch (e) {
      console.error("Failed to hydrate wishlist:", e);
    } finally {
      set({ hasHydrated: true });
    }
  },

  _persist: (wishlist) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist)).catch((e) =>
      console.error("Failed to persist wishlist:", e)
    );
  },

  toggleWishlist: (product) => {
    const { wishlist, _persist } = get();
  
    const exists = wishlist.find(
      (item) => item.id === product.id
    );
  
    const newWishlist = exists
      ? wishlist.filter((item) => item.id !== product.id)
      : [...wishlist, product];
  
    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  addToWishlist: (product) => {
    const { wishlist, _persist } = get();
  
    const exists = wishlist.find(
      (item) => item.id === product.id
    );
  
    if (exists) return;
  
    const newWishlist = [...wishlist, product];
  
    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  removeFromWishlist: (id) => {
    const { wishlist, _persist } = get();
  
    const newWishlist = wishlist.filter(
      (item) => item.id !== id
    );
  
    set({ wishlist: newWishlist });
    _persist(newWishlist);
  },

  clearWishlist: () => {
    set({ wishlist: [] });

    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
