"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addMaster, resolveReport, reviewVerification, saveAnnouncement, setBanned, setDemoOtp, takedownCall, toggleAnnouncement } from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/types";
import { openPrivateFile } from "@/lib/upload";

function useRun() {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<ActionResult>, ok: string, after?: () => void) =>
    start(async () => {
      const res = await fn();
      if (res.error) return void toast.error(res.error);
      toast.success(ok);
      after?.();
    });
  return { pending, run };
}

export function VerificationDecision({ id, files }: { id: string; files: string[] }) {
  const { pending, run } = useRun();
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {files.map((f, i) => (
          <button key={f} type="button" className="btn btn-outline btn-sm" onClick={() => openPrivateFile(f).catch((e) => toast.error(e.message))}>
            Lihat berkas {i + 1}
          </button>
        ))}
      </div>
      <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Alasan (wajib jika ditolak)" className="field" aria-label="Alasan" />
      <div className="flex gap-2">
        <button className="btn btn-guyub btn-sm" disabled={pending} onClick={() => run(() => reviewVerification(id, true, reason), "Disetujui. Berkas identitas dihapus.")}>
          Setujui
        </button>
        <button className="btn btn-danger btn-sm" disabled={pending || !reason.trim()} onClick={() => run(() => reviewVerification(id, false, reason), "Ditolak. Berkas identitas dihapus.")}>
          Tolak
        </button>
      </div>
    </div>
  );
}

export function TakedownButton({ callId }: { callId: string }) {
  const { pending, run } = useRun();
  return (
    <button
      className="btn btn-danger btn-sm"
      disabled={pending}
      onClick={() => {
        const reason = window.prompt("Alasan menurunkan panggilan ini:");
        if (reason) run(() => takedownCall(callId, reason), "Panggilan diturunkan");
      }}
    >
      Turunkan
    </button>
  );
}

export function BanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const { pending, run } = useRun();
  return (
    <button
      className={`btn btn-sm ${banned ? "btn-outline" : "btn-danger"}`}
      disabled={pending}
      onClick={() => {
        const reason = banned ? "Buka blokir" : window.prompt("Alasan memblokir pengguna:");
        if (reason) run(() => setBanned(userId, !banned, reason), banned ? "Blokir dibuka" : "Pengguna diblokir");
      }}
    >
      {banned ? "Buka blokir" : "Blokir"}
    </button>
  );
}

export function ReportDecision({ id }: { id: string }) {
  const { pending, run } = useRun();
  const [note, setNote] = useState("");
  return (
    <div className="flex flex-wrap gap-2">
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan tindakan" className="field max-w-xs" aria-label="Catatan" />
      <button className="btn btn-ink btn-sm" disabled={pending} onClick={() => run(() => resolveReport(id, "resolved", note), "Ditandai selesai")}>
        Selesai ditindak
      </button>
      <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => resolveReport(id, "dismissed", note), "Diabaikan")}>
        Abaikan
      </button>
    </div>
  );
}

export function MasterForm({ kind, categories }: { kind: "categories" | "skills" | "limitations" | "cities"; categories?: { id: number; name: string }[] }) {
  const { pending, run } = useRun();
  return (
    <form
      className="flex flex-wrap gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        run(() => addMaster(kind, fd), "Ditambahkan", () => form.reset());
      }}
    >
      <input name="name" placeholder="Nama" className="field max-w-56" required aria-label="Nama" />
      {kind === "skills" && (
        <select name="category_id" className="field max-w-48" aria-label="Kategori">
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {kind === "limitations" && <input name="task_label" placeholder="Label tugas (mis. Bekerja di ketinggian)" className="field max-w-72" aria-label="Label tugas" />}
      {kind === "cities" && (
        <>
          <input name="province" placeholder="Provinsi" className="field max-w-48" required aria-label="Provinsi" />
          <input name="lat" placeholder="Lat" className="field max-w-24" required aria-label="Lintang" />
          <input name="lng" placeholder="Lng" className="field max-w-24" required aria-label="Bujur" />
        </>
      )}
      <button className="btn btn-ink btn-sm" disabled={pending}>
        Tambah
      </button>
    </form>
  );
}

export function AnnouncementForm() {
  const { pending, run } = useRun();
  return (
    <form
      className="panel grid gap-3 p-5"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const fd = new FormData(form);
        run(() => saveAnnouncement(fd), "Pengumuman tayang", () => form.reset());
      }}
    >
      <input name="title" placeholder="Judul, mis. Banjir di Demak — butuh relawan" className="field" required aria-label="Judul" />
      <textarea name="body" rows={2} placeholder="Keterangan singkat" className="field" aria-label="Keterangan" />
      <input name="link" placeholder="Tautan internal, mis. /panggilan?darurat=1" className="field" aria-label="Tautan" />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_disaster" className="size-4 accent-[var(--sigap-ink)]" /> Banner bencana (tampil di beranda)
      </label>
      <button className="btn btn-ink btn-sm justify-self-start" disabled={pending}>
        Terbitkan
      </button>
    </form>
  );
}

export function AnnouncementToggle({ id, active }: { id: string; active: boolean }) {
  const { pending, run } = useRun();
  return (
    <button className="btn btn-ghost btn-sm" disabled={pending} onClick={() => run(() => toggleAnnouncement(id, !active), active ? "Disembunyikan" : "Ditampilkan")}>
      {active ? "Sembunyikan" : "Tampilkan"}
    </button>
  );
}

export function DemoOtpToggle({ on }: { on: boolean }) {
  const { pending, run } = useRun();
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={on} disabled={pending} onChange={(e) => run(() => setDemoOtp(e.target.checked), "Pengaturan disimpan")} className="size-4" />
      Mode demo OTP (kode ditampilkan di layar, belum ada SMS)
    </label>
  );
}
