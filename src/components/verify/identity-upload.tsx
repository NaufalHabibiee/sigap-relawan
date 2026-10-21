"use client";

import { useState, useTransition } from "react";
import { FileCheck2, Upload } from "lucide-react";
import { toast } from "sonner";
import { submitVerification } from "@/lib/actions/common";
import { DOC_TYPES, uploadFile } from "@/lib/upload";

type Slot = { key: string; label: string; hint: string; folder: "ktp" | "legal" };

export function IdentityUpload({ userId, slots, askNik, disabledReason }: { userId: string; slots: Slot[]; askNik: boolean; disabledReason?: string }) {
  const [paths, setPaths] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [nik, setNik] = useState("");
  const [note, setNote] = useState("");
  const [pending, start] = useTransition();

  async function onFile(slot: Slot, file: File | undefined) {
    if (!file) return;
    setBusy(slot.key);
    try {
      const path = await uploadFile("private-docs", `${userId}/${slot.folder}`, file, DOC_TYPES);
      setPaths((p) => ({ ...p, [slot.key]: path }));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const ready = slots.every((s) => paths[s.key]) && (!askNik || /^\d{4}$/.test(nik));

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {slots.map((s) => (
          <label key={s.key} className="flex cursor-pointer flex-col gap-2 rounded-xl border-2 border-dashed border-line-strong p-4 hover:border-ink">
            <span className="inline-flex items-center gap-2 font-semibold">
              {paths[s.key] ? <FileCheck2 className="size-5 text-guyub" aria-hidden /> : <Upload className="size-5" aria-hidden />}
              {s.label}
            </span>
            <span className="text-sm text-ink-muted">{busy === s.key ? "Mengunggah…" : paths[s.key] ? "Terunggah. Klik untuk mengganti." : s.hint}</span>
            <input type="file" accept={DOC_TYPES.join(",")} className="sr-only" onChange={(e) => onFile(s, e.target.files?.[0])} />
          </label>
        ))}
      </div>
      {askNik && (
        <label className="block max-w-xs">
          <span className="label">4 digit terakhir NIK</span>
          <input value={nik} onChange={(e) => setNik(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" className="field font-mono tracking-widest" />
          <span className="hint block">Kami hanya menyimpan 4 digit ini. Foto dihapus setelah ditinjau.</span>
        </label>
      )}
      <label className="block">
        <span className="label">Catatan untuk admin (opsional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className="field" />
      </label>
      {disabledReason && <p className="text-sm text-sigap-ink">{disabledReason}</p>}
      <button
        type="button"
        className="btn btn-ink"
        disabled={!ready || pending || Boolean(disabledReason)}
        onClick={() =>
          start(async () => {
            const res = await submitVerification(Object.values(paths), nik, note);
            if (res.error) return void toast.error(res.error);
            toast.success("Pengajuan terkirim. Admin meninjau dalam 1×24 jam.");
          })
        }
      >
        {pending ? "Mengirim…" : "Ajukan verifikasi"}
      </button>
    </div>
  );
}
