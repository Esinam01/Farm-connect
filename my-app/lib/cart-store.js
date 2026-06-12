import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "cart-storage";

export const useCartStore = create((set, get) => ({
  cart: [],
  hasHydrated: false,

  hydrate: async () => {
    try {
      const json = await AsyncStorage.getItem(STORAGE_KEY);
      if (json) set({ cart: JSON.parse(json) });
    } catch (e) {
      console.error("Failed to hydrate cart:", e);
    } finally {
      set({ hasHydrated: true });
    }
  },

  _persist: (cart) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cart)).catch((e) =>
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
    set({ cart: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));