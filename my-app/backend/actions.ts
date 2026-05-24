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

const supabase_headers = {
  "Content-Type": "application/json",
  apikey: `${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
  Authorization: `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
};

export default async function CreateNewUser(userDetails: UserDetails) {
  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/user_profiles`,
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
