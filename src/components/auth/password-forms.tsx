"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ResetRequestForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    setPending(true);
    const { error } = await createBrowserSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/sandi-baru`,
    });
    setPending(false);
    if (error) toast.error("Gagal mengirim email. Coba lagi beberapa saat lagi.");
    else setSent(true);
  }

  return (
    <div>
      <h1 className="h-section text-3xl">Lupa kata sandi</h1>
      {sent ? (
        <p className="mt-3 text-ink-soft">Jika email itu terdaftar, tautan untuk membuat kata sandi baru sudah dikirim.</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="label">
              Email akunmu
            </label>
            <input id="email" name="email" type="email" className="field" required autoComplete="email" />
          </div>
          <button className="btn btn-ink w-full py-3" disabled={pending}>
            {pending ? "Mengirim…" : "Kirim tautan"}
          </button>
        </form>
      )}
      <Link href="/masuk" className="mt-6 inline-block text-sm text-ink-soft hover:underline">
        Kembali ke halaman masuk
      </Link>
    </div>
  );
}

export function NewPasswordForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (password !== fd.get("confirm")) return setError("Kedua kata sandi tidak sama.");
    setPending(true);
    const { error } = await createBrowserSupabase().auth.updateUser({ password });
    setPending(false);
    if (error) return setError("Sesi pemulihan sudah tidak berlaku. Minta tautan baru.");
    toast.success("Kata sandi diperbarui");
    router.push("/mulai");
  }

  return (
    <div>
      <h1 className="h-section text-3xl">Buat kata sandi baru</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="label">
            Kata sandi baru
          </label>
          <input id="password" name="password" type="password" className="field" autoComplete="new-password" required />
        </div>
        <div>
          <label htmlFor="confirm" className="label">
            Ulangi kata sandi
          </label>
          <input id="confirm" name="confirm" type="password" className="field" autoComplete="new-password" required />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}
        <button className="btn btn-ink w-full py-3" disabled={pending}>
          {pending ? "Menyimpan…" : "Simpan kata sandi"}
        </button>
      </form>
    </div>
  );
}
