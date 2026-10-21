"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createBrowserSupabase } from "@/lib/supabase/browser";

export function ChangePassword() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const next = String(fd.get("password") ?? "");
    const confirm = String(fd.get("confirm") ?? "");
    if (next.length < 8) return setError("Kata sandi minimal 8 karakter.");
    if (next !== confirm) return setError("Konfirmasi kata sandi tidak sama.");
    setPending(true);
    const { error: err } = await createBrowserSupabase().auth.updateUser({ password: next });
    setPending(false);
    if (err) return setError(err.message.includes("same") ? "Kata sandi baru harus berbeda dari yang lama." : "Gagal mengubah kata sandi. Coba masuk ulang lalu ulangi.");
    form.reset();
    toast.success("Kata sandi diubah");
  }

  return (
    <section className="panel p-5">
      <h2 className="font-semibold">Ubah kata sandi</h2>
      <p className="text-sm text-ink-soft">Gunakan minimal 8 karakter. Kamu tetap masuk di perangkat ini.</p>
      <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2" noValidate>
        <div>
          <label htmlFor="new-password" className="label">
            Kata sandi baru
          </label>
          <input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} className="field" />
        </div>
        <div>
          <label htmlFor="confirm-password" className="label">
            Ulangi kata sandi
          </label>
          <input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} className="field" />
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger sm:col-span-2">
            {error}
          </p>
        )}
        <div className="sm:col-span-2">
          <button className="btn btn-outline btn-sm" disabled={pending}>
            {pending ? "Menyimpan…" : "Ubah kata sandi"}
          </button>
        </div>
      </form>
    </section>
  );
}
