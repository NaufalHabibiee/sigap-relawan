"use client";

import { Suspense, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Dashboard areas (same prefixes the proxy protects) get their own chrome: no site header, no footer, no footer gap. */
const isDashboard = (path: string) => /^\/(r|p|admin|pesan|notifikasi)(\/|$)/.test(path);

function MainInner({ children }: { children: ReactNode }) {
  const dashboard = isDashboard(usePathname());
  return <main className={dashboard ? "flex-1" : "flex-1 pb-[var(--footer-gap)]"}>{children}</main>;
}

export function SiteMain({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<main className="flex-1 pb-[var(--footer-gap)]">{children}</main>}>
      <MainInner>{children}</MainInner>
    </Suspense>
  );
}

function HideInner({ children }: { children: ReactNode }) {
  return isDashboard(usePathname()) ? null : <>{children}</>;
}

/** Renders its children (site header, footer) everywhere except dashboards. */
export function HideOnDashboard({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <HideInner>{children}</HideInner>
    </Suspense>
  );
}
