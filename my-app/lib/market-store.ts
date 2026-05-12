import { useSyncExternalStore } from "react";

export type MarketProduct = {
  id: number;
  name: string;
  rating: number;
  stock: number;
  description: string;
  farm: string;
  price: number;
  unit: string;
  image: string;
  featured: boolean;
  organic: boolean;
  category: string;
};

type MarketState = {
  products: MarketProduct[];
  buyerSignedUp: boolean;
};

type MarketPatch = Partial<MarketProduct>;

const initialProducts: MarketProduct[] = [
  { id: 1, name: "Organic Tomatoes", rating: 4.8, stock: 150, description: "Fresh, organic tomatoes picked daily", farm: "Green Valley Farm, California", price: 4.99, unit: "/lb", image: "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300&fit=crop", featured: true, organic: true, category: "Vegetables" },
  { id: 2, name: "Fresh Apples", rating: 4.9, stock: 200, description: "Crisp and sweet apples from local orchards", farm: "Sunrise Orchards, Washington", price: 3.49, unit: "/lb", image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&fit=crop", featured: true, organic: true, category: "Fruits" },
  { id: 3, name: "Free-Range Eggs", rating: 5, stock: 120, description: "Organic eggs from happy free range chickens", farm: "Hilltop Farm, Vermont", price: 6.99, unit: "/dozen", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&fit=crop", featured: true, organic: true, category: "Dairy" },
  { id: 4, name: "Honey", rating: 4.9, stock: 95, description: "Raw, unfiltered local honey", farm: "Prairie Fields, Kansas", price: 12.99, unit: "/jar", image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&fit=crop", featured: true, organic: true, category: "Grains" },
  { id: 5, name: "Farm Fresh Milk", rating: 4.7, stock: 75, description: "Fresh whole milk from grass fed cows", farm: "Happy Cow Dairy, Wisconsin", price: 5.99, unit: "/gallon", image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&fit=crop", featured: false, organic: true, category: "Dairy" },
  { id: 6, name: "Sweet Corn", rating: 4.6, stock: 180, description: "Sun-ripened sweet corn, harvested fresh", farm: "Sunrise Orchards, Washington", price: 0.99, unit: "/ear", image: "https://images.unsplash.com/photo-1601593346740-925612772716?w=300&fit=crop", featured: false, organic: false, category: "Vegetables" },
  { id: 7, name: "Wild Blueberries", rating: 4.8, stock: 60, description: "Hand-picked wild blueberries, antioxidant-rich", farm: "Blue Ridge Farm, Maine", price: 8.49, unit: "/pint", image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&fit=crop", featured: false, organic: true, category: "Fruits" },
  { id: 8, name: "Whole Wheat Flour", rating: 4.5, stock: 90, description: "Stone-ground whole wheat flour, nutrient-dense", farm: "Prairie Fields, Kansas", price: 4.29, unit: "/bag", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&fit=crop", featured: false, organic: false, category: "Grains" },
  { id: 1001, name: "Organic Tomatoes", rating: 4.7, stock: 150, description: "Fresh, organic tomatoes picked daily", farm: "Green Valley Farm", price: 4.99, unit: "/lb", image: "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300&fit=crop", featured: false, organic: true, category: "Vegetables" },
  { id: 1002, name: "Mixed Vegetables", rating: 4.6, stock: 80, description: "A fresh mix of seasonal vegetables", farm: "Sunrise Growers", price: 8.99, unit: "/basket", image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop", featured: false, organic: true, category: "Vegetables" },
];

const state: MarketState = {
  products: initialProducts,
  buyerSignedUp: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMarketState() {
  return state;
}

export function useMarketProducts() {
  return useSyncExternalStore(subscribe, () => state.products, () => state.products);
}

export function useBuyerSignedUp() {
  return useSyncExternalStore(subscribe, () => state.buyerSignedUp, () => state.buyerSignedUp);
}

export function addMarketProduct(product: MarketProduct) {
  state.products = [...state.products, product];
  emit();
}

export function updateMarketProduct(id: number, patch: MarketPatch) {
  state.products = state.products.map((product) =>
    product.id === id ? { ...product, ...patch } : product
  );
  emit();
}

export function deleteMarketProduct(id: number) {
  state.products = state.products.filter((product) => product.id !== id);
  emit();
}

export function setBuyerSignedUp(value: boolean) {
  state.buyerSignedUp = value;
  emit();
}

export function nextMarketProductId() {
  return Date.now();
}
