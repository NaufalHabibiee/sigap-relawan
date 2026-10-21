import Link from "next/link";
import { CalendarDays, Hourglass, MapPin, Siren, Users, Wifi } from "lucide-react";
import { MODE_LABEL } from "@/lib/constants";
import { daysUntil, formatDateRange, formatTime } from "@/lib/format";
import type { CallCard } from "@/lib/types";
import { Avatar, LoadTag, VerifiedMark } from "../ui";

/** Circular match gauge; strong matches use the signal colour, weaker ones stay neutral. */
export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const strong = score >= 70;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title="Tingkat kecocokan dengan profilmu">
      <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-line/70" />
        <circle
          cx="22"
          cy="22"
          r={r}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(100, score) / 100)}
          className={strong ? "stroke-sigap" : "stroke-ink-muted"}
        />
      </svg>
      <span className="absolute inset-0 flex items-baseline justify-center pt-[1.15rem] font-display leading-none font-bold">
        <span className="text-lg">{score}</span>
        <span className="text-[0.65rem] font-semibold text-ink-muted">%</span>
      </span>
    </div>
  );
}

function deadlineLabel(deadline: string): string {
  const d = daysUntil(deadline);
  if (d <= 0) return "Ditutup hari ini";
  if (d === 1) return "Ditutup besok";
  return `Ditutup ${d} hari lagi`;
}

/** A recommended call as a full-width card: details and match reasons on the left, score ring on the right, deadline and actions along the bottom. */
export function MatchCard({ call, score, reasons, footer }: { call: CallCard; score: number; reasons: string[]; footer?: React.ReactNode }) {
  const time = formatTime(call.start_time);
  const urgent = call.is_emergency || call.load === "darurat";
  return (
    <article
      className={`group relative flex min-w-0 flex-col overflow-hidden rounded-3xl border bg-surface transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-24px_rgba(27,36,48,0.55)] ${
        urgent ? "border-sigap/50" : "border-line hover:border-line-strong"
      }`}
    >
      {urgent && <span className="h-1 w-full bg-sigap" aria-hidden />}
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <LoadTag load={call.load} />
            {call.is_emergency && call.load !== "darurat" && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-sigap-ink">
                <Siren className="size-3.5" aria-hidden /> Darurat
              </span>
            )}
            {call.category && <span className="text-xs font-medium text-ink-muted">{call.category.name}</span>}
            {call.status === "penuh" && <span className="text-xs font-semibold text-[#6b5410]">Kuota penuh</span>}
          </div>

          <h3 className="mt-2.5 text-lg leading-snug font-semibold">
            <Link href={`/panggilan/${call.slug}`} className="after:absolute after:inset-0 hover:underline">
              {call.title}
            </Link>
          </h3>

          {call.seeker && (
            <p className="relative z-10 mt-2 inline-flex max-w-full items-center gap-2 text-sm text-ink-soft">
              <Avatar src={call.seeker.logo_url} name={call.seeker.org_name} size={22} square />
              <span className="truncate">{call.seeker.org_name}</span>
              {call.seeker.verified && <VerifiedMark label="Penyelenggara terverifikasi" compact />}
            </p>
          )}

          <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
            <li className="flex items-center gap-1.5">
              {call.mode === "online" ? <Wifi className="size-4 shrink-0 text-ink-muted" aria-hidden /> : <MapPin className="size-4 shrink-0 text-ink-muted" aria-hidden />}
              {call.mode === "online" ? MODE_LABEL.online : (call.city?.name ?? "—")}
            </li>
            <li className="flex items-center gap-1.5">
              <CalendarDays className="size-4 shrink-0 text-ink-muted" aria-hidden />
              {formatDateRange(call.start_date, call.end_date)}
              {time && ` · ${time}`}
            </li>
            <li className="flex items-center gap-1.5">
              <Users className="size-4 shrink-0 text-ink-muted" aria-hidden />
              {call.quota} relawan
            </li>
          </ul>

          {reasons.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {reasons.slice(0, 3).map((r) => (
                <li key={r} className="rounded-full bg-guyub-wash px-2.5 py-1 text-xs font-medium text-guyub-deep">
                  {r}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:w-16 sm:flex-col sm:gap-1.5">
          <ScoreRing score={score} />
          <span className="text-xs font-semibold text-ink-muted">cocok</span>
        </div>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-3 border-t border-line/70 bg-paper/50 px-5 py-2.5">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <Hourglass className="size-3.5" aria-hidden />
          {deadlineLabel(call.deadline)}
        </span>
        {footer}
      </div>
    </article>
  );
}
