// lib/admin/api.ts
//
// Small helper for talking to the admin API: stores the JWT in localStorage,
// attaches it to requests, and centralizes the base URL.
//
// Set NEXT_PUBLIC_API_URL in your .env.local, e.g.:
// NEXT_PUBLIC_API_URL=http://localhost:8000

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const TOKEN_KEY = "acs_admin_token";
const ADMIN_KEY = "acs_admin_profile";

export type AdminProfile = {
  full_name: string;
  role: "system_owner" | "super_admin" | "admin";
};

export function saveSession(token: string, profile: AdminProfile) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(ADMIN_KEY, JSON.stringify(profile));
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getAdminProfile(): AdminProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(ADMIN_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ADMIN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Authenticated fetch wrapper. Throws ApiError on non-2xx responses.
 * On a 401/403, clears the local session so the next page load redirects to login.
 */
export async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    let detail = "Something went wrong.";
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // response wasn't JSON, keep default message
    }

    if (res.status === 401) {
      clearSession();
    }

    throw new ApiError(detail, res.status);
  }

  // some endpoints (e.g. CSV export) won't return JSON
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json();
  }
  return res as unknown as T;
}

export async function login(username: string, password: string) {
  return adminFetch<{
    token: string;
    must_change_password: boolean;
    full_name: string;
    role: AdminProfile["role"];
  }>("/admin/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}

export async function changePassword(
  current_password: string,
  new_password: string
) {
  return adminFetch<{ id: string; status: string; message: string }>(
    "/admin/auth/change-password",
    {
      method: "POST",
      body: JSON.stringify({ current_password, new_password }),
    }
  );
}

export function logout() {
  clearSession();
}

// --- Stats ---

export type StatsResponse = {
  total_registrants: number;
  by_category: Record<string, number>;
  by_status: Record<string, number>;
  attendees_paid: number;
  attendees_unpaid: number;
  exhibitors_paid: number;
  exhibitors_unpaid: number;
};

export async function getStats() {
  return adminFetch<StatsResponse>("/admin/stats");
}

// --- Registrants ---

export type RegistrantCategory =
  | "attendee"
  | "exhibitor"
  | "press"
  | "pitcher"
  | "investor";

export type RegistrantStatus =
  | "pending"
  | "awaiting_payment"
  | "approved"
  | "rejected"
  | "confirmed";

export type RegistrantSummary = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  category: RegistrantCategory;
  reference_number: string;
  status: RegistrantStatus;
};

export type TicketInfo = {
  ticket_number: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
};

export type RegistrantDetail = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  category: RegistrantCategory;
  reference_number: string;
  status: RegistrantStatus;
  created_at: string | null;
  details: Record<string, unknown>;
  ticket: TicketInfo | null;
};

export async function listRegistrants(filters?: {
  category?: string;
  status?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.category) params.set("category", filters.category);
  if (filters?.status) params.set("status", filters.status);
  const qs = params.toString();
  return adminFetch<RegistrantSummary[]>(
    `/admin/registrants${qs ? `?${qs}` : ""}`
  );
}

export async function getRegistrantDetail(referenceNumber: string) {
  return adminFetch<RegistrantDetail>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}`
  );
}

export async function editRegistrant(
  referenceNumber: string,
  payload: { full_name?: string; email?: string; phone?: string }
) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}`,
    { method: "PATCH", body: JSON.stringify(payload) }
  );
}

export async function approveRegistrant(referenceNumber: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}/approve`,
    { method: "PATCH" }
  );
}

export async function rejectRegistrant(referenceNumber: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}/reject`,
    { method: "PATCH" }
  );
}

export async function markRegistrantPaid(referenceNumber: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}/mark-paid`,
    { method: "PATCH" }
  );
}

export async function resendRegistrantEmail(referenceNumber: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/registrants/${encodeURIComponent(referenceNumber)}/resend-email`,
    { method: "POST" }
  );
}

// --- Admin management ---

export type AdminSummary = {
  id: string;
  full_name: string;
  username: string;
  role: "system_owner" | "super_admin" | "admin";
  is_active: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
};

export async function listAdmins() {
  return adminFetch<AdminSummary[]>("/admin/auth/admins");
}

export async function createAdmin(payload: {
  full_name: string;
  username: string;
  temp_password: string;
  role: "super_admin" | "admin";
}) {
  return adminFetch<AdminSummary>("/admin/auth/create-admin", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function deactivateAdmin(adminId: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/auth/admins/${encodeURIComponent(adminId)}/deactivate`,
    { method: "PATCH" }
  );
}

// --- Ticket check-in ---

export type CheckinResult = {
  result: "approved" | "already_checked_in";
  full_name: string;
  category_tag: string;
  checked_in_at: string | null;
  message: string;
};

export async function checkinTicket(ticketNumber: string) {
  return adminFetch<CheckinResult>("/tickets/checkin", {
    method: "POST",
    body: JSON.stringify({ ticket_number: ticketNumber }),
  });
}

// --- Admin logs ---

export type AdminLogSummary = {
  id: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_reference: string | null;
  detail: string | null;
  created_at: string | null;
};

export async function listAdminLogs(limit = 100) {
  return adminFetch<AdminLogSummary[]>(`/admin/logs?limit=${limit}`);
}