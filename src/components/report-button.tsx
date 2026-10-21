"use client";

import { useState, useTransition } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { fileReport } from "@/lib/actions/common";

export function ReportButton({
  targetType,
  targetId,
  label = "Laporkan",
}: {
  targetType: "user" | "call" | "review" | "message";
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-danger">
        <Flag className="size-4" aria-hidden /> {label}
      </button>
    );
  }
  return (
    <form
      className="max-w-md space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await fileReport(targetType, targetId, reason);
          if (res.error) return void toast.error(res.error);
          toast.success("Laporan terkirim. Tim kami akan meninjaunya.");
          setOpen(false);
          setReason("");
        });
      }}
    >
      <label htmlFor={`report-${targetId}`} className="label">
        Apa masalahnya?
      </label>
      <textarea
        id={`report-${targetId}`}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        className="field"
        placeholder="Misal: meminta transfer uang, informasi palsu, perilaku tidak pantas…"
      />
      <div className="flex gap-2">
        <button className="btn btn-danger btn-sm" disabled={pending}>
          Kirim laporan
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}
