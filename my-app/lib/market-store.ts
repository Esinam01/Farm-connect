import { useSyncExternalStore } from "react";
import { supabase } from "./auth-store";

export type MarketProduct = {
  id: string;
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
  category: string; // resolved name, for display only
  categoryId: number; // FK value — required on writes
};

export type Category = {
  id: number;
  name: string;
};

export type OrderItem = {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  priceAtTime: number;
  sellerId: string;
};

export type Order = {
  id: string;
  buyerId: string;
  totalAmount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: number;
  items?: OrderItem[];
};

type MarketState = {
  products: MarketProduct[];
  categories: Category[];
  buyerSignedUp: boolean;
};

type MarketPatch = Partial<MarketProduct>;

// const initialProducts: MarketProduct[] = [
//   {
//     id: "1",
//     name: "Organic Tomatoes",
//     rating: 4.8,
//     stock: 150,
//     description: "Fresh, organic tomatoes picked daily",
//     farm: "Green Valley Farm, California",
//     price: 4.99,
//     unit: "/lb",
//     image:
//       "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300&fit=crop",
//     featured: true,
//     organic: true,
//     category: "Vegetables",
//   },
//   {
//     id: "2",
//     name: "Fresh Apples",
//     rating: 4.9,
//     stock: 200,
//     description: "Crisp and sweet apples from local orchards",
//     farm: "Sunrise Orchards, Washington",
//     price: 3.49,
//     unit: "/lb",
//     image:
//       "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=300&fit=crop",
//     featured: true,
//     organic: true,
//     category: "Fruits",
//   },
//   {
//     id: "3",
//     name: "Free-Range Eggs",
//     rating: 5,
//     stock: 120,
//     description: "Organic eggs from happy free range chickens",
//     farm: "Hilltop Farm, Vermont",
//     price: 6.99,
//     unit: "/dozen",
//     image:
//       "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=300&fit=crop",
//     featured: true,
//     organic: true,
//     category: "Dairy",
//   },
//   {
//     id: "4",
//     name: "Honey",
//     rating: 4.9,
//     stock: 95,
//     description: "Raw, unfiltered local honey",
//     farm: "Prairie Fields, Kansas",
//     price: 12.99,
//     unit: "/jar",
//     image:
//       "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&fit=crop",
//     featured: true,
//     organic: true,
//     category: "Grains",
//   },
//   {
//     id: "5",
//     name: "Farm Fresh Milk",
//     rating: 4.7,
//     stock: 75,
//     description: "Fresh whole milk from grass fed cows",
//     farm: "Happy Cow Dairy, Wisconsin",
//     price: 5.99,
//     unit: "/gallon",
//     image:
//       "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&fit=crop",
//     featured: false,
//     organic: true,
//     category: "Dairy",
//   },
//   {
//     id: "6",
//     name: "Sweet Corn",
//     rating: 4.6,
//     stock: 180,
//     description: "Sun-ripened sweet corn, harvested fresh",
//     farm: "Sunrise Orchards, Washington",
//     price: 0.99,
//     unit: "/ear",
//     image:
//       "https://images.unsplash.com/photo-1601593346740-925612772716?w=300&fit=crop",
//     featured: false,
//     organic: false,
//     category: "Vegetables",
//   },
//   {
//     id: "7",
//     name: "Wild Blueberries",
//     rating: 4.8,
//     stock: 60,
//     description: "Hand-picked wild blueberries, antioxidant-rich",
//     farm: "Blue Ridge Farm, Maine",
//     price: 8.49,
//     unit: "/pint",
//     image:
//       "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=300&fit=crop",
//     featured: false,
//     organic: true,
//     category: "Fruits",
//   },
//   {
//     id: "8",
//     name: "Whole Wheat Flour",
//     rating: 4.5,
//     stock: 90,
//     description: "Stone-ground whole wheat flour, nutrient-dense",
//     farm: "Prairie Fields, Kansas",
//     price: 4.29,
//     unit: "/bag",
//     image:
//       "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&fit=crop",
//     featured: false,
//     organic: false,
//     category: "Grains",
//   },
//   {
//     id: "1001",
//     name: "Organic Tomatoes",
//     rating: 4.7,
//     stock: 150,
//     description: "Fresh, organic tomatoes picked daily",
//     farm: "Green Valley Farm",
//     price: 4.99,
//     unit: "/lb",
//     image:
//       "https://images.unsplash.com/photo-1546470427-227c7369a9b9?w=300&fit=crop",
//     featured: false,
//     organic: true,
//     category: "Vegetables",
//   },
//   {
//     id: "1002",
//     name: "Mixed Vegetables",
//     rating: 4.6,
//     stock: 80,
//     description: "A fresh mix of seasonal vegetables",
//     farm: "Sunrise Growers",
//     price: 8.99,
//     unit: "/basket",
//     image:
//       "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&fit=crop",
//     featured: false,
//     organic: true,
//     category: "Vegetables",
//   },
// ];

let state: MarketState = {
  products: [],
  buyerSignedUp: false,
  categories: [],
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
  return useSyncExternalStore(
    subscribe,
    () => state.products,
    () => state.products
  );
}

/**
 * Fetch products from Supabase
 */

export async function fetchCategories() {
  if (!supabase) return;
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) throw error;
    state = { ...state, categories: data || [] };
    emit();
  } catch (error) {
    console.error("Error fetching categories:", error);
  }
}

export function useCategories() {
  return useSyncExternalStore(
    subscribe,
    () => state.categories,
    () => state.categories
  );
}

export async function fetchProducts() {
  if (!supabase) {
    console.warn(
      "Market Store: Supabase is not configured. Cannot fetch products."
    );
    return;
  }
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), sellers(farm_name, farm_location)")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      // Map database schema to frontend type
      const dbProducts: MarketProduct[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        rating: Number(item.rating) || 0,
        stock: item.stock || 0,
        description: item.description || "",
        farm: item.sellers?.farm_name || "Unknown Farm",
        price: Number(item.price),
        unit: item.unit,
        image: item.image_url || "",
        featured: item.is_featured || false,
        organic: item.is_organic || false,
        category: item.categories?.name || "Uncategorized",
        categoryId: item.category_id,
      }));

      // Combine with featured hardcoded products if desired, or just use DB
      state = { ...state, products: dbProducts };
      emit();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    // Fallback to initialProducts is already handled by state initialization
  }
}

/**
 * Fetch products for a specific seller from Supabase
 */
export async function fetchSellerProducts(sellerId: string) {
  if (!supabase) {
    console.warn(
      "Market Store: Supabase is not configured. Cannot fetch seller products."
    );
    return [];
  }
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, categories(name), sellers(farm_name, farm_location)")
      .eq("seller_id", sellerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data) {
      const dbProducts: MarketProduct[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        rating: Number(item.rating) || 0,
        stock: item.stock || 0,
        description: item.description || "",
        farm: item.sellers?.farm_name || "Unknown Farm",
        price: Number(item.price),
        unit: item.unit,
        image: item.image_url || "",
        featured: item.is_featured || false,
        organic: item.is_organic || false,
        category: item.categories?.name || "Uncategorized",
        categoryId: item.category_id,
      }));

      // We don't replace the whole market state here,
      // but return the products for the component to use.
      return dbProducts;
    }
    return [];
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return [];
  }
}

export function useBuyerSignedUp() {
  return useSyncExternalStore(
    subscribe,
    () => state.buyerSignedUp,
    () => state.buyerSignedUp
  );
}

export async function addMarketProduct(
  product: Omit<MarketProduct, "id" | "category" | "farm">,
  sellerId: string
) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please add your real URL and API Key to your .env file."
    );
  }
  try {
    const { data, error } = await supabase
      .from("products")
      .insert([
        {
          name: product.name,
          description: product.description,
          price: product.price,
          unit: product.unit,
          category_id: product.categoryId,
          stock: product.stock,
          image_url: product.image,
          is_organic: product.organic,
          is_featured: product.featured,
          rating: product.rating,
          seller_id: sellerId,
        },
      ])
      .select("*, categories(name), sellers(farm_name, farm_location)")
      .single();

    if (error) {
      if (error.code === "23505") {
        throw new Error("You already have a product with this name.");
      }
      throw error;
    }

    const typedData = data as any;
    if (typedData) {
      const newProduct: MarketProduct = {
        id: typedData.id,
        name: typedData.name,
        rating: Number(typedData.rating) || 0,
        stock: typedData.stock,
        description: typedData.description,
        farm: typedData.sellers?.farm_name || "Unknown Farm",
        price: Number(typedData.price),
        unit: typedData.unit,
        image: typedData.image_url,
        featured: typedData.is_featured,
        organic: typedData.is_organic,
        category: typedData.categories?.name || "Uncategorized",
        categoryId: typedData.category_id,
      };
      state = { ...state, products: [newProduct, ...state.products] };
      emit();
    }
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
}

export async function updateMarketProduct(id: string, patch: MarketPatch) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please add your real URL and API Key to your .env file."
    );
  }
  try {
    const { error } = await supabase
      .from("products")
      .update({
        name: patch.name,
        description: patch.description,
        price: patch.price,
        unit: patch.unit,
        category_id: patch.categoryId,
        stock: patch.stock,
        image_url: patch.image,
        is_organic: patch.organic,
        is_featured: patch.featured,
      })
      .eq("id", id);

    if (error) throw error;

    state = {
      ...state,
      products: state.products.map((product) =>
        product.id === id ? { ...product, ...patch } : product
      ),
    };
    emit();
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
}

export async function deleteMarketProduct(id: string) {
  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please add your real URL and API Key to your .env file."
    );
  }
  try {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;

    state = {
      ...state,
      products: state.products.filter((product) => product.id !== id),
    };
    emit();
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
}

export function setBuyerSignedUp(value: boolean) {
  state = { ...state, buyerSignedUp: value };
  emit();
}

/**
 * @deprecated Product ids now come from the database (uuid primary key).
 * This is unused but kept to avoid breaking existing imports.
 */
export function nextMarketProductId() {
  return Date.now();
}

/**
 * Place an order
 */
export async function placeOrder(
  buyerId: string,
  items: {
    productId: number;
    quantity: number;
    price: number;
    sellerId: string;
    productName: string;
  }[],
  total: number
): Promise<Order | undefined> {
  if (!supabase) return undefined;

  try {
    // 1. Create the order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert([
        {
          buyer_id: buyerId,
          total_amount: total,
          status: "pending",
        },
      ])
      .select()
      .single();

    if (orderError) throw orderError;

    // 2. Create the order items
    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      seller_id: item.sellerId,
      quantity: item.quantity,
      price_at_time: item.price,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Map the raw (snake_case) DB row to the typed Order shape so callers
    // relying on `Order`'s camelCase fields (buyerId, totalAmount, createdAt)
    // don't silently get `undefined`.
    const typedOrder = order as any;
    return {
      id: typedOrder.id,
      buyerId: typedOrder.buyer_id,
      totalAmount: Number(typedOrder.total_amount),
      status: typedOrder.status,
      createdAt: new Date(typedOrder.created_at).getTime(),
      items: items.map((item, index) => ({
        id: index, // order_items insert above doesn't return ids; placeholder
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        priceAtTime: item.price,
        sellerId: item.sellerId,
      })),
    };
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
}

/**
 * Fetch orders for a buyer
 */
export async function fetchBuyerOrders(buyerId: string): Promise<Order[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          products (name)
        )
      `
      )
      .eq("buyer_id", buyerId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data as any[]).map((o) => ({
      id: o.id,
      buyerId: o.buyer_id,
      totalAmount: Number(o.total_amount),
      status: o.status,
      createdAt: new Date(o.created_at).getTime(),
      // Guard against null/undefined order_items (e.g. RLS edge cases)
      // instead of assuming it's always an array.
      items: (o.order_items || []).map((oi: any) => ({
        id: oi.id,
        productId: oi.product_id,
        productName: oi.products?.name || "Unknown Product",
        quantity: oi.quantity,
        priceAtTime: Number(oi.price_at_time),
        sellerId: oi.seller_id,
      })),
    }));
  } catch (error) {
    console.error("Error fetching buyer orders:", error);
    return [];
  }
}
