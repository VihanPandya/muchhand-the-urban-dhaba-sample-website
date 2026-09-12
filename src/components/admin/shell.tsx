"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Permission } from "@/lib/permissions";
import { api } from "@/components/admin/api";
import {
  IconBell,
  IconBook,
  IconCalendar,
  IconChart,
  IconClose,
  IconGrid,
  IconImage,
  IconLink,
  IconLogout,
  IconMail,
  IconMenu,
  IconSettings,
  IconStar,
  IconTag,
  IconUsers,
} from "@/components/icons";

type NavItem = { href: string; label: string; icon: typeof IconGrid; permission: Permission; exact?: boolean };

const NAV: { section: string; items: NavItem[] }[] = [
  {
    section: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: IconGrid, permission: "dashboard.view", exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: IconChart, permission: "analytics.view" },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/orders", label: "Orders", icon: IconBook, permission: "orders.view" },
      { href: "/admin/reservations", label: "Reservations", icon: IconCalendar, permission: "reservations.view" },
      { href: "/admin/customers", label: "Customers", icon: IconUsers, permission: "customers.view" },
      { href: "/admin/messages", label: "Messages", icon: IconMail, permission: "messages.view" },
    ],
  },
  {
    section: "Menu",
    items: [
      { href: "/admin/menu", label: "Dishes", icon: IconBook, permission: "menu.manage" },
      { href: "/admin/categories", label: "Categories", icon: IconGrid, permission: "categories.manage" },
      { href: "/admin/coupons", label: "Offers & coupons", icon: IconTag, permission: "coupons.manage" },
    ],
  },
  {
    section: "Website",
    items: [
      { href: "/admin/content", label: "Content", icon: IconBook, permission: "content.manage" },
      { href: "/admin/gallery", label: "Gallery", icon: IconImage, permission: "gallery.manage" },
      { href: "/admin/testimonials", label: "Testimonials", icon: IconStar, permission: "testimonials.manage" },
    ],
  },
  {
    section: "Configuration",
    items: [
      { href: "/admin/settings", label: "Settings", icon: IconSettings, permission: "settings.manage" },
      { href: "/admin/integrations", label: "Integrations", icon: IconLink, permission: "integrations.manage" },
      { href: "/admin/admins", label: "Team & roles", icon: IconUsers, permission: "admins.manage" },
    ],
  },
];

export function AdminShell({
  admin,
  restaurantName,
  logoUrl,
  children,
}: {
  admin: { name: string; email: string; role: string; permissions: string[] };
  restaurantName: string;
  logoUrl: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await api.get<{ unread: number }>("/api/admin/notifications?unread=true");
        if (!cancelled) setUnread(data.unread);
      } catch {
        /* the bell simply stays at its last value */
      }
    };
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await api.post("/api/auth/logout", {});
    } catch {
      /* clearing the cookie failed — still send them to the login page */
    }
    router.replace("/admin/login");
    router.refresh();
  };

  const sections = NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => admin.permissions.includes(item.permission)),
  })).filter((section) => section.items.length > 0);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <Image src={logoUrl} alt="" width={36} height={36} className="h-9 w-9 rounded-full" />
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-paper">{restaurantName}</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-saffron-400">Admin panel</span>
        </span>
      </div>

      <nav aria-label="Admin" className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.section} className="mb-5">
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">{section.section}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item) ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        isActive(item)
                          ? "bg-saffron-400 text-ink-900"
                          : "text-ink-200 hover:bg-white/8 hover:text-paper"
                      }`}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="rounded-xl bg-white/6 px-3 py-3">
          <p className="truncate text-sm font-semibold text-paper">{admin.name}</p>
          <p className="truncate text-xs text-ink-400">{admin.email}</p>
          <p className="mt-1 inline-flex rounded-full bg-saffron-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-saffron-300">
            {admin.role.replace("_", " ")}
          </p>
        </div>
        <div className="mt-2 flex gap-2">
          <Link href="/" className="btn btn-sm flex-1 bg-white/8 text-paper hover:bg-white/15">
            View site
          </Link>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="btn btn-sm bg-white/8 px-3 text-paper hover:bg-tandoor-600"
            aria-label="Sign out"
          >
            <IconLogout className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-paper-dim lg:flex">
      <aside className="fixed inset-y-0 left-0 hidden w-64 bg-ink-900 lg:block">{sidebar}</aside>

      {open ? (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <button type="button" className="absolute inset-0 bg-ink-950/60" onClick={() => setOpen(false)} aria-label="Close menu" />
          <div className="absolute inset-y-0 left-0 w-72 bg-ink-900 shadow-[var(--shadow-lift)]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-300 hover:bg-white/10"
              aria-label="Close menu"
            >
              <IconClose className="h-4 w-4" />
            </button>
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-3 border-b border-ink-100 bg-paper/95 px-4 backdrop-blur md:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-700 transition hover:bg-ink-900/5 lg:hidden"
            aria-label="Open admin menu"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold text-ink-900">
              {sections.flatMap((s) => s.items).find((item) => isActive(item))?.label ?? "Admin"}
            </p>
          </div>

          <Link
            href="/admin/notifications"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full text-ink-600 transition hover:bg-ink-900/5"
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          >
            <IconBell className="h-[18px] w-[18px]" />
            {unread > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-tandoor-500 px-1 text-[10px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            ) : null}
          </Link>
        </header>

        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
