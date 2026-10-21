"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveEmergency } from "@/lib/actions/volunteer";
import { BLOOD_TYPES } from "@/lib/constants";
import type { FullVolunteer } from "@/lib/volunteer-data";

export function EmergencyForm({ initial }: { initial: FullVolunteer["emergency"] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setError(null);
        start(async () => {
          const res = await saveEmergency(fd);
          if (res.error) return setError(res.error);
          toast.success("Kontak darurat tersimpan");
        });
      }}
    >
      <label className="block">
        <span className="label">Nama kontak</span>
        <input name="contact_name" defaultValue={initial?.contact_name} className="field" required />
      </label>
      <label className="block">
        <span className="label">Hubungan</span>
        <input name="relation" defaultValue={initial?.relation} placeholder="Orang tua, pasangan, saudara…" className="field" required />
      </label>
      <label className="block">
        <span className="label">Nomor HP kontak</span>
        <input name="contact_phone" defaultValue={initial?.contact_phone} inputMode="tel" className="field" required />
      </label>
      <label className="block">
        <span className="label">Golongan darah</span>
        <select name="blood_type" defaultValue={initial?.blood_type ?? ""} className="field">
          <option value="">Pilih</option>
          {BLOOD_TYPES.map((b) => (
            <option key={b} value={b}>
              {b === "tidak tahu" ? "Tidak tahu" : b}
            </option>
          ))}
        </select>
      </label>
      <label className="block sm:col-span-2">
        <span className="label">Kondisi kesehatan yang perlu diketahui (opsional)</span>
        <textarea name="health_notes" defaultValue={initial?.health_notes ?? ""} rows={2} maxLength={500} className="field" placeholder="Alergi obat, asma, dll." />
        <span className="hint block">Hanya dibuka untuk penyelenggara panggilan berat/darurat setelah kamu diterima.</span>
      </label>
      {error && (
        <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger sm:col-span-2">
          {error}
        </p>
      )}
      <div className="sm:col-span-2">
        <button className="btn btn-ink" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan kontak darurat"}
        </button>
      </div>
    </form>
  );
}
