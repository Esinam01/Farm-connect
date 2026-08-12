///
/// Type declarations
///

type UserDetails = {
  full_name: string;
  email: string;
  // password: string,
  // confirmPassword: string,
  role: string;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  address: string | null;
  is_verified: boolean | false;
};

export type Product = {
  id: string;
  sellerId: string;
  image: string | null;
  featured: boolean;
  organic: boolean;
  rating: number;
  stock: number;
  name: string;
  description: string | null;
  farm: string | null;
  price: number;
  unit: string;
  category: string | null;
  quantity: number | null;
}

const PLACEHOLDER_IMAGE = require("../assets/images/placeholder.png"); 

///
/// Supabase headers
///
const supabase_headers = {
  "Content-Type": "application/json",
  apikey: `${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
  Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
};

export async function CreateNewUser(userDetails: UserDetails) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_REST_API}/user_profiles`,
    {
      method: "POST",
      headers: {
        ...supabase_headers,
      },
      body: JSON.stringify(userDetails),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to create user", { cause: await response.text() });
  }

  const text = await response.text();
  return text ? JSON.parse(text) : { success: true };
}

/**
 * Sums sold quantity per product from order_items. products.stock only
 * tracks what a seller originally stocked — it's never decremented on sale —
 * so callers need to subtract this from the raw stock column to get what's
 * actually left. Mirrors the same calculation used for the seller dashboard
 * (fetchSellerStats in market-store.ts) so buyers and sellers see consistent
 * numbers.
 */
async function fetchSoldQuantitiesByProduct(): Promise<Record<string, number>> {
  const soldByProduct: Record<string, number> = {};

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_REST_API}/order_items?select=product_id,quantity`,
    {
      method: "GET",
      headers: {
        ...supabase_headers,
      },
    }
  );

  if (!response.ok) {
    // Don't let a failure here block product listings — just fall back to
    // raw stock (i.e. treat nothing as sold) and log for visibility.
    console.error("Failed to fetch order items for stock calculation:", await response.text());
    return soldByProduct;
  }

  const orderItems = await response.json();
  for (const item of orderItems) {
    const productId = item.product_id;
    const sold = item.quantity ?? 0;
    soldByProduct[productId] = (soldByProduct[productId] ?? 0) + sold;
  }

  return soldByProduct;
}

export async function FetchAllProducts(): Promise<Product[]> {
  const query = new URLSearchParams({
    select: [
      "id",
      "seller_id",
      "name",
      "description",
      "price",
      "unit",
      "stock",
      "image_url",
      "is_organic",
      "is_featured",
      "rating",
      "sellers(farm_name,farm_location)",
      "categories(name)",
    ].join(","),
    is_active: "eq.true",
    order: "created_at.desc",
  });

  const [productsResponse, soldByProduct] = await Promise.all([
    fetch(`${process.env.EXPO_PUBLIC_SUPABASE_REST_API}/products?${query}`, {
      method: "GET",
      headers: {
        ...supabase_headers,
      },
    }),
    fetchSoldQuantitiesByProduct(),
  ]);

  if (!productsResponse.ok) {
    throw new Error("Failed to fetch products", {
      cause: await productsResponse.text(),
    });
  }

  const data = await productsResponse.json();

  return data.map(
    (row: any): Product => {
      const rawStock = row.stock ?? 0;
      const sold = soldByProduct[row.id] ?? 0;

      return {
        id: row.id,
        sellerId: row.seller_id,
        name: row.name,
        description: row.description ?? null,
        price: parseFloat(row.price),
        unit: row.unit,
        // Remaining stock = what the seller stocked minus what's sold,
        // floored at 0 so a product never shows negative stock.
        stock: Math.max(0, rawStock - sold),
        image: row.image_url ? { uri: row.image_url } : PLACEHOLDER_IMAGE,
        organic: row.is_organic,
        featured: row.is_featured,
        rating: parseFloat(row.rating),
        farm: row.sellers?.farm_location ?? row.sellers?.farm_name ?? null,
        category: row.categories?.name ?? null,
        quantity: null,
      };
    }
  );
}