"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelApplication } from "@/lib/actions/common";
import { decideApplication, markAttendance } from "@/lib/actions/seeker";
import { respondInvite } from "@/lib/actions/volunteer";
import { todayJakarta } from "@/lib/format";
import type { ActionResult, AppStatus, CallStatus } from "@/lib/types";

export function ThreadActions({
  appId,
  role,
  status,
  callStatus,
  startDate,
}: {
  appId: string;
  role: "volunteer" | "seeker";
  status: AppStatus;
  callStatus: CallStatus;
  startDate: string;
}) {
  const [pending, start] = useTransition();
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");

  function run(fn: () => Promise<ActionResult>, ok: string) {
    start(async () => {
      const res = await fn();
      if (res.error) toast.error(res.error);
      else toast.success(ok);
    });
  }

  const canCancel = ["applied", "invited", "reviewing", "accepted"].includes(status) && !(role === "volunteer" && status === "invited");
  const started = todayJakarta() >= startDate;

  return (
    <div className="mt-4 space-y-2">
      {role === "volunteer" && status === "invited" && (
        <div className="grid grid-cols-2 gap-2">
          <button className="btn btn-guyub btn-sm" disabled={pending} onClick={() => run(() => respondInvite(appId, true), "Undangan diterima. Selamat bergabung!")}>
            Terima undangan
          </button>
          <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => run(() => respondInvite(appId, false), "Undangan ditolak")}>
            Tolak
          </button>
        </div>
      )}

      {role === "seeker" && (status === "applied" || status === "reviewing") && (
        <div className="grid gap-2">
          <button
            className="btn btn-guyub btn-sm"
            disabled={pending || callStatus !== "aktif"}
            onClick={() => run(() => decideApplication(appId, "accepted"), "Relawan diterima")}
          >
            Terima relawan
          </button>
          <div className="grid grid-cols-2 gap-2">
            {status === "applied" && (
              <button className="btn btn-outline btn-sm" disabled={pending} onClick={() => run(() => decideApplication(appId, "reviewing"), "Ditandai sedang ditinjau")}>
                Tinjau dulu
              </button>
            )}
            <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => run(() => decideApplication(appId, "rejected"), "Lamaran ditolak")}>
              Tolak
            </button>
          </div>
          {callStatus !== "aktif" && <p className="text-xs text-ink-muted">Kuota penuh atau panggilan ditutup.</p>}
        </div>
      )}

      {role === "seeker" && status === "accepted" && (
        <div>
          <p className="text-xs font-semibold text-ink-muted">Kehadiran</p>
          {started ? (
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button className="btn btn-guyub btn-sm" disabled={pending} onClick={() => run(() => markAttendance(appId, true), "Ditandai hadir. Jangan lupa beri ulasan.")}>
                Hadir
              </button>
              <button className="btn btn-danger btn-sm" disabled={pending} onClick={() => run(() => markAttendance(appId, false), "Ditandai tidak hadir")}>
                Tidak hadir
              </button>
            </div>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">Bisa ditandai mulai tanggal kegiatan.</p>
          )}
        </div>
      )}

      {canCancel &&
        (cancelling ? (
          <form
            className="space-y-2 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => cancelApplication(appId, reason), "Dibatalkan");
              setCancelling(false);
            }}
          >
            <label htmlFor="cancel-reason" className="label">
              Alasan pembatalan
            </label>
            <textarea id="cancel-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="field" required />
            <div className="flex gap-2">
              <button className="btn btn-danger btn-sm" disabled={pending || !reason.trim()}>
                Batalkan keikutsertaan
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setCancelling(false)}>
                Kembali
              </button>
            </div>
          </form>
        ) : (
          <button type="button" className="text-sm text-ink-muted hover:text-danger hover:underline" onClick={() => setCancelling(true)}>
            {role === "volunteer" ? "Batalkan lamaran" : "Batalkan relawan ini"}
          </button>
        ))}
    </div>
  );
}
