"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { inviteVolunteer } from "@/lib/actions/seeker";

export function InviteButton({ callId, volunteerId, name }: { callId: string; volunteerId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  if (!open)
    return (
      <button type="button" className="btn btn-primary btn-sm self-start" onClick={() => setOpen(true)}>
        Undang {name}
      </button>
    );
  return (
    <form
      className="space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await inviteVolunteer(callId, volunteerId, msg);
          if (res.error) toast.error(res.error);
          else toast.success(`Undangan terkirim ke ${name}`);
        });
      }}
    >
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={2} maxLength={500} className="field" placeholder={`Pesan singkat untuk ${name} (opsional)`} aria-label="Pesan undangan" />
      <div className="flex gap-2">
        <button className="btn btn-primary btn-sm" disabled={pending}>
          Kirim undangan
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>
          Batal
        </button>
      </div>
    </form>
  );
}
