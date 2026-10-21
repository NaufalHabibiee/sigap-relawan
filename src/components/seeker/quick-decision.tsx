"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { decideApplication } from "@/lib/actions/seeker";

export function QuickDecision({ appId }: { appId: string }) {
  const [pending, start] = useTransition();
  const decide = (status: "accepted" | "rejected") =>
    start(async () => {
      const res = await decideApplication(appId, status);
      if (res.error) toast.error(res.error);
      else toast.success(status === "accepted" ? "Relawan diterima" : "Lamaran ditolak");
    });
  return (
    <div className="flex gap-1.5">
      <button type="button" className="btn btn-guyub btn-sm" disabled={pending} onClick={() => decide("accepted")}>
        Terima
      </button>
      <button type="button" className="btn btn-ghost btn-sm" disabled={pending} onClick={() => decide("rejected")}>
        Tolak
      </button>
    </div>
  );
}
