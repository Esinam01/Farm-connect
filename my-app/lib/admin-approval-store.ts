import { useSyncExternalStore } from "react";

export type AdminApprovalStatus =
  | "idle"
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
  emailed?: boolean;
  fallback?: boolean;
  approveUrl?: string;
};

const APPROVER_EMAIL = "marydoo211@gmail.com";
const API_BASE_URL = process.env.EXPO_PUBLIC_ADMIN_APPROVAL_API_URL || "";

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
  if (!state.requestId || !API_BASE_URL) return;

  try {
    const response = await fetch(
      `${API_BASE_URL}/admin-access/status?requestId=${encodeURIComponent(state.requestId)}`
    );

    if (!response.ok) return;

    const payload = await response.json();
    const nextStatus = payload?.status;

    if (nextStatus === "approved") {
      setState({ status: "approved", approved: true, errorMessage: null });
      stopPolling();
      return;
    }

    if (nextStatus === "denied") {
      setState({ status: "denied", approved: false, errorMessage: "Approval request was denied." });
      stopPolling();
      return;
    }

    if (state.status !== "pending") {
      setState({ status: "pending" });
    }
  } catch {
    // Keep polling silently; temporary network issues should not reset the flow.
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

export async function requestAdminApproval() {
  if (!API_BASE_URL) {
    setState({
      status: "error",
      approved: false,
      errorMessage:
        "Missing EXPO_PUBLIC_ADMIN_APPROVAL_API_URL. Configure backend approval endpoint first.",
    });
    return {
      ok: false,
      message:
        "Missing EXPO_PUBLIC_ADMIN_APPROVAL_API_URL. Configure backend approval endpoint first.",
    };
  }

  if (state.status === "requesting" || state.status === "pending") {
    return { ok: true, message: "Approval request already pending." };
  }

  setState({ status: "requesting", errorMessage: null });

  try {
    const response = await fetch(`${API_BASE_URL}/admin-access/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        approverEmail: APPROVER_EMAIL,
        requestedAt: new Date().toISOString(),
        source: "farmconnect-app",
      }),
    });

    if (!response.ok) {
      setState({
        status: "error",
        approved: false,
        errorMessage: "Failed to send approval request to backend.",
      });
      return { ok: false, message: "Failed to send approval request to backend." };
    }

    const payload = await response.json();
    const requestId = payload?.requestId;

    if (!requestId) {
      setState({
        status: "error",
        approved: false,
        errorMessage: "Backend did not return requestId.",
      });
      return { ok: false, message: "Backend did not return requestId." };
    }

    setState({
      status: payload?.status === "approved" ? "approved" : "pending",
      approved: payload?.status === "approved",
      requestId,
      errorMessage: null,
    });

    if (payload?.status !== "approved") {
      startPolling();
      void checkApprovalStatus();
    }

    return {
      ok: true,
      message:
        typeof payload?.message === "string" ? payload.message : "Approval request sent.",
      emailed: Boolean(payload?.emailed),
      fallback: Boolean(payload?.fallback),
      approveUrl: typeof payload?.approveUrl === "string" ? payload.approveUrl : undefined,
    };
  } catch {
    setState({
      status: "error",
      approved: false,
      errorMessage: "Network error while requesting admin approval.",
    });
    return { ok: false, message: "Network error while requesting admin approval." };
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
