"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { HandHeart, Building2 } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { SEEKER_TYPES } from "@/lib/constants";
import { Turnstile, captchaEnabled } from "./turnstile";

type Mode = "login" | "register";
const HOME = { volunteer: "/r", seeker: "/p", admin: "/admin" } as const;

function safeNext(next: string | null): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : null;
}

export function AuthForm({ mode, initialRole, next }: { mode: Mode; initialRole?: "volunteer" | "seeker"; next?: string | null }) {
  const router = useRouter();
  const [role, setRole] = useState<"volunteer" | "seeker">(initialRole ?? "volunteer");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (captchaEnabled && !captcha) return setError("Selesaikan verifikasi keamanan dulu, lalu coba lagi.");
    const captchaToken = captcha ?? undefined;
    const supabase = createBrowserSupabase();
    setPending(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
        if (error) {
          setError(error.message.includes("Email not confirmed") ? "Email belum dikonfirmasi. Cek kotak masuk emailmu." : "Email atau kata sandi salah.");
          return;
        }
        const { data: profile } = await supabase.from("profiles").select("role, role_confirmed").eq("id", data.user.id).maybeSingle();
        const dest = !profile?.role_confirmed ? "/mulai" : (safeNext(next ?? null) ?? HOME[(profile?.role ?? "volunteer") as keyof typeof HOME]);
        router.push(dest);
        router.refresh();
        return;
      }
      const name = String(fd.get("name") ?? "").trim();
      if (name.length < 2) return setError(role === "seeker" ? "Isi nama organisasi atau namamu." : "Isi nama lengkapmu.");
      if (password.length < 8) return setError("Kata sandi minimal 8 karakter.");
      if (!fd.get("consent")) return setError("Setujui syarat penggunaan dan kebijakan privasi untuk melanjutkan.");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          captchaToken,
          data: { role, full_name: name, seeker_type: role === "seeker" ? String(fd.get("seeker_type") ?? "individu") : undefined },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${role === "seeker" ? "/p/profil" : "/r/profil"}`,
        },
      });
      if (error) {
        setError(error.message.includes("registered") ? "Email ini sudah terdaftar. Silakan masuk." : error.message);
        return;
      }
      if (data.session) {
        router.push(role === "seeker" ? "/p/profil" : "/r/profil");
        router.refresh();
      } else {
        setSentTo(email);
      }
    } finally {
      setPending(false);
      if (captchaEnabled) {
        setCaptcha(null);
        setCaptchaKey((k) => k + 1);
      }
    }
  }

  async function google() {
    const { error } = await createBrowserSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext(next ?? null) ?? "/mulai")}` },
    });
    if (error) toast.error("Masuk dengan Google belum diaktifkan. Gunakan email dulu.");
  }

  if (sentTo) {
    return (
      <div>
        <h1 className="h-section text-3xl">Cek emailmu</h1>
        <p className="mt-3 text-ink-soft">
          Kami mengirim tautan konfirmasi ke <strong>{sentTo}</strong>. Buka tautan itu untuk mengaktifkan akun, lalu lengkapi profilmu.
        </p>
        <Link href="/masuk" className="btn btn-ink mt-6">
          Ke halaman masuk
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="h-section text-2xl sm:text-3xl">{mode === "login" ? "Selamat datang kembali" : "Buat akun"}</h1>
      <p className="mt-1.5 text-ink-soft">
        {mode === "login" ? (
          <>
            Belum punya akun?{" "}
            <Link href="/daftar" className="font-semibold text-sigap-ink underline-offset-2 hover:underline">
              Daftar gratis
            </Link>
          </>
        ) : (
          <>
            Sudah punya akun?{" "}
            <Link href="/masuk" className="font-semibold text-sigap-ink underline-offset-2 hover:underline">
              Masuk
            </Link>
          </>
        )}
      </p>

      <form onSubmit={onSubmit} className="mt-5 space-y-3.5" noValidate>
        {mode === "register" && (
          <fieldset>
            <legend className="label">Saya ingin</legend>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                checked={role === "volunteer"}
                onChange={() => setRole("volunteer")}
                icon={<HandHeart className="size-5" aria-hidden />}
                title="Jadi relawan"
                body="Bantu kegiatan sesuai kemampuanmu"
                tone="guyub"
              />
              <RoleCard
                checked={role === "seeker"}
                onChange={() => setRole("seeker")}
                icon={<Building2 className="size-5" aria-hidden />}
                title="Cari relawan"
                body="Perusahaan, lembaga, komunitas, individu"
                tone="ink"
              />
            </div>
          </fieldset>
        )}

        {mode === "register" && (
          <div className={role === "seeker" ? "grid gap-3.5 min-[420px]:grid-cols-2" : ""}>
            <div>
              <label htmlFor="name" className="label">
                {role === "seeker" ? "Nama organisasi" : "Nama lengkap"}
              </label>
              <input id="name" name="name" className="field" autoComplete={role === "seeker" ? "organization" : "name"} required />
              {role === "volunteer" && <p className="hint">Sesuai KTP. Publik hanya melihat nama panggilanmu.</p>}
            </div>
            {role === "seeker" && (
              <div>
                <label htmlFor="seeker_type" className="label">
                  Jenis penyelenggara
                </label>
                <select id="seeker_type" name="seeker_type" className="field" defaultValue="komunitas">
                  {SEEKER_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
        <div className={mode === "register" ? "grid gap-3.5 min-[420px]:grid-cols-2" : "space-y-3.5"}>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" className="field" autoComplete="email" required />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="password" className="label">
              Kata sandi
            </label>
            {mode === "login" && (
              <Link href="/lupa-sandi" className="text-sm text-ink-soft hover:underline">
                Lupa sandi?
              </Link>
            )}
          </div>
          <input
            id="password"
            name="password"
            type="password"
            className="field"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={8}
            required
          />
        </div>
        </div>
        {mode === "register" && (
          <label className="flex items-start gap-2.5 text-[0.82rem] leading-snug text-ink-soft">
            <input type="checkbox" name="consent" className="mt-1 size-4 accent-[var(--ink)]" />
            <span>
              Saya setuju dengan{" "}
              <Link href="/syarat" className="underline" target="_blank">
                syarat penggunaan
              </Link>{" "}
              dan{" "}
              <Link href="/kebijakan-privasi" className="underline" target="_blank">
                kebijakan privasi
              </Link>
              , termasuk pemrosesan data pribadi untuk pencocokan relawan.
            </span>
          </label>
        )}

        <Turnstile onToken={setCaptcha} resetKey={captchaKey} />

        {error && (
          <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <button type="submit" className="btn btn-primary w-full py-3" disabled={pending}>
          {pending ? "Memproses…" : mode === "login" ? "Masuk" : role === "seeker" ? "Daftar sebagai penyelenggara" : "Daftar sebagai relawan"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-ink-muted">
        <span className="h-px flex-1 bg-line" /> atau <span className="h-px flex-1 bg-line" />
      </div>
      <button type="button" onClick={google} className="btn btn-outline w-full py-2.5">
        Lanjut dengan Google
      </button>
    </div>
  );
}

function RoleCard({
  checked,
  onChange,
  icon,
  title,
  body,
  tone,
}: {
  checked: boolean;
  onChange: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: "guyub" | "ink";
}) {
  const active = tone === "guyub" ? "border-guyub bg-guyub text-white" : "border-ink bg-ink text-paper";
  return (
    <label
      className={`relative cursor-pointer rounded-2xl border-2 p-3 transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-sigap-ink ${
        checked ? active : "border-line bg-surface hover:border-line-strong"
      }`}
    >
      <input type="radio" name="role" checked={checked} onChange={onChange} className="sr-only" />
      <span className="flex items-center gap-2.5">
        <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${checked ? "bg-white/15" : "bg-paper"}`}>{icon}</span>
        <span className="font-semibold">{title}</span>
      </span>
      <span className={`auth-role-body mt-1.5 block text-xs leading-snug ${checked ? "opacity-80" : "text-ink-muted"}`}>{body}</span>
    </label>
  );
}
