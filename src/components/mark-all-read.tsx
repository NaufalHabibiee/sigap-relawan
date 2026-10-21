"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { markAllNotificationsRead } from "@/lib/actions/common";

export function MarkAllRead() {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await markAllNotificationsRead();
          if (res.error) toast.error(res.error);
        })
      }
    >
      Tandai semua dibaca
    </button>
  );
}
