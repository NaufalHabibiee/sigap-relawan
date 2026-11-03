import Link from "next/link";
import { ArrowUpRight, MapPin, Siren, Sparkles, Users } from "lucide-react";
import { LOAD_LABEL } from "@/lib/constants";
import { formatNumber, timeAgo } from "@/lib/format";
import type { CallCard } from "@/lib/types";
import { CurvedMarquee } from "./curved-marquee";

type Stats = { volunteers: number; active_calls: number; completed: number; cities: number };

type Slot =
  | { kind: "call"; call: CallCard }
  | { kind: "stat"; value: string; label: string; tone: "light" | "wash" }
  | { kind: "ai" };

/** Endless row of real content under the hero: live calls, live stats and the AI demo, drifting left to right. */
export function HeroArc({ feed, stats }: { feed: CallCard[]; stats: Stats }) {
  const calls = feed.slice(0, 12);
  const slots: Slot[] = [];
  calls.forEach((call, i) => {
    slots.push({ kind: "call", call });
    if (i === 1) slots.push({ kind: "ai" });
    if (i === 3) slots.push({ kind: "stat", value: formatNumber(stats.active_calls), label: "panggilan aktif sekarang", tone: "light" });
    if (i === 5) slots.push({ kind: "stat", value: formatNumber(stats.volunteers), label: "relawan siap dikabari", tone: "wash" });
  });
  if (calls.length < 2) slots.push({ kind: "ai" });

  return (
    <CurvedMarquee>
      {slots.map((s, i) => (
        <SlotCard key={i} slot={s} hidden={false} />
      ))}
    </CurvedMarquee>
  );
}

function SlotCard({ slot, hidden }: { slot: Slot; hidden: boolean }) {
  const base = "flex h-[13.5rem] flex-col rounded-2xl p-4 shadow-[0_24px_50px_-28px_rgba(27,36,48,0.6)] ring-1";
  const tab = hidden ? -1 : undefined;

  if (slot.kind === "ai") {
    return (
      <Link href="/coba-ai" tabIndex={tab} className={`${base} group bg-ink text-paper ring-ink`}>
        <Sparkles className="size-5 text-sigap" aria-hidden />
        <p className="font-jakarta mt-3 text-[0.95rem] leading-snug">
          Satu kalimat jadi <span className="text-sigap">panggilan relawan</span>, lengkap dengan urgensi.
        </p>
        <span className="font-mono-ui mt-auto inline-flex items-center gap-1 text-[0.68rem] text-paper/70 group-hover:text-paper">
          Coba AI <ArrowUpRight className="size-3.5" aria-hidden />
        </span>
      </Link>
    );
  }

  if (slot.kind === "stat") {
    return (
      <div className={`${base} ${slot.tone === "wash" ? "bg-sigap-wash ring-sigap/20" : "bg-white/90 ring-line backdrop-blur"} justify-end`}>
        <Users className="mb-auto size-5 text-sigap-ink" aria-hidden />
        <p className="font-jakarta text-[2.6rem] leading-none font-light tracking-tight text-ink">{slot.value}</p>
        <p className="mt-2 text-sm text-ink-soft">{slot.label}</p>
      </div>
    );
  }

  const call = slot.call;
  return (
    <Link href={`/panggilan/${call.slug}`} tabIndex={tab} className={`${base} bg-white/92 ring-line backdrop-blur transition-colors hover:ring-ink/30`}>
      {call.is_emergency ? (
        <span className="font-mono-ui inline-flex items-center gap-1 self-start rounded-full bg-sigap px-2 py-0.5 text-[0.62rem] text-white">
          <Siren className="size-3" aria-hidden /> Darurat
        </span>
      ) : (
        <span className="font-mono-ui self-start rounded-full bg-paper px-2 py-0.5 text-[0.62rem] text-ink-soft">{LOAD_LABEL[call.load]}</span>
      )}
      <p className="mt-3 line-clamp-3 text-[0.95rem] leading-snug font-semibold text-ink">{call.title}</p>
      <div className="mt-auto space-y-1 text-xs text-ink-muted">
        <p className="flex items-center gap-1">
          <MapPin className="size-3.5 shrink-0" aria-hidden /> <span className="truncate">{call.mode === "online" ? "Online" : call.city?.name}</span>
        </p>
        <p className="flex items-center justify-between">
          <span>Butuh {call.quota}</span>
          {call.published_at && <span>{timeAgo(call.published_at)}</span>}
        </p>
      </div>
    </Link>
  );
}
