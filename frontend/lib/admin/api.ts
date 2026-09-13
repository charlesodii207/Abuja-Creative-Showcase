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