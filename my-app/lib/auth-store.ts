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
  supabase ? "READY" : "MISSING CREDENTIALS"
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
    () => state.user
  );
}

export function useIsLoggedIn() {
  return useSyncExternalStore(
    subscribe,
    () => state.isLoggedIn,
    () => state.isLoggedIn
  );
}

export function useCurrentRole() {
  return useSyncExternalStore(
    subscribe,
    () => state.currentRole,
    () => state.currentRole
  );
}

export function useAuthLoading() {
  return useSyncExternalStore(
    subscribe,
    () => state.loading,
    () => state.loading
  );
}

export function useAuthInitialized() {
  return useSyncExternalStore(
    subscribe,
    () => state.initialized,
    () => state.initialized
  );
}

export const useAuthStore = {
  useState: () =>
    useSyncExternalStore(
      subscribe,
      () => state,
      () => state
    ),
};

/**
 * Register a new user with Supabase Auth
 */
export async function registerUser(
  email: string,
  fullName: string,
  password: string,
  role: "buyer" | "seller"
): Promise<User> {
  console.log("Attempting to register user:", email, role);

  if (!supabase) {
    throw new Error(
      "Supabase is not configured. Please add your real URL and API Key to your .env file."
    );
  }

  state = { ...state, loading: true };
  emit();

  try {
    // Register user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
      },
    });

    if (error) {
      console.error("Signup Error (signUp):", error.message);
      throw error;
    }
    if (!data.user) throw new Error("Registration failed");

    console.log(
      "Signup successful, ensuring profile exists for ID:",
      data.user.id
    );

    // 2. Ensure the profile exists in the public.user_profiles table
    // We try calling an RPC first if you've enabled it in Supabase,
    // otherwise fallback to a direct insert with 'onConflict' logic handled by the trigger
    const { error: profileError } = await supabase.rpc(
      "create_profile_for_user",
      {
        user_id: data.user.id,
        user_email: email,
        user_full_name: fullName,
        user_role: role,
      }
    );

    if (profileError) {
      console.warn(
        "RPC profile creation failed (might be because trigger handled it):",
        profileError.message
      );

      // Fallback: Direct insert if RPC is not available
      const { error: insertError } = await supabase
        .from("user_profiles")
        .insert([{ id: data.user.id, email, full_name: fullName, role }])
        .select();

      if (insertError && !insertError.message.includes("already exists")) {
        console.error(
          "Manual profile insertion also failed:",
          insertError.message
        );
      }
    }

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      fullName,
      role,
      createdAt: Date.now(),
      avatarUri: null,
      phone: "",
      address: "",
    };

    console.log("Final Registered User Object:", user);
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
  expectedRole: "buyer" | "seller"
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

    state = { ...state, loading: false };
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
export async function updateCurrentUserPassword(currentPassword: string, newPassword: string) {
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
    }
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

  // 2. Listen for future changes
  supabase.auth.onAuthStateChange(
    (event: AuthChangeEvent, session: Session | null) => {
      handleAuthState(session);
    }
  );
}

// Auto-init on load
initAuth();
