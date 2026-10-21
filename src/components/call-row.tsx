import Link from "next/link";
import { CalendarDays, MapPin, Users, Wifi } from "lucide-react";
import { MODE_LABEL } from "@/lib/constants";
import { formatDateRange, formatTime } from "@/lib/format";
import type { CallCard } from "@/lib/types";
import { Avatar, LoadTag, ScoreBadge, VerifiedMark } from "./ui";

/** A call as a dispatch-board row: the left stripe carries the task weight colour. */
export function CallRow({
  call,
  score,
  reasons,
  accepted,
  footer,
}: {
  call: CallCard;
  score?: number;
  reasons?: string[];
  accepted?: number;
  footer?: React.ReactNode;
}) {
  const stripe =
    call.load === "darurat"
      ? "bg-sigap"
      : call.load === "berat"
        ? "bg-ink"
        : call.load === "promosi"
          ? "bg-ladang"
          : call.load === "ringan"
            ? "bg-guyub"
            : "bg-line-strong";
  const time = formatTime(call.start_time);
  return (
    <article className="group relative overflow-hidden rounded-3xl border border-line bg-surface transition-colors hover:border-line-strong">
      <span className={`absolute inset-y-0 left-0 w-1.5 ${stripe}`} aria-hidden />
      <div className="flex min-w-0 flex-col gap-3 p-4 pl-5 sm:flex-row sm:items-start sm:gap-5 sm:p-5 sm:pl-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <LoadTag load={call.load} />
            {call.category && <span className="text-xs font-medium text-ink-muted">{call.category.name}</span>}
            {call.status === "penuh" && <span className="text-xs font-semibold text-[#6b5410]">Kuota penuh</span>}
          </div>
          <h3 className="mt-2 text-lg leading-snug font-semibold">
            <Link href={`/panggilan/${call.slug}`} className="after:absolute after:inset-0 hover:underline">
              {call.title}
            </Link>
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              {call.mode === "online" ? <Wifi className="size-4" aria-hidden /> : <MapPin className="size-4" aria-hidden />}
              {call.mode === "online" ? MODE_LABEL.online : (call.city?.name ?? "—")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden />
              {formatDateRange(call.start_date, call.end_date)}
              {time && ` · ${time}`}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-4" aria-hidden />
              {accepted != null ? `${accepted}/${call.quota} relawan` : `${call.quota} relawan`}
            </span>
          </div>
          {reasons && reasons.length > 0 && (
            <p className="mt-2 text-sm text-guyub-deep">{reasons.slice(0, 3).join(" · ")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 sm:flex-col sm:items-end">
          {score != null && <ScoreBadge score={score} />}
          {call.seeker && (
            <span className="relative z-10 inline-flex max-w-56 items-center gap-2 text-sm">
              <Avatar src={call.seeker.logo_url} name={call.seeker.org_name} size={24} square />
              <span className="truncate text-ink-soft">{call.seeker.org_name}</span>
              {call.seeker.verified && <VerifiedMark label="Penyelenggara terverifikasi" compact />}
            </span>
          )}
        </div>
      </div>
      {footer && <div className="relative z-10 flex items-center justify-end border-t border-line/70 bg-paper/50 py-2 pr-4 pl-5 sm:pr-5 sm:pl-6">{footer}</div>}
    </article>
  );
}
