"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { announce, closeCall, deleteDraft, duplicateCall, publishCall, refreshCallMatches } from "@/lib/actions/seeker";
import type { ActionResult, CallStatus } from "@/lib/types";

export function CallControls({ call }: { call: { id: string; slug: string; status: CallStatus; acceptedCount: number } }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [panel, setPanel] = useState<"cancel" | "announce" | null>(null);
  const [text, setText] = useState("");

  function run(fn: () => Promise<ActionResult & { matches?: number; count?: number }>, ok: (r: { matches?: number; count?: number }) => string, after?: () => void) {
    start(async () => {
      const res = await fn();
      if (res.error) return void toast.error(res.error);
      toast.success(ok(res));
      after?.();
    });
  }

  const live = call.status === "aktif" || call.status === "penuh";
  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {call.status === "draf" && (
          <>
            <button className="btn btn-primary btn-sm" disabled={pending} onClick={() => run(() => publishCall(call.id), (r) => `Tayang. ${r.matches ?? 0} relawan cocok dikabari.`)}>
              Publikasikan
            </button>
            <Link href={`/p/panggilan/${call.id}/ubah`} className="btn btn-outline btn-sm">
              Lanjutkan mengisi
            </Link>
            <button
              className="btn btn-ghost btn-sm text-danger"
              disabled={pending}
              onClick={() => window.confirm("Hapus draf ini?") && run(() => deleteDraft(call.id), () => "Draf dihapus", () => router.push("/p"))}
            >
              Hapus draf
            </button>
          </>
        )}
        {live && (
          <>
            <Link href={`/p/panggilan/${call.id}/ubah`} className="btn btn-outline btn-sm">
              Ubah
            </Link>
            {call.status === "aktif" && (
              <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => run(() => refreshCallMatches(call.id), (r) => `${r.matches ?? 0} relawan cocok`)}>
                Hitung ulang kecocokan
              </button>
            )}
            {call.acceptedCount > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => setPanel(panel === "announce" ? null : "announce")}>
                Kirim pengumuman
              </button>
            )}
            <button
              className="btn btn-ghost btn-sm"
              disabled={pending}
              onClick={() => window.confirm("Tutup pendaftaran? Relawan yang sudah diterima tetap ikut.") && run(() => closeCall(call.id, false, ""), () => "Pendaftaran ditutup")}
            >
              Tutup pendaftaran
            </button>
            <button className="btn btn-ghost btn-sm text-danger" onClick={() => setPanel(panel === "cancel" ? null : "cancel")}>
              Batalkan kegiatan
            </button>
          </>
        )}
        <button
          className="btn btn-ghost btn-sm"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await duplicateCall(call.id);
              if (res.error || !res.id) return void toast.error(res.error ?? "Gagal menggandakan");
              toast.success("Draf salinan dibuat. Atur tanggalnya lalu publikasikan.");
              router.push(`/p/panggilan/${res.id}/ubah`);
            })
          }
        >
          Duplikat
        </button>
        {call.status !== "draf" && (
          <>
            <a href={`/p/panggilan/${call.id}/ekspor`} className="btn btn-ghost btn-sm" download>
              Ekspor CSV
            </a>
            <Link href={`/panggilan/${call.slug}`} className="btn btn-ghost btn-sm" target="_blank">
              Lihat halaman publik
            </Link>
          </>
        )}
      </div>

      {panel && (
        <form
          className="panel mt-3 max-w-xl space-y-2 p-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (panel === "cancel") run(() => closeCall(call.id, true, text), () => "Kegiatan dibatalkan, relawan sudah dikabari", () => setPanel(null));
            else run(() => announce(call.id, text), (r) => `Pengumuman terkirim ke ${r.count ?? 0} relawan`, () => {
              setPanel(null);
              setText("");
            });
          }}
        >
          <label htmlFor="panel-text" className="label">
            {panel === "cancel" ? "Alasan pembatalan (dikirim ke semua relawan)" : "Pengumuman untuk semua relawan yang diterima"}
          </label>
          <textarea id="panel-text" value={text} onChange={(e) => setText(e.target.value)} rows={3} className="field" required />
          <button className={`btn btn-sm ${panel === "cancel" ? "btn-danger" : "btn-ink"}`} disabled={pending || !text.trim()}>
            {panel === "cancel" ? "Batalkan kegiatan" : "Kirim"}
          </button>
        </form>
      )}
    </div>
  );
}
