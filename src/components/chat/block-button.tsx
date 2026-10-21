"use client";

import { useTransition } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { toggleBlock } from "@/lib/actions/common";

export function BlockButton({ userId, blocked }: { userId: string; blocked: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!blocked && !window.confirm("Blokir pengguna ini? Kalian tidak bisa saling mengirim pesan.")) return;
        start(async () => {
          const res = await toggleBlock(userId, !blocked);
          if (res.error) toast.error(res.error);
          else toast.success(blocked ? "Blokir dibuka" : "Pengguna diblokir");
        });
      }}
      className="inline-flex items-center gap-1.5 text-sm text-ink-muted hover:text-danger"
    >
      <Ban className="size-4" aria-hidden /> {blocked ? "Buka blokir" : "Blokir"}
    </button>
  );
}
