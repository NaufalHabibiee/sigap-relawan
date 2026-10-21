"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { setEmailNotifications } from "@/lib/actions/common";

export function EmailPrefCard({ initial, email }: { initial: boolean; email: string | null }) {
  const [on, setOn] = useState(initial);
  const [pending, start] = useTransition();

  function toggle(next: boolean) {
    setOn(next);
    start(async () => {
      const res = await setEmailNotifications(next);
      if (res.error) {
        setOn(!next);
        toast.error(res.error);
      } else {
        toast.success(next ? "Notifikasi email diaktifkan" : "Notifikasi email dimatikan");
      }
    });
  }

  return (
    <section className="panel p-5">
      <label className="flex items-start gap-3">
        <input type="checkbox" checked={on} disabled={pending} onChange={(e) => toggle(e.target.checked)} className="mt-1 size-4 accent-[var(--ink)]" />
        <span>
          <span className="flex items-center gap-2 font-semibold">
            <Mail className="size-4" aria-hidden /> Kirim notifikasi ke email
          </span>
          <span className="block text-sm text-ink-soft">
            Kabar penting (panggilan cocok, undangan, keputusan lamaran, pengingat) juga dikirim ke {email ?? "emailmu"}. Pesan chat tidak ikut dikirim lewat email.
          </span>
        </span>
      </label>
    </section>
  );
}
