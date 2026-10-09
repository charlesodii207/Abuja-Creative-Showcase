// app/admin/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getAdminProfile,
  getMailboxUnreadCounts,
  getMe,
  updateProfile,
  logout,
  ApiError,
  type AdminProfile,
} from "../../../lib/admin/api";

type NavItem = {
  label: string;
  href: string;
  // Only these roles can see the item (system owner / super admin).
  roles?: AdminProfile["role"][];
  // Regular admins need this permission, granted through their departments.
  // Super admins and the system owner always see every permission item.
  permission?: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: "Overview", href: "/admin/overview" },
  { label: "Registrants", href: "/admin/registrants" },
  { label: "Bookings", href: "/admin/bookings", permission: "hotels" },
  { label: "Messages", href: "/admin/messages", permission: "messages" },
  // Every admin can open this; regular admins get a view-only list.
  { label: "Admins", href: "/admin/admins" },
  { label: "Analytics", href: "/admin/analytics", permission: "analytics" },
  { label: "Traffic", href: "/admin/traffic", permission: "traffic" },
  { label: "Event scan", href: "/admin/scan", permission: "event_scan" },
  { label: "Event log", href: "/admin/scan-log", permission: "event_log" },
  { label: "Admin logs", href: "/admin/logs", roles: ["system_owner", "super_admin"] },
];

// Until login starts returning a permissions list, regular admins keep the
// sections they already had so nobody is locked out mid-rollout. Once an
// admin's profile has a permissions array (even an empty one), only what
// is in that array is shown.
const LEGACY_ADMIN_PERMISSIONS = ["messages", "analytics", "event_scan"];

function canSee(item: NavItem, profile: AdminProfile | null): boolean {
  if (!profile) return false;

  if (item.roles && !item.roles.includes(profile.role)) return false;

  if (profile.role === "system_owner" || profile.role === "super_admin") {
    return true;
  }

  if (item.permission) {
    const granted = profile.permissions ?? LEGACY_ADMIN_PERMISSIONS;
    return granted.includes(item.permission);
  }

  return true;
}

// "/admin/scan" must not count as active on "/admin/scan-log".
function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  return pathname === href || pathname.startsWith(href + "/");
}

const UNREAD_POLL_MS = 30000;
const PROFILE_SYNC_MS = 30000;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    setProfile(getAdminProfile());
    setChecking(false);
  }, [router]);

  // Close the mobile drawer automatically whenever the route changes
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Send people away from a section they can't use if they type its address.
  // This is only a convenience: the API enforces access on its own.
  useEffect(() => {
    if (checking || !profile) return;

    const current = NAV_ITEMS.find((item) => isActive(pathname, item.href));
    if (current && !canSee(current, profile)) {
      router.replace("/admin/overview");
    }
  }, [checking, profile, pathname, router]);

  // Keep the sidebar in step with the server: when a super admin adds a
  // section or changes a role, it shows up here within about 30 seconds
  // without the person signing out. Mailbox grants from the system owner
  // are kept in the saved profile the same way.
  useEffect(() => {
    if (checking) return;
    let cancelled = false;

    function sync() {
      getMe()
        .then((me) => {
          if (cancelled) return;
          const next: AdminProfile = {
            full_name: me.full_name,
            role: me.role,
            permissions: me.permissions,
            mailboxes_read: me.mailboxes_read,
            mailboxes_send: me.mailboxes_send,
          };
          const stored = getAdminProfile();
          const changed =
            !stored ||
            stored.role !== next.role ||
            stored.full_name !== next.full_name ||
            JSON.stringify(stored.permissions ?? null) !==
              JSON.stringify(next.permissions) ||
            JSON.stringify(stored.mailboxes_read ?? null) !==
              JSON.stringify(next.mailboxes_read) ||
            JSON.stringify(stored.mailboxes_send ?? null) !==
              JSON.stringify(next.mailboxes_send);

          if (changed) {
            updateProfile(next);
            setProfile(next);
          }
        })
        .catch((err) => {
          // An expired or revoked login sends them back to the sign-in page.
          if (err instanceof ApiError && err.status === 401) {
            router.replace("/admin/login");
          }
        });
    }

    sync();
    const interval = setInterval(sync, PROFILE_SYNC_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checking, router]);

  // Only admins who can open Messages need the unread badge; polling for
  // everyone else would just produce "no access" errors every 30 seconds.
  const canSeeMessages = NAV_ITEMS.some(
    (item) => item.href === "/admin/messages" && canSee(item, profile)
  );

  // Poll the unread message count so the sidebar badge stays current.
  // The server only counts mailboxes this person has been assigned.
  useEffect(() => {
    if (checking || !canSeeMessages) return;

    let cancelled = false;

    function refresh() {
      getMailboxUnreadCounts()
        .then((res) => {
          if (!cancelled) setUnreadCount(res.unread_count);
        })
        .catch(() => {
          // silent — badge just won't update this cycle
        });
    }

    refresh();
    const interval = setInterval(refresh, UNREAD_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [checking, canSeeMessages, pathname]);

  function handleLogout() {
    logout();
    router.replace("/admin/login");
  }

  if (checking) return null;

  const visibleNav = NAV_ITEMS.filter((item) => canSee(item, profile));

  return (
    <div className="min-h-screen bg-ink flex">
      {/* Mobile top bar — only shows below md breakpoint */}
      <div className="md:hidden fixed top-0 inset-x-0 h-14 border-b border-ink-raised bg-ink z-30 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open menu"
          className="text-cream p-2 -ml-2 focus:outline-none focus:ring-2 focus:ring-gold rounded-sm"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <p className="font-display text-sm text-cream">
          Afriqa Creative Showcase
        </p>

        <div className="w-9" />
      </div>

      {/* Backdrop — only visible when mobile drawer is open */}
      {mobileNavOpen && (
        <div
          onClick={() => setMobileNavOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-60 shrink-0 border-r border-ink-raised flex flex-col bg-ink
          fixed inset-y-0 left-0 z-50 transition-transform duration-200
          md:static md:translate-x-0
          ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="px-5 py-6 flex items-start justify-between">
          <div>
            <div className="tricolor-rule mb-4">
              <span />
              <span />
              <span />
            </div>

            <p className="font-display text-lg text-cream leading-tight">
              Afriqa Creative
              <br />
              Showcase
            </p>
          </div>

          <button
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close menu"
            className="md:hidden text-muted hover:text-cream p-1 focus:outline-none focus:ring-2 focus:ring-gold rounded-sm"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = isActive(pathname, item.href);
            const showBadge = item.href === "/admin/messages" && unreadCount > 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between font-body text-sm px-3 py-2.5 rounded-sm mb-0.5 transition-colors ${
                  active
                    ? "bg-ink-raised text-cream"
                    : "text-muted hover:text-cream hover:bg-ink-raised/50"
                }`}
              >
                <span>{item.label}</span>

                {showBadge && (
                  <span className="font-body text-xs bg-gold text-ink rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="px-5 py-5 border-t border-ink-raised">
          <p className="font-body text-sm text-cream">{profile?.full_name}</p>

          <p className="font-body text-xs text-muted capitalize mb-3">
            {profile?.role.replace("_", " ")}
          </p>

          <button
            onClick={handleLogout}
            className="font-body text-xs text-muted-on-paper hover:text-cream border border-ink-raised rounded-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      {/* On phones, any page that uses the standard px-8/py-8 wrapper gets
          tighter padding automatically, including pages not listed here. */}
      <main className="flex-1 min-w-0 pt-14 md:pt-0 max-sm:[&>.px-8]:px-4 max-sm:[&>.py-8]:py-6">
        {children}
      </main>
    </div>
  );
}