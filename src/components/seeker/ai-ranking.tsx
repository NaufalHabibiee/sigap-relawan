"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { rankMatchesWithAi, type RankedVolunteer } from "@/lib/actions/ai";

type Vol = { id: string; nickname: string | null };

export function AiRanking({ callId, volunteers }: { callId: string; volunteers: Vol[] }) {
  const [pending, start] = useTransition();
  const [ranked, setRanked] = useState<RankedVolunteer[] | null>(null);
  const [source, setSource] = useState<"ai" | "aturan">("ai");
  const names = new Map(volunteers.map((v) => [v.id, v.nickname ?? "Relawan"]));

  function run() {
    start(async () => {
      const res = await rankMatchesWithAi(callId);
      if (res.error) return void toast.error(res.error);
      setRanked(res.ranked ?? []);
      setSource(res.source ?? "ai");
    });
  }

  return (
    <section className="panel mb-4 space-y-4 border-sigap p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="h-section inline-flex items-center gap-2 text-lg">
            <Sparkles className="size-5 text-sigap-ink" aria-hidden /> Pilihan teratas AI
          </h2>
          <p className="text-sm text-ink-muted">AI membaca tugas panggilan, skill, bio, dan lokasi relawan, lalu memilih 5 yang paling cocok beserta alasannya.</p>
        </div>
        <button type="button" className="btn btn-primary btn-sm" disabled={pending} onClick={run}>
          {pending ? "AI sedang menilai…" : ranked ? "Nilai ulang" : "Pilihkan dengan AI"}
        </button>
      </div>
      {ranked && ranked.length === 0 && <p className="text-sm text-ink-muted">Belum ada relawan untuk dinilai.</p>}
      {ranked && ranked.length > 0 && (
        <ol className="space-y-3">
          {ranked.map((r, i) => (
            <li key={r.volunteer_id} className="flex gap-3 rounded-2xl border border-line p-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-paper">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {names.get(r.volunteer_id) ?? "Relawan"} <span className="ml-1 text-sm font-medium text-sigap-ink">{r.fit}% cocok</span>
                </p>
                <p className="text-sm text-ink-soft">{r.reason}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {ranked && source === "aturan" && <p className="text-xs text-ink-muted">Mode cadangan: layanan AI sedang tidak tersedia, urutan memakai skor sistem.</p>}
    </section>
  );
}
