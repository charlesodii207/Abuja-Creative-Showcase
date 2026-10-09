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
  // Sections a regular admin may use, set by their departments.
  // Undefined until login returns it; super admins ignore it.
  permissions?: string[];
  // Shared mailboxes this person can read / send from. Set by the system
  // owner. The backend is the real gatekeeper; these only drive the UI.
  mailboxes_read?: string[];
  mailboxes_send?: string[];
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
    permissions?: string[];
    mailboxes_read?: string[];
    mailboxes_send?: string[];
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

// Overwrites just the saved profile (used when role or sections change).
export function updateProfile(profile: AdminProfile) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(profile));
}

// The signed-in admin's current role and sections, read fresh from the server.
export async function getMe() {
  return adminFetch<{
    full_name: string;
    role: AdminProfile["role"];
    permissions: string[];
    mailboxes_read: string[];
    mailboxes_send: string[];
  }>("/admin/auth/me");
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

  pitchers_paid: number;
  pitchers_unpaid: number;

  revenue_kobo_total: number;

  revenue_kobo_by_category: {
    attendee?: number;
    exhibitor?: number;
    pitcher?: number;
  };

  today_checked_in: number;
  today_duplicate_scans: number;
};

// Overview: headline counts only, available to every admin.
export type OverviewStats = Pick<
  StatsResponse,
  | "total_registrants"
  | "by_category"
  | "by_status"
  | "attendees_paid"
  | "attendees_unpaid"
  | "exhibitors_paid"
  | "exhibitors_unpaid"
>;

export async function getStats() {
  return adminFetch<OverviewStats>("/admin/stats");
}

// Analytics: the full set including revenue and check-ins.
// Needs the Analytics permission (Insights & Reporting department).
export async function getAnalytics() {
  return adminFetch<StatsResponse>("/admin/analytics");
}

// --- Site traffic ---

export type TrafficRange = "today" | "7d" | "30d";

export type TrafficVisit = {
  id: string;
  created_at: string;
  ip: string;
  path: string;
  source: string; // "facebook" | "instagram" | "x" | "google" | "direct" ...
  country: string | null;
  device: string | null; // "mobile" | "desktop" | "tablet"
};

export type TrafficResponse = {
  total_visits: number;
  unique_visitors: number; // distinct IPs
  social_clicks: number;
  by_source: Record<string, number>;
  top_pages: { path: string; views: number; unique_visitors: number }[];
  recent_visits: TrafficVisit[]; // newest first, up to ~200
};

export async function getTraffic(range: TrafficRange) {
  return adminFetch<TrafficResponse>(
    `/admin/traffic?range=${encodeURIComponent(range)}`
  );
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
  created_at: string | null;
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

export type SortOrder = "alpha" | "recent";

export async function listRegistrants(filters?: {
  category?: string;
  status?: string;
  sort?: SortOrder;
}) {
  const params = new URLSearchParams();

  if (filters?.category) params.set("category", filters.category);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.sort) params.set("sort", filters.sort);

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
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
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
  // Department keys (see lib/admin/permissions.ts). Only used for regular admins.
  departments: string[];
  // Individual sections granted on top of the departments.
  extra_permissions: string[];
  // Shared mailboxes (set by the system owner only). Blank for plain admins
  // looking at the list.
  mailboxes_read: string[];
  mailboxes_send: string[];
};

export async function listAdmins(filters?: { sort?: SortOrder }) {
  const params = new URLSearchParams();

  if (filters?.sort) params.set("sort", filters.sort);

  const qs = params.toString();

  return adminFetch<AdminSummary[]>(
    `/admin/auth/admins${qs ? `?${qs}` : ""}`
  );
}

export async function createAdmin(payload: {
  full_name: string;
  username: string;
  temp_password: string;
  role: "super_admin" | "admin";
  departments?: string[];
  extra_permissions?: string[];
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

export async function deleteAdmin(adminId: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/auth/admins/${encodeURIComponent(adminId)}`,
    { method: "DELETE" }
  );
}

export async function updateAdminDepartments(
  adminId: string,
  departments: string[],
  extraPermissions?: string[]
) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/auth/admins/${encodeURIComponent(adminId)}/departments`,
    {
      method: "PATCH",
      body: JSON.stringify({
        departments,
        ...(extraPermissions ? { extra_permissions: extraPermissions } : {}),
      }),
    }
  );
}

// System owner only. Sending implies reading, so anything in `send` is also
// saved as readable by the backend.
export async function updateAdminMailboxes(
  adminId: string,
  mailboxesRead: string[],
  mailboxesSend: string[]
) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/auth/admins/${encodeURIComponent(adminId)}/mailboxes`,
    {
      method: "PATCH",
      body: JSON.stringify({
        mailboxes_read: mailboxesRead,
        mailboxes_send: mailboxesSend,
      }),
    }
  );
}

// Upgrade (admin -> super_admin) or downgrade (super_admin -> admin).
export async function changeAdminRole(
  adminId: string,
  role: "super_admin" | "admin"
) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/auth/admins/${encodeURIComponent(adminId)}/role`,
    {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }
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

// --- Scan log (multi-day check-in history) ---

export type ScanLogEntry = {
  id: string;
  ticket_number: string;
  full_name: string;
  category_tag: string;
  result: "accepted" | "duplicate";
  scanned_at: string;
  checked_in_by: string | null;
};

export type ScanLogResponse = {
  event_day: string;
  total_scans: number;
  accepted_count: number;
  duplicate_count: number;
  entries: ScanLogEntry[];
};

/**
 * eventDay must be an ISO date string (YYYY-MM-DD), the Nigeria (WAT)
 * calendar date to look up — not a full timestamp.
 */
export async function getScanLog(eventDay: string) {
  return adminFetch<ScanLogResponse>(
    `/tickets/scan-log?event_day=${encodeURIComponent(eventDay)}`
  );
}

// --- Admin logs ---

export type AdminLogSummary = {
  id: string;
  admin_name: string | null;
  action: string;
  target_type: string | null;
  target_reference: string | null;
  target_name: string | null;
  detail: string | null;
  created_at: string | null;
};

export async function listAdminLogs(filters?: {
  limit?: number;
  search?: string;
  action?: string;
  admin_name?: string;
}) {
  const params = new URLSearchParams();

  params.set("limit", String(filters?.limit ?? 300));

  if (filters?.search) params.set("search", filters.search);
  if (filters?.action) params.set("action", filters.action);
  if (filters?.admin_name) params.set("admin_name", filters.admin_name);

  return adminFetch<AdminLogSummary[]>(`/admin/logs?${params.toString()}`);
}

// --- Messages ---

export type MessageThreadStatus = "open" | "closed";
export type MessageSenderType = "visitor" | "admin";

export type Message = {
  id: string;
  sender: MessageSenderType;
  body: string;
  created_at: string;
  // Added with shared mailboxes. All optional so older code keeps compiling.
  // NOTE: the backend actually sends `sender_type`, `sender_name` and
  // `sender_email` (not `sender`); they're declared here so you can read them.
  sender_type?: MessageSenderType;
  sender_name?: string;
  sender_email?: string;
  subject?: string;
  direction?: "inbound" | "outbound" | null;
  mailbox?: string | null;
  to_addresses?: string | null;
  cc_addresses?: string | null;
  // True when the original HTML of an inbound email exists. Fetch it with
  // getMessageHtml() and show it ONLY inside <iframe sandbox="" srcDoc=...>.
  has_html?: boolean;
};

export type MessageThreadSummary = {
  id: string;
  sender_name: string;
  sender_email: string;
  status: MessageThreadStatus;
  is_replied: boolean;
  unread_count: number;
  latest_message: Message;
  subject?: string;
  mailbox?: string | null;
  channel?: "form" | "email";
  updated_at?: string | null;
};

export type MessageThreadDetail = {
  id: string;
  sender_name: string;
  sender_email: string;
  status: MessageThreadStatus;
  is_replied: boolean;
  messages: Message[];
  subject?: string;
  mailbox?: string | null;
  channel?: "form" | "email";
};

export async function listMessageThreads(filters?: {
  status?: MessageThreadStatus;
  mailbox?: string;
}) {
  const params = new URLSearchParams();

  if (filters?.status) params.set("status", filters.status);
  if (filters?.mailbox) params.set("mailbox", filters.mailbox);

  const qs = params.toString();

  return adminFetch<MessageThreadSummary[]>(
    `/admin/messages${qs ? `?${qs}` : ""}`
  );
}

export async function getMessageThread(threadId: string) {
  return adminFetch<MessageThreadDetail>(
    `/admin/messages/${encodeURIComponent(threadId)}`
  );
}

export async function markThreadRead(threadId: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/messages/${encodeURIComponent(threadId)}/read`,
    { method: "PATCH" }
  );
}

export async function replyToThread(threadId: string, body: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/messages/${encodeURIComponent(threadId)}/reply`,
    {
      method: "POST",
      body: JSON.stringify({ body }),
    }
  );
}

export async function closeThread(threadId: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/messages/${encodeURIComponent(threadId)}/close`,
    { method: "PATCH" }
  );
}

export async function reopenThread(threadId: string) {
  return adminFetch<{ id: string; status: string; message: string }>(
    `/admin/messages/${encodeURIComponent(threadId)}/reopen`,
    { method: "PATCH" }
  );
}

/**
 * Sidebar badge total. Derived from the open-thread list, which the backend
 * already limits to the mailboxes this person can read.
 */
export async function getUnreadMessageCount() {
  const threads = await listMessageThreads({ status: "open" });

  return threads.reduce((sum, t) => sum + t.unread_count, 0);
}

// --- Shared mailboxes (compose, sender toggle, per-mailbox badges) ---

export type MailboxOption = {
  key: string;
  label: string;
  address: string;
  // false = can read this mailbox but not send from it.
  can_send: boolean;
};

// Mailboxes this person can see. For the sender toggle, use only the ones
// with can_send === true.
export async function listMyMailboxes() {
  return adminFetch<MailboxOption[]>("/admin/messages/mailboxes");
}

export async function composeMessage(payload: {
  mailbox: string; // a key like "info", never a raw address
  to: string[];
  cc?: string[];
  subject: string;
  body: string; // plain text; the server wraps it in the branded template
}) {
  return adminFetch<{ id: string; status: string; message: string }>(
    "/admin/messages/compose",
    {
      method: "POST",
      body: JSON.stringify({ cc: [], ...payload }),
    }
  );
}

// Original HTML of an inbound email. UNTRUSTED: render only inside
// <iframe sandbox="" srcDoc={html} />, never with dangerouslySetInnerHTML.
export async function getMessageHtml(messageId: string) {
  return adminFetch<{ html: string | null }>(
    `/admin/messages/html/${encodeURIComponent(messageId)}`
  );
}

// Unread totals, overall and per mailbox (for badges on the mailbox tabs).
export async function getMailboxUnreadCounts() {
  return adminFetch<{
    unread_count: number;
    by_mailbox: Record<string, number>;
  }>("/admin/messages/unread-count");
}

// System owner only: when each mailbox last synced and the last error
// (e.g. a wrong Zoho password).
export async function getMailSyncStatus() {
  return adminFetch<
    { mailbox: string; last_synced_at: string | null; last_error: string | null }[]
  >("/admin/messages/sync-status");
}


// --- Bookings ---

export type BookingStatus = "new" | "contacted" | "confirmed" | "cancelled";

export type BookingSummary = {
  id: string;
  reference_number: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: BookingStatus;
  check_in: string | null;
  check_out: string | null;
  nights: number | null;
  rooms: number | null;
  budget_range: string | null;
  created_at: string | null;
};

export type BookingDetail = BookingSummary & {
  adults: number | null;
  children: number | null;
  guests: number | null;
  extra_bed_requested: boolean;
  preferred_area: string | null;
  message: string | null;
  terms_accepted: boolean;
  privacy_accepted: boolean;
  hotel_sharing_consent: boolean;
  legal_version: string | null;
  hotel_name: string | null;
  confirmed_check_in: string | null;
  confirmed_check_out: string | null;
  amount_paid_kobo: number | null;
  operator_name: string | null;
  confirmation_notes: string | null;
  confirmed_at: string | null;
  cancelled_by_name: string | null;
  cancelled_at: string | null;
};

export type ConfirmBookingPayload = {
  hotel_name: string;
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  amount_paid_kobo: number;
  notes?: string;
};

type BookingActionResult = { id: string; status: string; message: string };

export async function listBookings(filters?: {
  status?: string;
  sort?: SortOrder;
}) {
  const params = new URLSearchParams();

  if (filters?.status) params.set("status", filters.status);
  if (filters?.sort) params.set("sort", filters.sort);

  const qs = params.toString();

  return adminFetch<BookingSummary[]>(`/admin/bookings${qs ? `?${qs}` : ""}`);
}

export async function getBookingDetail(referenceNumber: string) {
  return adminFetch<BookingDetail>(
    `/admin/bookings/${encodeURIComponent(referenceNumber)}`
  );
}

export async function markBookingContacted(referenceNumber: string) {
  return adminFetch<BookingActionResult>(
    `/admin/bookings/${encodeURIComponent(referenceNumber)}/contacted`,
    { method: "PATCH" }
  );
}

export async function confirmBooking(
  referenceNumber: string,
  payload: ConfirmBookingPayload
) {
  return adminFetch<BookingActionResult>(
    `/admin/bookings/${encodeURIComponent(referenceNumber)}/confirm`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function cancelBooking(referenceNumber: string) {
  return adminFetch<BookingActionResult>(
    `/admin/bookings/${encodeURIComponent(referenceNumber)}/cancel`,
    { method: "PATCH" }
  );
}

export async function resendBookingConfirmation(referenceNumber: string) {
  return adminFetch<BookingActionResult>(
    `/admin/bookings/${encodeURIComponent(referenceNumber)}/resend-confirmation`,
    { method: "POST" }
  );
}