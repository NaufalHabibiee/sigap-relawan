"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { dismissMatch } from "@/lib/actions/volunteer";

export function DismissMatch({ callId }: { callId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await dismissMatch(callId);
          if (res.error) toast.error(res.error);
          else toast("Panggilan disembunyikan dari rekomendasimu.");
        })
      }
      className="text-xs font-medium text-ink-muted hover:text-ink hover:underline"
    >
      Tidak tertarik
    </button>
  );
}
