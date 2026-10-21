import { MessageSquareReply, Star } from "lucide-react";
import { formatDate, initials } from "@/lib/format";
import type { Review } from "@/lib/types";

export function ReviewsList({ reviews, ownerName }: { reviews: Review[]; ownerName: string }) {
  if (!reviews.length) return <p className="text-ink-muted">Belum ada ulasan.</p>;
  return (
    <ul className="divide-y divide-line">
      {reviews.map((r) => (
        <li key={r.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-paper" aria-hidden>
              {initials(r.reviewer_name)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                <p className="font-semibold">{r.reviewer_name}</p>
                <span className="inline-flex" aria-label={`${r.rating} dari 5 bintang`}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} className={`size-4 ${n <= r.rating ? "fill-ladang text-ladang" : "text-line-strong"}`} aria-hidden />
                  ))}
                </span>
              </div>
              <p className="text-xs text-ink-muted">
                {r.call_title} · {formatDate(r.created_at)}
              </p>
            </div>
          </div>
          {r.body && <p className="mt-3 max-w-[65ch] leading-relaxed text-ink-soft">{r.body}</p>}
          {r.reply && (
            <div className="mt-3 flex gap-2.5 rounded-xl bg-paper px-3.5 py-3 text-sm">
              <MessageSquareReply className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
              <p>
                <span className="font-semibold">Balasan {ownerName}:</span> {r.reply}
              </p>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
