"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useSyncExternalStore, type ReactNode } from "react";
import {
  ArrowLeft,
  Bookmark,
  LoaderCircle,
  Building2,
  ClipboardCheck,
  Database,
  Flag,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Settings,
  ShieldCheck,
  Siren,
  UserRound,
  Users,
} from "lucide-react";
import { Logo } from "./ui";

const STORAGE_KEY = "sigap:dash-nav";

// Sidebar open/closed is a per-viewer convenience kept in localStorage; storage may be blocked, so a module variable backs it up.
const listeners = new Set<() => void>();
let remembered: boolean | null = null;
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => void listeners.delete(cb);
};
const readOpen = () => {
  if (remembered !== null) return remembered;
  try {
    return localStorage.getItem(STORAGE_KEY) !== "closed";
  } catch {
    return true;
  }
};
const writeOpen = (next: boolean) => {
  remembered = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "open" : "closed");
  } catch {}
  listeners.forEach((l) => l());
};

type Item = { href: string; label: string; icon: LucideIcon; short?: string };
type Role = "volunteer" | "seeker" | "admin";

const NAVS: Record<Role, Item[]> = {
  volunteer: [
    { href: "/r", label: "Beranda", icon: LayoutDashboard },
    { href: "/r/lamaran", label: "Kegiatanku", icon: ClipboardCheck },
    { href: "/pesan", label: "Pesan", icon: MessageSquare },
    { href: "/r/tersimpan", label: "Tersimpan", icon: Bookmark },
    { href: "/r/profil", label: "Profil", icon: UserRound },
    { href: "/r/verifikasi", label: "Verifikasi", icon: ShieldCheck },
    { href: "/r/pengaturan", label: "Pengaturan", icon: Settings },
  ],
  seeker: [
    { href: "/p", label: "Beranda", icon: LayoutDashboard },
    { href: "/p/panggilan/baru", label: "Buat panggilan", icon: PlusCircle, short: "Buat" },
    { href: "/pesan", label: "Pesan", icon: MessageSquare },
    { href: "/p/profil", label: "Profil organisasi", icon: Building2, short: "Profil" },
    { href: "/p/verifikasi", label: "Verifikasi", icon: ShieldCheck },
  ],
  admin: [
    { href: "/admin", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/admin/verifikasi", label: "Verifikasi", icon: ShieldCheck },
    { href: "/admin/panggilan", label: "Panggilan", icon: Siren },
    { href: "/admin/pengguna", label: "Pengguna", icon: Users },
    { href: "/admin/laporan", label: "Laporan", icon: Flag },
    { href: "/admin/master", label: "Master data", icon: Database },
    { href: "/admin/pengumuman", label: "Pengumuman", icon: Megaphone },
  ],
};

/** Swaps the icon for a spinner the moment a link is pressed, so navigation feels instant even while data loads. */
function NavIcon({ icon: Icon, className }: { icon: LucideIcon; className: string }) {
  const { pending } = useLinkStatus();
  return pending ? <LoaderCircle className={`${className} animate-spin`} aria-hidden /> : <Icon className={className} aria-hidden />;
}

function NavLink({ item, active, vertical }: { item: Item; active: boolean; vertical?: boolean }) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 font-semibold whitespace-nowrap transition-colors ${
        vertical ? "rounded-2xl px-4 py-3.5 text-base" : "rounded-full px-3.5 py-2.5 text-sm"
      } ${active ? "bg-ink text-paper shadow-[0_10px_24px_-10px_rgba(27,36,48,0.5)]" : "text-ink-soft hover:bg-paper hover:text-ink"}`}
    >
      <NavIcon icon={item.icon} className={`shrink-0 ${vertical ? "size-5" : "size-4"} ${active ? "text-sigap" : ""}`} />
      {item.label}
    </Link>
  );
}

/**
 * Dashboard chrome. Desktop: a sidebar pinned to the left edge, top to bottom, holding logo, sections, back-to-home and the account.
 * Mobile: a top bar with logo and account, and the sections as a horizontal pill bar. The site header is not rendered here.
 */
function DashNav({ role, account, open, onToggle }: { role: Role; account: ReactNode; open: boolean; onToggle: (next: boolean) => void }) {
  const pathname = usePathname();
  const items = NAVS[role];
  return (
    <nav aria-label="Menu dasbor" className={`lg:shrink-0 ${open ? "lg:w-64" : "lg:w-12"}`}>
      <div
        className={`flex flex-wrap items-center justify-between gap-x-2 gap-y-3 border-b border-line/70 bg-white px-4 py-3 sm:px-6 lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 lg:flex-col lg:flex-nowrap lg:items-stretch lg:justify-start lg:gap-y-0 lg:border-r lg:border-b-0 lg:px-4 lg:py-5 ${
          open ? "" : "lg:hidden"
        }`}
      >
        <Link href="/" aria-label="Sigap — beranda" className="order-1 lg:px-3 lg:pb-6">
          <Logo />
        </Link>

        <div className="order-2 flex items-center gap-1 lg:order-4 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-1">
          <Link
            href="/"
            className="inline-flex size-9 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink lg:size-auto lg:justify-start lg:gap-3 lg:rounded-2xl lg:px-4 lg:py-3 lg:text-sm lg:font-semibold"
            aria-label="Kembali ke beranda"
          >
            <ArrowLeft className="size-5 shrink-0" aria-hidden />
            <span className="hidden lg:inline">Kembali ke beranda</span>
          </Link>
          <button
            type="button"
            onClick={() => onToggle(false)}
            className="hidden items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-ink-muted transition-colors hover:bg-paper hover:text-ink lg:flex"
          >
            <PanelLeftClose className="size-5 shrink-0" aria-hidden />
            Sembunyikan menu
          </button>
          <div className="flex items-center gap-1 lg:mt-2 lg:border-t lg:border-line/70 lg:px-1 lg:pt-3">{account}</div>
        </div>

        <ul className="order-3 hidden min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto lg:flex">
          {items.map((n) => (
            <li key={n.href}>
              <NavLink item={n} active={pathname === n.href} vertical />
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile: bottom tab bar with the five most used sections; the rest live in the account menu. */}
      <ul className="fixed inset-x-0 bottom-0 z-30 mx-auto grid grid-cols-5 border-t border-line/70 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden" aria-label="Menu utama">
        {items.slice(0, 5).map((n) => {
          const active = pathname === n.href;
          return (
            <li key={n.href}>
              <Link
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 px-1 pt-2.5 pb-2 text-[0.68rem] font-semibold ${active ? "text-ink" : "text-ink-muted"}`}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 rounded-full bg-sigap" aria-hidden />}
                <NavIcon icon={n.icon} className={`size-5 ${active ? "text-sigap-ink" : ""}`} />
                <span className="max-w-full truncate">{n.short ?? n.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {!open && (
        <button
          type="button"
          onClick={() => onToggle(true)}
          aria-label="Tampilkan menu"
          title="Tampilkan menu"
          className="fixed top-4 left-0 hidden size-10 items-center justify-center rounded-r-2xl border border-l-0 border-line/70 bg-white text-ink-soft shadow-[0_10px_24px_-14px_rgba(27,36,48,0.5)] transition-colors hover:text-ink lg:inline-flex"
        >
          <PanelLeftOpen className="size-5" aria-hidden />
        </button>
      )}
    </nav>
  );
}

function NavSkeleton() {
  return (
    <div className="lg:w-64 lg:shrink-0">
      <div className="h-24 animate-pulse bg-white lg:fixed lg:inset-y-0 lg:left-0 lg:h-auto lg:w-64" />
    </div>
  );
}

/** Client half of the dashboard shell; `account` is the server-rendered bell + user menu. */
export function DashFrame({ role, account, children }: { role: Role; account: ReactNode; children: ReactNode }) {
  // Server and first client paint are always "open" so markup matches.
  const open = useSyncExternalStore(subscribe, readOpen, () => true);

  return (
    <div className="lg:flex lg:items-start">
      <Suspense fallback={<NavSkeleton />}>
        <DashNav role={role} account={account} open={open} onToggle={writeOpen} />
      </Suspense>
      <div className="min-w-0 flex-1 pt-6 pb-24 lg:pb-0">{children}</div>
    </div>
  );
}
