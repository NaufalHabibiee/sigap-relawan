"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { applyToCall } from "@/lib/actions/volunteer";
import { uploadFile } from "@/lib/upload";

export function ApplyPanel({
  callId,
  open,
  levelOk,
  minLevel,
  level,
  needCv,
  questions,
  profileCv,
  userId,
}: {
  callId: string;
  open: boolean;
  levelOk: boolean;
  minLevel: number;
  level: number;
  needCv: boolean;
  questions: string[];
  profileCv: string | null;
  userId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, start] = useTransition();
  const [cvChoice, setCvChoice] = useState<"profile" | "upload" | "none">(profileCv ? "profile" : needCv ? "upload" : "none");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!open) return <p className="text-sm text-ink-soft">Panggilan ini tidak sedang menerima pendaftaran.</p>;
  if (!levelOk) {
    return (
      <div>
        <p className="text-sm text-ink-soft">
          {level === 0
            ? "Lengkapi profil dan verifikasi nomor HP untuk bisa melamar."
            : `Panggilan ini butuh verifikasi Level ${minLevel}: identitas (KTP) dan kontak darurat.`}
        </p>
        <Link href={level === 0 ? "/r/profil" : "/r/verifikasi"} className="btn btn-ink mt-4 w-full">
          {level === 0 ? "Lengkapi profil" : "Ajukan verifikasi identitas"}
        </Link>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button type="button" className="btn btn-primary w-full py-3" onClick={() => setExpanded(true)}>
        Lamar sekarang
      </button>
    );
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const message = String(fd.get("message") ?? "");
    const answers = questions.map((_, i) => String(fd.get(`answer_${i}`) ?? "").trim());
    if (answers.some((a) => !a)) return setError("Jawab semua pertanyaan penyelenggara.");
    start(async () => {
      let cvPath: string | null = null;
      try {
        if (cvChoice === "profile") cvPath = profileCv;
        if (cvChoice === "upload") {
          if (!file) return setError("Pilih berkas CV (PDF).");
          cvPath = await uploadFile("private-docs", `${userId}/cv`, file, ["application/pdf"]);
        }
      } catch (err) {
        return setError((err as Error).message);
      }
      if (needCv && !cvPath) return setError("Panggilan ini mewajibkan CV.");
      const res = await applyToCall(callId, message, answers, cvPath);
      if (res.error) return setError(res.error);
      toast.success("Lamaran terkirim. Pantau statusnya di Pesan.");
      router.push(`/pesan/${res.appId}`);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor="message" className="label">
          Pesan untuk penyelenggara <span className="font-normal text-ink-muted">(opsional)</span>
        </label>
        <textarea id="message" name="message" rows={3} maxLength={500} className="field" placeholder="Kenapa kamu tertarik, pengalaman yang relevan…" />
      </div>
      {questions.map((q, i) => (
        <div key={i}>
          <label htmlFor={`answer_${i}`} className="label">
            {q}
          </label>
          <textarea id={`answer_${i}`} name={`answer_${i}`} rows={2} maxLength={1000} className="field" required />
        </div>
      ))}
      <fieldset>
        <legend className="label">CV {needCv ? <span className="text-sigap-ink">(wajib)</span> : <span className="font-normal text-ink-muted">(opsional)</span>}</legend>
        <div className="space-y-1.5 text-sm">
          {profileCv && (
            <label className="flex items-center gap-2">
              <input type="radio" name="cv" checked={cvChoice === "profile"} onChange={() => setCvChoice("profile")} /> Pakai CV di profilku
            </label>
          )}
          <label className="flex items-center gap-2">
            <input type="radio" name="cv" checked={cvChoice === "upload"} onChange={() => setCvChoice("upload")} /> Unggah CV lain (PDF, maks 5 MB)
          </label>
          {!needCv && (
            <label className="flex items-center gap-2">
              <input type="radio" name="cv" checked={cvChoice === "none"} onChange={() => setCvChoice("none")} /> Tanpa CV
            </label>
          )}
        </div>
        {cvChoice === "upload" && (
          <input type="file" accept="application/pdf" className="mt-2 block w-full text-sm" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        )}
      </fieldset>
      {error && (
        <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <button className="btn btn-primary w-full py-3" disabled={pending}>
        {pending ? "Mengirim…" : "Kirim lamaran"}
      </button>
      <p className="text-xs text-ink-muted">Setelah melamar, penyelenggara bisa melihat nama lengkap, keterbatasan, dan CV-mu.</p>
    </form>
  );
}
