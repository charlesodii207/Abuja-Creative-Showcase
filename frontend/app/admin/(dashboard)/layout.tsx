// app/admin/(dashboard)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getToken,
  getAdminProfile,
  logout,
  type AdminProfile,
} from "../../../lib/admin/api";

const NAV_ITEMS = [
  { label: "Overview", href: "/admin/overview" },
  { label: "Registrants", href: "/admin/registrants" },
  { label: "Admins", href: "/admin/admins", roles: ["system_owner", "super_admin"] },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Event scan", href: "/admin/scan" },
  { label: "Admin logs", href: "/admin/logs" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [profile, setProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/admin/login");
      return;
    }
    setProfile(getAdminProfile());
    setChecking(false);
  }, [router]);

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
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-ink-raised flex flex-col">
        <div className="px-5 py-6">
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

        <nav className="flex-1 px-3">
          {visibleNav.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block font-body text-sm px-3 py-2.5 rounded-sm mb-0.5 transition-colors ${
                  active
                    ? "bg-ink-raised text-cream"
                    : "text-muted hover:text-cream hover:bg-ink-raised/50"
                }`}
              >
                {item.label}
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
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
