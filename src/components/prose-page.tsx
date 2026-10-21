import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDown, LifeBuoy } from "lucide-react";
import { Container } from "./ui";

type Section = { h: string; body: ReactNode };

/**
 * Static content pages. `faq` renders each section as a collapsible card plus a contact prompt,
 * `cards` as numbered cards, and `prose` (default) as plain long-form text for legal pages.
 */
export function ProsePage({
  title,
  intro,
  sections,
  variant = "prose",
}: {
  title: string;
  intro?: string;
  sections: Section[];
  variant?: "prose" | "faq" | "cards";
}) {
  if (variant === "prose") {
    return (
      <Container className="max-w-3xl py-12">
        <h1 className="h-section text-3xl sm:text-4xl">{title}</h1>
        {intro && <p className="mt-4 text-lg text-ink-soft">{intro}</p>}
        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-lg font-semibold">{s.h}</h2>
              <div className="mt-2 space-y-2 text-ink-soft">{s.body}</div>
            </section>
          ))}
        </div>
      </Container>
    );
  }

  return (
    <Container className="max-w-4xl py-12">
      <header className="relative overflow-hidden rounded-3xl bg-ink p-8 text-paper sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(28rem_16rem_at_90%_0%,rgba(232,98,44,0.35),transparent_70%),radial-gradient(circle_at_1px_1px,rgba(238,236,229,0.08)_1px,transparent_0)] [background-size:auto,24px_24px]"
        />
        <div className="relative">
          <h1 className="h-section text-3xl sm:text-4xl">{title}</h1>
          {intro && <p className="mt-3 max-w-2xl text-lg leading-relaxed text-paper/75">{intro}</p>}
        </div>
      </header>

      {variant === "faq" ? (
        <div className="mt-6 space-y-3">
          {sections.map((s) => (
            <details key={s.h} className="group rounded-3xl border border-line bg-surface px-6 py-5 open:border-line-strong">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                {s.h}
                <ChevronDown className="size-5 shrink-0 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <div className="mt-3 space-y-2 leading-relaxed text-ink-soft">{s.body}</div>
            </details>
          ))}
          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-6">
            <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl bg-sigap-wash text-sigap-ink">
              <LifeBuoy className="size-6" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">Masih butuh bantuan?</p>
              <p className="text-sm text-ink-soft">Gunakan tombol Laporkan di percakapan atau halaman profil, tim Sigap akan menindaklanjuti.</p>
            </div>
            <Link href="/panggilan" className="btn btn-outline btn-sm">
              Jelajah panggilan
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {sections.map((s, i) => (
            <section key={s.h} className={`rounded-3xl border border-line bg-surface p-6 ${i === 0 ? "md:col-span-2" : ""}`}>
              <span className="inline-flex size-10 items-center justify-center rounded-xl bg-sigap-wash font-display text-sm font-bold text-sigap-ink">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-lg font-semibold">{s.h}</h2>
              <div className="mt-2 space-y-2 leading-relaxed text-ink-soft">{s.body}</div>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
