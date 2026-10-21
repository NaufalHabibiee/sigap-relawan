"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateVolunteerSettings } from "@/lib/actions/volunteer";
import { formatDate } from "@/lib/format";
import type { Category } from "@/lib/types";

export function SettingsForm({
  categories,
  muted,
  pausedUntil,
  standby,
  email,
}: {
  categories: Category[];
  muted: number[];
  pausedUntil: string | null;
  standby: boolean;
  email: string | null;
}) {
  const [pending, start] = useTransition();
  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await updateVolunteerSettings(fd);
          if (res.error) toast.error(res.error);
          else toast.success("Pengaturan disimpan");
        });
      }}
    >
      <section className="panel p-5">
        <h2 className="font-semibold">Jeda sementara</h2>
        <p className="text-sm text-ink-soft">Sedang sibuk? Kamu tidak akan dicocokkan selama jeda.</p>
        {pausedUntil && <p className="mt-2 text-sm text-sigap-ink">Dijeda sampai {formatDate(pausedUntil)}.</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ["0", "Aktif"],
            ["7", "Jeda 7 hari"],
            ["30", "Jeda 30 hari"],
          ].map(([v, l]) => (
            <label key={v} className="choice">
              <input type="radio" name="pause" value={v} defaultChecked={v === (pausedUntil ? "keep" : "0")} />
              {l}
            </label>
          ))}
          {pausedUntil && (
            <label className="choice">
              <input type="radio" name="pause" value="keep" defaultChecked />
              Tetap dijeda
            </label>
          )}
        </div>
      </section>
      <section className="panel p-5">
        <h2 className="font-semibold">Bisukan bidang</h2>
        <p className="text-sm text-ink-soft">Kamu tidak akan menerima notifikasi kecocokan untuk bidang yang dipilih (kecuali panggilan darurat).</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="choice">
              <input type="checkbox" name="muted" value={c.id} defaultChecked={muted.includes(c.id)} />
              {c.name}
            </label>
          ))}
        </div>
      </section>
      <section className="panel p-5">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="emergency_standby" defaultChecked={standby} className="mt-1 size-4 accent-[var(--sigap-ink)]" />
          <span>
            <span className="font-semibold">Siaga darurat</span>
            <span className="block text-sm text-ink-soft">Kabari aku untuk panggilan bencana kapan pun.</span>
          </span>
        </label>
      </section>
      <p className="text-sm text-ink-muted">Akun: {email}. Untuk menghapus akun, hubungi admin lewat halaman Bantuan.</p>
      <button className="btn btn-ink" disabled={pending}>
        {pending ? "Menyimpan…" : "Simpan pengaturan"}
      </button>
    </form>
  );
}
