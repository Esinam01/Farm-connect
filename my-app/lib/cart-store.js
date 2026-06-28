import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { subscribe as subscribeToAuth, getAuthState } from "../lib/auth-store";

const storageKey = (userId) =>
  userId ? `cart-storage-${userId}` : "cart-storage-guest";

export const useCartStore = create((set, get) => ({
  cart: [],
  hasHydrated: false,

  // Call this once on app start — listens to auth changes and reloads cart
  init: () => {
    const load = async () => {
      const { user } = getAuthState();
      const key = storageKey(user?.id);
      try {
        const json = await AsyncStorage.getItem(key);
        set({ cart: json ? JSON.parse(json) : [], hasHydrated: true });
      } catch (e) {
        console.error("Failed to hydrate cart:", e);
        set({ hasHydrated: true });
      }
    };

    load(); // load immediately for current session

    // Reload cart whenever auth state changes (login/logout/switch)
    const unsubscribe = subscribeToAuth(load);
    return unsubscribe; // call this to clean up if needed
  },

  hydrate: async () => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    try {
      const json = await AsyncStorage.getItem(key);
      if (json) set({ cart: JSON.parse(json) });
    } catch (e) {
      console.error("Failed to hydrate cart:", e);
    } finally {
      set({ hasHydrated: true });
    }
  },

  _persist: (cart) => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    AsyncStorage.setItem(key, JSON.stringify(cart)).catch((e) =>
      console.error("Failed to persist cart:", e)
    );
  },

  addToCart: (product) => {
    const { cart, _persist } = get();
    const existing = cart.find((i) => i.id === product.id);
    const newCart = existing
      ? cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
      : [...cart, { ...product, qty: 1 }];
    set({ cart: newCart });
    _persist(newCart);
  },

  updateQty: (id, qty) => {
    const { cart, _persist } = get();
    const newCart =
      qty <= 0
        ? cart.filter((i) => i.id !== id)
        : cart.map((i) => (i.id === id ? { ...i, qty } : i));
    set({ cart: newCart });
    _persist(newCart);
  },

  removeFromCart: (id) => {
    const { cart, _persist } = get();
    const newCart = cart.filter((i) => i.id !== id);
    set({ cart: newCart });
    _persist(newCart);
  },

  clearCart: () => {
    const { user } = getAuthState();
    const key = storageKey(user?.id);
    set({ cart: [] });
    AsyncStorage.removeItem(key).catch(() => {});
  },
}));
