import { useSyncExternalStore } from "react";
import { supabase } from "./auth-store";

// Set this to your deployed backend, e.g. via Expo env var:
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export type AdminApprovalStatus =
  | "idle"
  | "unauthenticated"
  | "requesting"
  | "pending"
  | "approved"
  | "denied"
  | "expired"
  | "error";

type AdminApprovalState = {
  status: AdminApprovalStatus;
  approved: boolean;
  requestId: string | null;
  errorMessage: string | null;
};

export type AdminApprovalRequestResult = {
  ok: boolean;
  message: string;
};

let state: AdminApprovalState = {
  status: "idle",
  approved: false,
  requestId: null,
  errorMessage: null,
};

const listeners = new Set<() => void>();
let pollTimer: ReturnType<typeof setInterval> | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<AdminApprovalState>) {
  state = { ...state, ...patch };
  emit();
}

function stopPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

async function checkApprovalStatus() {
  if (!state.requestId) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin-access/status?requestId=${encodeURIComponent(
        state.requestId
      )}`
    );

    if (!response.ok) {
      // Keep polling silently; temporary network/server issues should not reset the flow.
      return;
    }

    const data = await response.json();

    if (data.status === "approved") {
      setState({ status: "approved", approved: true, errorMessage: null });
      stopPolling();
      return;
    }

    if (data.status === "denied") {
      setState({
        status: "denied",
        approved: false,
        errorMessage: "Approval request was denied.",
      });
      stopPolling();
      return;
    }

    if (state.status !== "pending") {
      setState({ status: "pending" });
    }
  } catch {
    // Network error mid-poll — stay silent and let the next interval retry.
  }
}

function startPolling() {
  stopPolling();
  pollTimer = setInterval(checkApprovalStatus, 3000);
}

export function subscribeAdminApproval(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useAdminApprovalState() {
  return useSyncExternalStore(
    subscribeAdminApproval,
    () => state,
    () => state
  );
}

export async function requestAdminApproval(): Promise<AdminApprovalRequestResult> {
  if (state.status === "requesting" || state.status === "pending") {
    return { ok: true, message: "Approval request already pending." };
  }

  setState({ status: "requesting", errorMessage: null });

  // getUser() (not getSession()) re-validates the token against Supabase Auth
  // rather than trusting whatever is in local storage, which matters here
  // since this gates a privilege-escalation request.
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.email) {
    setState({
      status: "unauthenticated",
      approved: false,
      errorMessage: "You must be signed in to request admin access.",
    });
    return {
      ok: false,
      message: "You must be signed in to request admin access.",
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin-access/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requesterEmail: user.email }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Surface the backend's specific reason (rate_limited, user_not_found, server_misconfigured, etc.)
      const message = data?.message || "Failed to create approval request.";
      setState({ status: "error", approved: false, errorMessage: message });
      return { ok: false, message };
    }

    if (data.status === "approved") {
      setState({
        status: "approved",
        approved: true,
        requestId: data.requestId,
        errorMessage: null,
      });
      return { ok: true, message: data.message || "Already approved." };
    }

    setState({
      status: "pending",
      approved: false,
      requestId: data.requestId,
      errorMessage: null,
    });

    startPolling();
    void checkApprovalStatus();

    return {
      ok: true,
      message:
        data.message || "Approval request created. Awaiting admin approval.",
    };
  } catch (err) {
    const message =
      "Could not reach the server. Check your connection and try again.";
    setState({ status: "error", approved: false, errorMessage: message });
    return { ok: false, message };
  }
}

export function resetAdminApprovalState() {
  stopPolling();
  setState({
    status: "idle",
    approved: false,
    requestId: null,
    errorMessage: null,
  });
}
