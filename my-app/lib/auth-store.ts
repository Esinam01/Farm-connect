import { useSyncExternalStore } from "react";
import { createClient, AuthChangeEvent, Session } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("Supabase credentials not detected in process.env");
}

export const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          storage: Platform.OS === "web" ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : (null as any);

console.log(
  "Auth Store Initialized. Supabase Client:",
  supabase ? "READY" : "MISSING CREDENTIALS",
);

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: "buyer" | "seller" | "admin";
  createdAt: number;
  avatarUri?: string | null;
  phone?: string;
  address?: string;
};

type AuthState = {
  user: User | null;
  isLoggedIn: boolean;
  currentRole: "buyer" | "seller" | "admin" | null;
  loading: boolean;
  initialized: boolean;
};

let state: AuthState = {
  user: null,
  isLoggedIn: false,
  currentRole: null,
  loading: false,
  initialized: false,
};

const listeners = new Set<() => void>();
let authSubscription: any = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function handleAuthState(session: Session | null) {
  if (session?.user) {
    state = {
      ...state,
      isLoggedIn: true,
      initialized: true,
      user: {
        id: session.user.id,
        email: session.user.email || "",
        fullName: session.user.user_metadata?.full_name || "User",
        role: session.user.user_metadata?.role || "buyer",
        createdAt: new Date(session.user.created_at).getTime(),
        avatarUri: session.user.user_metadata?.avatar_url || null,
        phone: session.user.user_metadata?.phone || "",
        address: session.user.user_metadata?.address || "",
      },
      currentRole: session.user.user_metadata?.role || "buyer",
    };
  } else {
    state = {
      ...state,
      user: null,
      isLoggedIn: false,
      currentRole: null,
      initialized: true,
    };
  }
  emit();
}

export async function refreshUser(): Promise<User | null> {
  if (!supabase) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    state = { ...state, user: null, isLoggedIn: false, currentRole: null };
    emit();
    return null;
  }

  const { data: profile, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.warn("refreshUser: profile fetch failed:", error.message);
    return state.user;
  }

  const updatedUser: User = {
    id: session.user.id,
    email: session.user.email || "",
    fullName:
      profile?.full_name || session.user.user_metadata?.full_name || "User",
    role: profile?.role || session.user.user_metadata?.role || "buyer",
    createdAt: new Date(session.user.created_at).getTime(),
    avatarUri:
      profile?.avatar_url ?? session.user.user_metadata?.avatar_url ?? null,
    phone: profile?.phone ?? session.user.user_metadata?.phone ?? "",
    address: profile?.address ?? session.user.user_metadata?.address ?? "",
  };

  state = {
    ...state,
    user: updatedUser,
    currentRole: updatedUser.role,
    isLoggedIn: true,
  };
  emit();
  return updatedUser;
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState() {
  return state;
}

export function useUser() {
  return useSyncExternalStore(
    subscribe,
    () => state.user,
    () => state.user,
  );
}

export function useIsLoggedIn() {
  return useSyncExternalStore(
    subscribe,
    () => state.isLoggedIn,
    () => state.isLoggedIn,
  );
}

export function useCurrentRole() {
  return useSyncExternalStore(
    subscribe,
    () => state.currentRole,
    () => state.currentRole,
  );
}

export function useAuthLoading() {
  return useSyncExternalStore(
    subscribe,
    () => state.loading,
    () => state.loading,
  );
}

export function useAuthInitialized() {
  return useSyncExternalStore(
    subscribe,
    () => state.initialized,
    () => state.initialized,
  );
}

export const useAuthStore = {
  useState: () =>
    useSyncExternalStore(
      subscribe,
      () => state,
      () => state,
    ),
};

/**
 * Register a new user with Supabase Auth
 */
export async function registerUser(
  email: string,
  fullName: string,
  password: string,
  role: "buyer" | "seller",
): Promise<User> {
  console.log("Attempting to register user:", email, role);

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please add your real URL and API Key to your .env file.",
    );
  }

  state = { ...state, loading: true };
  emit();

  try {
    // Check if a profile already exists for this email (e.g. buyer upgrading to seller)
    const { data: existingProfile, error: existingProfileError } =
      await supabase
        .from("user_profiles")
        .select("id, role, full_name")
        .eq("email", email)
        .maybeSingle();

    if (existingProfileError) {
      console.warn(
        "Error checking existing profile:",
        existingProfileError.message,
      );
    }

    let userId: string;
    let resolvedFullName = fullName;

    if (
      existingProfile &&
      existingProfile.role === "buyer" &&
      role === "seller"
    ) {
      // Existing buyer wants to become a seller too.
      // Don't call signUp (email already exists) — verify it's really them instead.
      console.log("Existing buyer upgrading to seller, verifying password...");

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError || !signInData.user) {
        console.error("Password verification failed:", signInError?.message);
        throw new Error("Incorrect password for existing account.");
      }

      userId = signInData.user.id;
      resolvedFullName = existingProfile.full_name || fullName;

      const { error: updateError } = await supabase
        .from("user_profiles")
        .update({ role: "seller" })
        .eq("id", userId);

      if (updateError) {
        console.error(
          "Failed to update profile role to seller:",
          updateError.message,
        );
        throw updateError;
      }

      const { error: metaError } = await supabase.auth.updateUser({
        data: { role: "seller" },
      });
      if (metaError) {
        console.error(
          "Failed to sync role to auth metadata:",
          metaError.message,
        );
      }

      await refreshUser();
    } else {
      // Fresh registration — normal signUp flow
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });

      if (error) {
        console.error("Signup Error (signUp):", error.message);
        throw error;
      }
      if (!data.user) throw new Error("Registration failed");

      userId = data.user.id;

      console.log("Signup successful, ensuring profile exists for ID:", userId);

      const { error: profileError } = await supabase.rpc(
        "create_profile_for_user",
        {
          user_id: userId,
          user_email: email,
          user_full_name: fullName,
          user_role: role,
        },
      );

      if (profileError) {
        console.warn(
          "RPC profile creation failed (might be because trigger handled it):",
          profileError.message,
        );

        const { error: insertError } = await supabase
          .from("user_profiles")
          .insert([{ id: userId, email, full_name: fullName, role }])
          .select();

        if (insertError && !insertError.message.includes("already exists")) {
          console.error(
            "Manual profile insertion also failed:",
            insertError.message,
          );
        }
      }
    }

    if (role === "seller") {
      const { error: sellerError } = await supabase
        .from("sellers")
        .insert([{ id: userId, farm_name: resolvedFullName }]);

      if (sellerError && !sellerError.message.includes("duplicate")) {
        console.error("Failed to create seller profile:", sellerError.message);
      }
    }

    const user: User = {
      id: userId,
      email,
      fullName: resolvedFullName,
      role,
      createdAt: Date.now(),
      avatarUri: null,
      phone: "",
      address: "",
    };

    state = { ...state, loading: false };
    emit();

    return user;
  } catch (error: any) {
    console.error("registerUser encountered an error:", error.message || error);
    state = { ...state, loading: false };
    emit();
    throw error;
  }
}

/**
 * Login user with Supabase Auth
 */
export async function loginUser(
  email: string,
  password: string,
  expectedRole: "buyer" | "seller",
): Promise<User> {
  state = { ...state, loading: true };
  emit();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Login Error (signInWithPassword):", error.message);
      throw error;
    }
    if (!data.user) throw new Error("Login failed");

    console.log("Login successful");

    // Fetch the profile from our public table
    const { data: profile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.warn("Profile fetch error (non-fatal):", profileError.message);
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      fullName:
        profile?.full_name || data.user.user_metadata?.full_name || "User",
      role: profile?.role || expectedRole,
      createdAt: new Date(data.user.created_at).getTime(),
      avatarUri:
        profile?.avatar_url || data.user.user_metadata?.avatar_url || null,
      phone: profile?.phone || data.user.user_metadata?.phone || "",
      address: profile?.address || data.user.user_metadata?.address || "",
    };

    state = {
      ...state,
      user,
      currentRole: user.role,
      isLoggedIn: true,
      loading: false,
    };
    emit();

    return user;
  } catch (error: any) {
    console.error("loginUser encountered an error:", error.message || error);
    state = { ...state, loading: false };
    emit();
    throw error;
  }
}

/**
 * Switch role (buyer/seller) without re-authenticating
 */
export function switchRole(newRole: "buyer" | "seller") {
  if (state.user) {
    const updatedUser: User = { ...state.user, role: newRole };
    state = {
      ...state,
      user: updatedUser,
      currentRole: newRole,
    };
    emit();
  }
}

/**
 * Update current user's profile
 */
export async function updateCurrentUserProfile(updates: {
  fullName?: string;
  email?: string;
  avatarUri?: string | null;
  phone?: string;
  address?: string;
}) {
  const currentUser = state.user;
  if (!currentUser) {
    throw new Error("No user is currently signed in");
  }

  state = { ...state, loading: true };
  emit();

  try {
    const { error: authError } = await supabase.auth.updateUser({
      email: updates.email,
      data: {
        full_name: updates.fullName,
        avatar_url: updates.avatarUri,
        phone: updates.phone,
        address: updates.address,
      },
    });

    if (authError) throw authError;

    // ALSO update the public.user_profiles table
    const { error: dbError } = await supabase
      .from("user_profiles")
      .update({
        full_name: updates.fullName,
        avatar_url: updates.avatarUri,
        phone: updates.phone,
        address: updates.address,
      })
      .eq("id", currentUser.id);

    if (dbError) throw dbError;

    // ALSO update the public.sellers table if this user is a seller
    if (currentUser.role === "seller" && updates.address !== undefined) {
      const { error: sellerError } = await supabase
        .from("sellers")
        .update({
          farm_location: updates.address,
        })
        .eq("id", currentUser.id);

      if (sellerError) throw sellerError;
    }

    const updatedUser: User = {
      ...currentUser,
      fullName: updates.fullName ?? currentUser.fullName,
      email: updates.email ?? currentUser.email,
      avatarUri: updates.avatarUri ?? currentUser.avatarUri,
      phone: updates.phone ?? currentUser.phone,
      address: updates.address ?? currentUser.address,
    };

    state = {
      ...state,
      user: updatedUser,
      loading: false,
    };
    emit();

    return updatedUser;
  } catch (error) {
    state = { ...state, loading: false };
    emit();
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateCurrentUserPassword(
  currentPassword: string,
  newPassword: string,
) {
  // Re-authenticate with current password first
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: state.user!.email,
    password: currentPassword,
  });

  if (signInError) throw new Error("Current password is incorrect.");

  // Now safe to update
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

/**
 * Logout user
 */
export async function logout() {
  try {
    state = {
      ...state,
      user: null,
      isLoggedIn: false,
      currentRole: null,
      initialized: true,
    };

    emit();

    await supabase.auth.signOut({ scope: "local" });
  } catch (error) {
    console.error(error);
    throw error;
  }
}
// No longer using mock admin login

//Delete user account
export async function deleteAccount() {
  const userId = state.user?.id;
  if (!userId) throw new Error("No user found");

  if (state.user?.role === "seller") {
    await supabase.from("sellers").delete().eq("id", userId);
  }

  await supabase.from("user_profiles").delete().eq("id", userId);

  const { error } = await supabase.rpc("delete_user");
  if (error) throw error;

  state = {
    ...state,
    user: null,
    isLoggedIn: false,
    currentRole: null,
    initialized: true,
  };
  emit();

  await supabase.auth.signOut({ scope: "local" });
}

/**
 * Mock login for development bypass (when Supabase rate limits are hit)
 */
export async function mockLogin(role: "buyer" | "seller") {
  console.log("Using Mock Login as:", role);
  state = { ...state, loading: true };
  emit();

  // Artificial delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  const user: User = {
    id: "mock-user-id",
    email: `mock-${role}@example.com`,
    fullName: `Mock ${role.charAt(0).toUpperCase() + role.slice(1)}`,
    role: role,
    createdAt: Date.now(),
    avatarUri: null,
    phone: "123-456-7890",
    address: "123 Farm Lane",
  };

  state = {
    ...state,
    user,
    isLoggedIn: true,
    currentRole: role,
    loading: false,
    initialized: true,
  };
  emit();
  return user;
}

/**
 * Initialize auth listener to handle session persistence
 */
export function initAuth() {
  if (!supabase) {
    console.error("Auth Store: Supabase client is null. Check your .env file.");
    // state = { ...state, initialized: true, loading: false };
    emit();
    return;
  }

  if (authSubscription) return;

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      handleAuthState(session);
    },
  );

  authSubscription = subscription;

  // Safety timeout: if auth takes more than 5 seconds, mark as initialized anyway
  const timeout = setTimeout(() => {
    if (!state.initialized) {
      console.warn("Auth initialization timed out. Proceeding as guest.");
      state = { ...state, initialized: true, loading: false };
      emit();
    }
  }, 5000);

  // 1. Initial session check
  supabase.auth
    .getSession()
    .then(({ data: { session } }: { data: { session: Session | null } }) => {
      handleAuthState(session);
    });
}

export async function requestPasswordReset(email: string) {
  const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json(); // { ok: true, message: "..." }
}

// Auto-init on load
initAuth();
