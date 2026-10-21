import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { getFeed, getPlatformStats } from "@/lib/data";
import { formatNumber, timeAgo } from "@/lib/format";
import { LOAD_LABEL } from "@/lib/constants";
import type { CallCard } from "@/lib/types";

const DOT: Record<string, string> = {
  darurat: "bg-sigap",
  berat: "bg-ink",
  sedang: "bg-line-strong",
  ringan: "bg-guyub",
  promosi: "bg-ladang",
};

export async function LiveFeed() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const [feed, stats] = await Promise.all([getFeed(), getPlatformStats()]);

  return (
    <div className="relative overflow-hidden rounded-[22px] bg-ink text-paper shadow-[0_30px_60px_-30px_rgba(27,36,48,0.6)]">
      <div className="flex items-center justify-between gap-3 border-b border-paper/10 px-5 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <span className="live-dot inline-block size-2 rounded-full bg-sigap" aria-hidden />
          Panggilan terbaru
        </p>
        <p className="text-xs text-paper/60">
          {formatNumber(stats.active_calls)} aktif · {formatNumber(stats.volunteers)} relawan siap
        </p>
      </div>
      {feed.length === 0 ? (
        <p className="px-5 py-16 text-center text-sm text-paper/60">Belum ada panggilan aktif.</p>
      ) : (
        <div className="feed-window relative h-[25rem] overflow-hidden" aria-label="Daftar panggilan terbaru">
          <ul className="feed-track">
            {[...feed, ...feed].map((c, i) => (
              <FeedItem key={`${c.id}-${i}`} call={c} hidden={i >= feed.length} />
            ))}
          </ul>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-ink to-transparent" />
        </div>
      )}
      <Link href="/panggilan" className="block border-t border-paper/10 px-5 py-3 text-center text-sm font-semibold text-paper/80 hover:text-paper">
        Lihat semua panggilan
      </Link>
    </div>
  );
}

function FeedItem({ call, hidden }: { call: CallCard; hidden: boolean }) {
  return (
    <li aria-hidden={hidden || undefined} className="border-b border-paper/10">
      <Link
        href={`/panggilan/${call.slug}`}
        tabIndex={hidden ? -1 : undefined}
        className="flex items-start gap-3 px-5 py-3.5 hover:bg-paper/5"
      >
        <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${DOT[call.load]}`} aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[0.95rem] font-semibold">{call.title}</span>
          <span className="mt-0.5 block text-xs text-paper/60">
            {call.is_emergency ? "Darurat" : LOAD_LABEL[call.load]} · {call.mode === "online" ? "Online" : call.city?.name} · butuh {call.quota}
          </span>
        </span>
        <span className="shrink-0 pt-0.5 text-xs text-paper/50">{call.published_at ? timeAgo(call.published_at) : ""}</span>
      </Link>
    </li>
  );
}
