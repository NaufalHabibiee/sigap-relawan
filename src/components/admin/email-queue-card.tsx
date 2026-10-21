"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { sendPendingEmails } from "@/lib/actions/admin";

export function EmailQueueCard({ pending: count, configured }: { pending: number; configured: boolean }) {
  const [busy, start] = useTransition();

  function send() {
    start(async () => {
      const res = await sendPendingEmails();
      if (res.error || !res.result) return void toast.error(res.error ?? "Gagal mengirim");
      const r = res.result;
      if (!r.configured) return void toast("Penyedia email belum diatur. Isi RESEND_API_KEY dulu.");
      toast.success(`Terkirim ${r.sent}, dilewati ${r.skipped} (akun demo), gagal ${r.failed}.`);
    });
  }

  return (
    <div>
      <p className="text-sm font-semibold">Antrean email</p>
      <p className="mt-1 text-sm text-ink-soft">
        {count} notifikasi menunggu dikirim.
        {!configured && " Penyedia email belum diatur (RESEND_API_KEY), jadi belum ada yang terkirim."}
      </p>
      <button type="button" className="btn btn-outline btn-sm mt-3" disabled={busy || count === 0} onClick={send}>
        {busy ? "Mengirim…" : "Kirim sekarang"}
      </button>
    </div>
  );
}
