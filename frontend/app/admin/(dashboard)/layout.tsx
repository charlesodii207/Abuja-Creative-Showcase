// app/admin/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getAdminProfile,
  getUnreadMessageCount,
  logout,
  type AdminProfile,
} from "../../../lib/admin/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/overview" },
  { label: "Registrants", href: "/admin/registrants" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Admins", href: "/admin/admins", roles: ["system_owner", "super_admin"] },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Event scan", href: "/admin/scan" },
  { label: "Admin logs", href: "/admin/logs" },
];

const UNREAD_POLL_MS = 30000;

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

  // Poll the unread message count so the sidebar badge stays current
  useEffect(() => {
    if (checking) return;

    let cancelled = false;

    function refresh() {
      getUnreadMessageCount()
        .then((count) => {
          if (!cancelled) setUnreadCount(count);
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
  }, [checking, pathname]);

  function handleLogout() {
    logout();
    router.replace("/admin/login");
  }

  if (checking) return null;

  const visibleNav = NAV_ITEMS.filter(
    (item) => !item.roles || (profile && item.roles.includes(profile.role))
  );

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
        <p className="font-display text-sm text-cream">Abuja Creative Showcase</p>
        <div className="w-9" /> {/* spacer to balance the hamburger button */}
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
              Abuja Creative
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
            const active = pathname?.startsWith(item.href);
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
      <main className="flex-1 min-w-0 pt-14 md:pt-0">{children}</main>
    </div>
  );
}