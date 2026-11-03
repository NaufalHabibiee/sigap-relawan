"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarCheck, Users } from "lucide-react";
import { demoDraftWithAi, type CallDraft } from "@/lib/actions/ai";
import { LOAD_LABEL } from "@/lib/constants";
import { AiDraftPanel } from "./seeker/call-form";

const EXAMPLES = [
  "air sudah sepinggang di Kampung Pulo, banyak lansia belum dievakuasi, butuh 10 orang malam ini",
  "butuh 5 relawan bagi sembako, wajib transfer uang pendaftaran 50rb dulu, chat lewat WA",
  "cari 3 kakak pengajar matematika anak SD tiap Sabtu sore di Muara Angke",
];

export function DemoAi() {
  const [draft, setDraft] = useState<CallDraft | null>(null);
  const [category, setCategory] = useState<string | undefined>();
  const [key, setKey] = useState(0);
  const [seed, setSeed] = useState("");

  async function run(text: string) {
    const res = await demoDraftWithAi(text);
    setCategory(res.category);
    return res;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <span className="text-sm text-ink-muted">Contoh:</span>
        {EXAMPLES.map((e) => (
          <button
            key={e}
            type="button"
            className="rounded-full border border-line bg-surface px-3 py-1 text-left text-sm hover:border-line-strong"
            onClick={() => {
              setSeed(e);
              setKey((k) => k + 1);
            }}
          >
            {e.length > 48 ? `${e.slice(0, 48)}…` : e}
          </button>
        ))}
      </div>
      <AiDraftPanel key={key} initial={seed} onApply={setDraft} verified draft={run} maxLength={400} />
      {draft && (
        <section className="panel space-y-3 p-5 sm:p-7">
          <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Draf panggilan dari AI</p>
          <h2 className="h-section text-xl">{draft.title}</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {category && <span className="rounded-full bg-guyub-wash px-3 py-1 text-guyub-deep">{category}</span>}
            <span className="rounded-full bg-ladang-wash px-3 py-1 text-[#6b5410]">Beban: {LOAD_LABEL[draft.load]}</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-3 py-1 ring-1 ring-line">
              <Users className="size-3.5" aria-hidden /> {draft.quota} relawan
            </span>
          </div>
          <p className="whitespace-pre-line text-ink-soft">{draft.description}</p>
          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <Link href="/daftar" className="btn btn-primary btn-sm">
              <CalendarCheck className="size-4" aria-hidden /> Daftar dan publikasikan
            </Link>
            <span className="self-center text-sm text-ink-muted">Setelah tayang, sistem mencocokkan dan mengabari relawan yang paling sesuai.</span>
          </div>
        </section>
      )}
    </div>
  );
}
