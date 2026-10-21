import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, Inbox, type LucideIcon, Siren, Star } from "lucide-react";
import { APP_STATUS, CALL_STATUS, LOAD_LABEL, LOAD_STYLE } from "@/lib/constants";
import { formatRating, initials } from "@/lib/format";
import type { AppStatus, CallStatus, Load } from "@/lib/types";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {/* Reflective-tape chevron, as on a rescue vest. */}
      <svg viewBox="0 0 32 32" className="size-7 shrink-0" aria-hidden>
        <rect width="32" height="32" rx="8" fill="var(--sigap)" />
        <path d="M6 12 16 19l10-7" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 19.5 16 26.5l10-7" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="font-display text-[1.4rem] font-bold tracking-tight">sigap</span>
    </span>
  );
}

export function LoadTag({ load, className = "" }: { load: Load; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ${LOAD_STYLE[load]} ${className}`}>
      {load === "darurat" && <Siren className="size-3.5" aria-hidden />}
      {LOAD_LABEL[load]}
    </span>
  );
}

export function CallStatusBadge({ status }: { status: CallStatus }) {
  const s = CALL_STATUS[status];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${s.style}`}>{s.label}</span>;
}

export function AppStatusBadge({ status }: { status: AppStatus }) {
  const s = APP_STATUS[status];
  return <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${s.style}`}>{s.label}</span>;
}

export function Avatar({
  src,
  name,
  size = 40,
  square = false,
  className = "",
}: {
  src?: string | null;
  name: string;
  size?: number;
  square?: boolean;
  className?: string;
}) {
  const radius = square ? "rounded-xl" : "rounded-full";
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={`${radius} shrink-0 border border-line bg-surface object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${radius} inline-flex shrink-0 items-center justify-center bg-ink font-semibold text-paper ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function VerifiedMark({ label = "Terverifikasi", compact = false }: { label?: string; compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-semibold text-guyub" title={label}>
      <BadgeCheck className="size-4 shrink-0" aria-hidden />
      <span className={compact ? "sr-only" : ""}>{label}</span>
    </span>
  );
}

export function LevelBadge({ level }: { level: number }) {
  if (level >= 2)
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-guyub-wash px-2 py-0.5 text-xs font-semibold text-guyub-deep">
        <BadgeCheck className="size-3.5" aria-hidden /> Identitas terverifikasi
      </span>
    );
  if (level === 1)
    return <span className="inline-flex rounded-md bg-[#e3e1d8] px-2 py-0.5 text-xs font-semibold text-ink">Profil lengkap</span>;
  return <span className="inline-flex rounded-md bg-sigap-wash px-2 py-0.5 text-xs font-semibold text-sigap-ink">Profil belum lengkap</span>;
}

export function Rating({ value, count }: { value: number | null; count: number }) {
  if (!count) return <span className="text-sm text-ink-muted">Belum ada ulasan</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <Star className="size-4 fill-ladang text-ladang" aria-hidden />
      <strong>{formatRating(value)}</strong>
      <span className="text-ink-muted">({count} ulasan)</span>
    </span>
  );
}

export function ScoreBadge({ score, animate = false }: { score: number; animate?: boolean }) {
  const strong = score >= 70;
  return (
    <span
      className={`inline-flex items-baseline gap-0.5 rounded-full px-2.5 py-1 font-display text-sm font-bold ${
        strong ? "bg-sigap-ink text-white" : "bg-[#e3e1d8] text-ink"
      } ${animate ? "match-pop" : ""}`}
      title="Tingkat kecocokan dengan profilmu"
    >
      {score}
      <span className="text-[0.7em] font-semibold">% cocok</span>
    </span>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="h-section text-2xl sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ title, body, action, icon: Icon = Inbox }: { title: string; body?: string; action?: { href: string; label: string }; icon?: LucideIcon }) {
  return (
    <div className="rounded-3xl border border-dashed border-line-strong bg-surface/40 px-6 py-12 text-center">
      <span className="mx-auto inline-flex size-14 items-center justify-center rounded-2xl bg-paper text-ink-muted">
        <Icon className="size-7" aria-hidden />
      </span>
      <p className="mt-4 font-semibold">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{body}</p>}
      {action && (
        <Link href={action.href} className="btn btn-ink btn-sm mt-5">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[#e3e0d6] ${className}`} />;
}

/** Mirrors the dashboard layout: header block, four tiles, two cards. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 sm:px-6" aria-hidden>
      <Skeleton className="h-40 rounded-3xl" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-56 rounded-3xl" />
        <Skeleton className="h-56 rounded-3xl" />
      </div>
    </div>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}
