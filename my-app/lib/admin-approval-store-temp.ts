import { useSyncExternalStore } from "react";
import { supabase } from "./auth-store";

export type AdminApprovalStatus =
  | "idle"
  | "unauthenticated"
  | "requesting"
  | "pending"
  | "approved"
  | "denied"
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

  const { data, error } = await supabase
    .from("admin_approval_requests")
    .select("status")
    .eq("id", state.requestId)
    .single();

  if (error || !data) {
    // Keep polling silently; temporary network/read issues should not reset the flow.
    return;
  }

  if (data.status === "approved") {
    setState({ status: "approved", approved: true, errorMessage: null });
    stopPolling();
    return;
  }

  if (data.status === "denied") {
    setState({ status: "denied", approved: false, errorMessage: "Approval request was denied." });
    stopPolling();
    return;
  }

  if (state.status !== "pending") {
    setState({ status: "pending" });
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

  if (authError || !user) {
    setState({
      status: "unauthenticated",
      approved: false,
      errorMessage: "You must be signed in to request admin access.",
    });
    return { ok: false, message: "You must be signed in to request admin access." };
  }

  const { data, error } = await supabase
    .from("admin_approval_requests")
    .insert({ status: "pending", source: "farmconnect-app", user_id: user.id })
    .select("id, status")
    .single();

  if (error || !data) {
    setState({
      status: "error",
      approved: false,
      errorMessage: "Failed to create approval request.",
    });
    return { ok: false, message: "Failed to create approval request." };
  }

  const approvedNow = data.status === "approved";

  setState({
    status: approvedNow ? "approved" : "pending",
    approved: approvedNow,
    requestId: data.id,
    errorMessage: null,
  });

  if (!approvedNow) {
    startPolling();
    void checkApprovalStatus();
  }

  return {
    ok: true,
    message: approvedNow ? "Already approved." : "Approval request created. Awaiting admin approval.",
  };
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