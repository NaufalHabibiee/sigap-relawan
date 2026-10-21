"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { submitReview } from "@/lib/actions/common";

const ASPECTS = {
  volunteer: [
    ["komunikasi", "Komunikasi"],
    ["kesesuaian", "Tugas sesuai deskripsi"],
    ["keamanan", "Keamanan & perlakuan"],
  ],
  seeker: [
    ["ketepatan", "Tepat waktu"],
    ["kinerja", "Kinerja"],
    ["sikap", "Sikap"],
  ],
} as const;

export function ReviewForm({ appId, role, otherName }: { appId: string; role: "volunteer" | "seeker"; otherName: string }) {
  const [rating, setRating] = useState(0);
  const [aspects, setAspects] = useState<Record<string, number>>({});
  const [body, setBody] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-2 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await submitReview(appId, rating, aspects, body);
          if (res.error) toast.error(res.error);
          else toast.success("Ulasan terkirim");
        });
      }}
    >
      <p className="text-sm text-ink-soft">Bagaimana pengalamanmu dengan {otherName}?</p>
      <Stars value={rating} onChange={setRating} label="Nilai keseluruhan" size="size-7" />
      {ASPECTS[role].map(([key, label]) => (
        <div key={key} className="flex items-center justify-between gap-2 text-sm">
          {label}
          <Stars value={aspects[key] ?? 0} onChange={(v) => setAspects((a) => ({ ...a, [key]: v }))} label={label} size="size-4" />
        </div>
      ))}
      <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={1000} className="field" placeholder="Ceritakan singkat (opsional)" aria-label="Ulasan" />
      <button className="btn btn-ink btn-sm w-full" disabled={pending || rating === 0}>
        Kirim ulasan
      </button>
      <p className="text-xs text-ink-muted">Ulasan terlihat setelah kedua pihak mengisi, atau otomatis setelah 14 hari.</p>
    </form>
  );
}

function Stars({ value, onChange, label, size }: { value: number; onChange: (v: number) => void; label: string; size: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n} bintang`} onClick={() => onChange(n)} className="rounded p-0.5">
          <Star className={`${size} ${n <= value ? "fill-ladang text-ladang" : "text-line-strong"}`} aria-hidden />
        </button>
      ))}
    </div>
  );
}
