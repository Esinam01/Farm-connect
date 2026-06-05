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

export async function FetchAllProducts(): Promise<Product[]> {
  const query = new URLSearchParams({
    select: [
      "id",
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

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_REST_API}/products?${query}`,
    {
      method: "GET",
      headers: {
        ...supabase_headers,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch products", {
      cause: await response.text(),
    });
  }

  const data = await response.json();

  return data.map(
    (row: any): Product => ({
      id: row.id,
      name: row.name,
      description: row.description ?? null,
      price: parseFloat(row.price),
      unit: row.unit,
      stock: row.stock,
      image: row.image_url ? { uri: row.image_url } : PLACEHOLDER_IMAGE,
      organic: row.is_organic,
      featured: row.is_featured,
      rating: parseFloat(row.rating),
      farm: row.sellers?.farm_location ?? row.sellers?.farm_name ?? null,
      category: row.categories?.name ?? null,
      quantity: null,
    })
  );
}
