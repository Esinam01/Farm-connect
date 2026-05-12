import { useSyncExternalStore } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
};

const state: AuthState = {
  user: null,
  isLoggedIn: false,
  currentRole: null,
  loading: false,
};

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAuthState() {
  return state;
}

export function useUser() {
  return useSyncExternalStore(subscribe, () => state.user, () => state.user);
}

export function useIsLoggedIn() {
  return useSyncExternalStore(subscribe, () => state.isLoggedIn, () => state.isLoggedIn);
}

export function useCurrentRole() {
  return useSyncExternalStore(subscribe, () => state.currentRole, () => state.currentRole);
}

export function useAuthLoading() {
  return useSyncExternalStore(subscribe, () => state.loading, () => state.loading);
}

/**
 * Register a new user with Supabase Auth
 */
export async function registerUser(
  email: string,
  fullName: string,
  password: string,
  role: "buyer" | "seller"
): Promise<User> {
  state.loading = true;
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

    if (error) throw error;
    if (!data.user) throw new Error("Registration failed");

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

    state.user = user;
    state.isLoggedIn = true;
    state.currentRole = role;
    emit();

    return user;
  } catch (error) {
    state.loading = false;
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
  state.loading = true;
  emit();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (!data.user) throw new Error("Login failed");

    const user: User = {
      id: data.user.id,
      email: data.user.email || email,
      fullName: data.user.user_metadata?.full_name || "User",
      role: expectedRole,
      createdAt: new Date(data.user.created_at).getTime(),
      avatarUri: data.user.user_metadata?.avatar_url || null,
      phone: data.user.user_metadata?.phone || "",
      address: data.user.user_metadata?.address || "",
    };

    state.user = user;
    state.isLoggedIn = true;
    state.currentRole = expectedRole;
    state.loading = false;
    emit();

    return user;
  } catch (error) {
    state.loading = false;
    emit();
    throw error;
  }
}

/**
 * Switch role (buyer/seller) without re-authenticating
 */
export function switchRole(newRole: "buyer" | "seller") {
  if (state.user) {
    const updatedUser = { ...state.user, role: newRole };
    state.user = updatedUser;
    state.currentRole = newRole;
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
  if (!state.user) {
    throw new Error("No user is currently signed in");
  }

  state.loading = true;
  emit();

  try {
    const { error } = await supabase.auth.updateUser({
      email: updates.email,
      data: {
        full_name: updates.fullName,
        avatar_url: updates.avatarUri,
        phone: updates.phone,
        address: updates.address,
      },
    });

    if (error) throw error;

    const updatedUser: User = {
      ...state.user,
      fullName: updates.fullName ?? state.user.fullName,
      email: updates.email ?? state.user.email,
      avatarUri: updates.avatarUri ?? state.user.avatarUri,
      phone: updates.phone ?? state.user.phone,
      address: updates.address ?? state.user.address,
    };

    state.user = updatedUser;
    state.loading = false;
    emit();

    return updatedUser;
  } catch (error) {
    state.loading = false;
    emit();
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateCurrentUserPassword(newPassword: string) {
  if (!state.user) {
    throw new Error("No user is currently signed in");
  }

  state.loading = true;
  emit();

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    state.loading = false;
    emit();
  } catch (error) {
    state.loading = false;
    emit();
    throw error;
  }
}

/**
 * Logout user
 */
export async function logout() {
  state.loading = true;
  emit();

  try {
    await supabase.auth.signOut();
    state.user = null;
    state.isLoggedIn = false;
    state.currentRole = null;
    state.loading = false;
    emit();
  } catch (error) {
    state.loading = false;
    emit();
    throw error;
  }
}

/**
 * Grant admin access without requiring email/password
 * Used after admin approval request is granted
 */
export function loginAsAdmin() {
  const adminUser: User = {
    id: `admin_${Date.now()}`,
    email: "admin@farmconnect.app",
    fullName: "Admin User",
    role: "admin",
    createdAt: Date.now(),
    avatarUri: null,
    phone: "",
    address: "",
  };

  state.user = adminUser;
  state.isLoggedIn = true;
  state.currentRole = "admin";
  state.loading = false;
  emit();

  return adminUser;
}
