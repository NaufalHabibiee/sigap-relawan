"use client";

import { useOptimistic, useTransition } from "react";
import { Bookmark } from "lucide-react";
import { toast } from "sonner";
import { toggleSaved } from "@/lib/actions/volunteer";

export function SaveButton({ callId, saved }: { callId: string; saved: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(saved);
  const [, start] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={() =>
        start(async () => {
          setOptimistic(!optimistic);
          const res = await toggleSaved(callId, !optimistic);
          if (res.error) toast.error(res.error);
        })
      }
      className="btn btn-ghost btn-sm mt-3 w-full"
    >
      <Bookmark className={`size-4 ${optimistic ? "fill-ink" : ""}`} aria-hidden />
      {optimistic ? "Tersimpan" : "Simpan untuk nanti"}
    </button>
  );
}
