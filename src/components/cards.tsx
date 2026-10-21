import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared building blocks for dashboard and profile pages.
 * Every Card and Tile uses the same radius, border and padding so edges line up in the grid.
 */

export function Card({ icon: Icon, title, meta, action, children, className = "" }: { icon?: LucideIcon; title: string; meta?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`h-full rounded-3xl border border-line bg-surface p-6 ${className}`}>
      <header className="flex items-center gap-3">
        {Icon && (
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-ink-soft">
            <Icon className="size-5" aria-hidden />
          </span>
        )}
        <h2 className="h-section min-w-0 flex-1 text-lg">{title}</h2>
        {meta && <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-ink-soft">{meta}</span>}
        {action}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function Tile({ icon: Icon, tint = "bg-paper text-ink-soft", value, label, sub, href }: { icon: LucideIcon; tint?: string; value: ReactNode; label: string; sub?: string; href?: string }) {
  const body = (
    <>
      <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl ${tint}`}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-3xl leading-none font-bold">{value}</span>
        <span className="mt-1.5 block text-sm leading-snug text-ink-muted">{label}</span>
        {sub && <span className="mt-0.5 block text-xs font-medium text-ink-soft">{sub}</span>}
      </span>
    </>
  );
  const cls = "flex items-center gap-4 rounded-3xl border border-line bg-surface p-6";
  return <li>{href ? <Link href={href} className={`${cls} transition-colors hover:border-line-strong`}>{body}</Link> : <div className={cls}>{body}</div>}</li>;
}

/** Row of tiles: 2 columns on small screens, 4 on large. */
export function TileGrid({ children }: { children: ReactNode }) {
  return <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4 [&>li]:h-full [&>li>*]:h-full">{children}</ul>;
}

/** Two cards side by side at 8/4 columns; if one is missing the other takes the full row instead of leaving a hole. */
export function Row({ main, side }: { main?: ReactNode; side?: ReactNode }) {
  if (!main && !side) return null;
  const both = Boolean(main && side);
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {main && <div className={both ? "lg:col-span-8" : "lg:col-span-12"}>{main}</div>}
      {side && <div className={both ? "lg:col-span-4" : "lg:col-span-12"}>{side}</div>}
    </div>
  );
}

/** Dark gradient hero used at the top of dashboards. */
export function Hero({ children, aside }: { children: ReactNode; aside?: ReactNode }) {
  return (
    <header className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_18rem_at_88%_0%,rgba(232,98,44,0.38),transparent_70%),radial-gradient(circle_at_1px_1px,rgba(238,236,229,0.08)_1px,transparent_0)] [background-size:auto,24px_24px]"
      />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 max-w-xl">{children}</div>
        {aside}
      </div>
    </header>
  );
}
