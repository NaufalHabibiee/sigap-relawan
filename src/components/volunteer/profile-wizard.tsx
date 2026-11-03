"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Briefcase, CalendarClock, Check, CircleCheck, ExternalLink, Plus, Sparkles, Trash2, Upload, UserRound } from "lucide-react";
import { writeBioWithAi } from "@/lib/actions/ai";
import { saveVolunteerStep } from "@/lib/actions/volunteer";
import { LOADS, SLOTS, SOCIAL_PLATFORMS, WEEKDAYS } from "@/lib/constants";
import { dateYearsAgo } from "@/lib/format";
import { openPrivateFile, publicUrl, uploadFile, IMAGE_TYPES } from "@/lib/upload";
import type { MasterData } from "@/lib/types";
import type { FullVolunteer } from "@/lib/volunteer-data";
import { Avatar, LevelBadge } from "../ui";

const STEPS = ["Data diri", "Kelebihan & keterbatasan", "Minat & waktu luang", "Pengalaman, sosmed & CV"];
const STEP_ICONS = [UserRound, Sparkles, CalendarClock, Briefcase];
const STEP_HINT = [
  "Siapa kamu dan di mana kamu tinggal.",
  "Skill, kelebihan, dan hal yang perlu dihindari.",
  "Bidang, beban kerja, dan jadwal luangmu.",
  "Opsional, tapi menambah kepercayaan.",
];

type Missing = { label: string; step: number }[];

export function ProfileWizard({
  me,
  master,
  initialStep,
  pct,
  missing,
  level,
}: {
  me: FullVolunteer;
  master: MasterData;
  initialStep: number;
  pct: number;
  missing: Missing;
  level: number;
}) {
  const [step, setStep] = useState(initialStep);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function go(n: number) {
    setStep(n);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await saveVolunteerStep(step as 1 | 2 | 3 | 4, fd);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (step < 4) {
        toast.success("Tersimpan");
        go(step + 1);
      } else {
        toast.success(
          res.level && res.level >= 1 ? `Profil lengkap. ${res.matches ?? 0} panggilan cocok denganmu.` : "Tersimpan. Verifikasi nomor HP agar profilmu bisa dicocokkan.",
        );
      }
    });
  }

  // "Done" is derived from saved data, so it updates after each step is saved and the page refreshes.
  const done = [
    !missing.some((m) => m.step === 1),
    me.skills.length >= 3,
    !missing.some((m) => m.step === 3),
    me.experiences.length > 0 || me.socials.length > 0 || Boolean(me.cv_path),
  ];
  const ringC = 2 * Math.PI * 34;
  const city = master.cities.find((c) => c.id === me.city_id);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <header className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-3xl border border-line bg-surface p-5 sm:p-6">
        <div className="relative size-20 shrink-0">
          <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-line/70" />
            <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - pct / 100)} className="stroke-guyub" />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            {pct}%
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="h-section text-2xl">{pct >= 100 ? "Profilmu sudah lengkap" : "Lengkapi profilmu"}</h1>
            <LevelBadge level={level} />
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-soft">
            Semakin lengkap profil, semakin akurat Sigap mencocokkanmu dengan panggilan yang pas untuk kemampuan dan waktu luangmu.
          </p>
        </div>
        {me.slug && (
          <Link href={`/relawan/${me.slug}`} className="btn btn-outline btn-sm">
            Lihat profil publik <ExternalLink className="size-4" aria-hidden />
          </Link>
        )}
      </header>

      {/* Stepper */}
      <ol className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Langkah profil">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const current = step === n;
          const Icon = STEP_ICONS[i];
          return (
            <li key={label}>
              <button
                type="button"
                onClick={() => go(n)}
                aria-current={current ? "step" : undefined}
                className={`flex h-full w-full items-center gap-3 rounded-3xl border p-3.5 text-left transition-colors ${
                  current ? "border-ink bg-ink text-paper" : done[i] ? "border-guyub/30 bg-guyub-wash/50 hover:border-guyub/60" : "border-line bg-surface hover:border-line-strong"
                }`}
              >
                <span
                  className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${
                    current ? "bg-sigap text-white" : done[i] ? "bg-guyub text-white" : "bg-paper text-ink-soft"
                  }`}
                >
                  {done[i] && !current ? <Check className="size-5" aria-hidden /> : <Icon className="size-5" aria-hidden />}
                </span>
                <span className="min-w-0">
                  <span className={`block text-xs font-medium ${current ? "text-paper/70" : "text-ink-muted"}`}>
                    Langkah {n}
                    {n === 4 && !done[i] ? " · opsional" : ""}
                  </span>
                  <span className="block text-sm leading-snug font-semibold">{label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <form key={step} onSubmit={submit} className="min-w-0 space-y-4" noValidate>
          <div className="panel space-y-6 p-5 sm:p-8">
            <div>
              <h2 className="h-section text-2xl">{STEPS[step - 1]}</h2>
              <p className="mt-1 text-sm text-ink-soft">{STEP_HINT[step - 1]}</p>
            </div>
            {step === 1 && <StepIdentity me={me} master={master} />}
            {step === 2 && <StepStrengths me={me} master={master} />}
            {step === 3 && <StepInterests me={me} master={master} />}
            {step === 4 && <StepExtras me={me} />}
            {error && (
              <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface/95 p-3 shadow-[0_16px_36px_-20px_rgba(27,36,48,0.55)] backdrop-blur">
            {step > 1 ? (
              <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)}>
                <ArrowLeft className="size-4" aria-hidden /> Kembali
              </button>
            ) : (
              <span className="px-2 text-sm text-ink-muted">Langkah 1 dari 4</span>
            )}
            <div className="flex items-center gap-3">
              {step === 4 && !me.phone_verified && (
                <Link href="/r/verifikasi" className="text-sm font-semibold text-sigap-ink hover:underline">
                  Lanjut verifikasi HP
                </Link>
              )}
              <button className="btn btn-primary" disabled={pending}>
                {pending ? "Menyimpan…" : step < 4 ? "Simpan & lanjut" : "Simpan profil"}
                {!pending && step < 4 && <ArrowRight className="size-4" aria-hidden />}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="panel p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Pratinjau profil</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar src={me.avatar_url} name={me.nickname ?? me.full_name ?? "?"} size={48} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{me.nickname ?? "Nama panggilan"}</p>
                <p className="truncate text-sm text-ink-muted">{city ? `${city.name}, ${city.province}` : "Kota belum diisi"}</p>
              </div>
            </div>
            <p className="mt-3 line-clamp-3 text-sm text-ink-soft">{me.bio || "Bio belum diisi."}</p>
            <p className="mt-3 text-xs text-ink-muted">
              {me.skills.length} skill · {me.interests.length} bidang minat · {me.availability.length} slot waktu
            </p>
          </div>

          <div className="panel p-5">
            <h2 className="font-semibold">{missing.length ? "Yang masih kurang" : "Syarat Level 1 terpenuhi"}</h2>
            {missing.length === 0 ? (
              <p className="mt-2 flex items-start gap-2 text-sm text-ink-soft">
                <CircleCheck className="mt-0.5 size-4 shrink-0 text-guyub" aria-hidden />
                Profilmu bisa dicocokkan. Lengkapi sisanya untuk hasil yang lebih akurat.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {missing.map((m) => (
                  <li key={m.label}>
                    {m.step === 0 ? (
                      <Link href="/r/verifikasi" className="flex items-start gap-2 rounded-lg p-1.5 text-sm hover:bg-ink/5">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sigap" aria-hidden />
                        {m.label}
                      </Link>
                    ) : (
                      <button type="button" onClick={() => go(m.step)} className="flex w-full items-start gap-2 rounded-lg p-1.5 text-left text-sm hover:bg-ink/5">
                        <span className="mt-1.5 size-2 shrink-0 rounded-full bg-sigap" aria-hidden />
                        {m.label}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StepIdentity({ me, master }: { me: FullVolunteer; master: MasterData }) {
  const [avatar, setAvatar] = useState(me.avatar_url);
  const [uploading, setUploading] = useState(false);
  const provinces = useMemo(() => [...new Set(master.cities.map((c) => c.province))], [master.cities]);
  const [maxBirth] = useState(() => dateYearsAgo(17));

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const path = await uploadFile("public-media", me.id, file, IMAGE_TYPES);
      setAvatar(publicUrl(path));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  const [bioLen, setBioLen] = useState((me.bio ?? "").length);
  const bioRef = useRef<HTMLTextAreaElement>(null);
  const [bioPending, startBio] = useTransition();

  function polishBio() {
    const raw = bioRef.current?.value ?? "";
    startBio(async () => {
      const res = await writeBioWithAi(raw);
      if (res.error || !res.bio) return void toast.error(res.error ?? "Gagal merapikan bio.");
      if (bioRef.current) bioRef.current.value = res.bio;
      setBioLen(res.bio.length);
      toast.success(res.source === "ai" ? "Bio dirapikan AI. Periksa lagi sebelum menyimpan." : "Layanan AI sedang tidak tersedia, bio dirapikan seadanya.");
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-5 rounded-3xl border border-dashed border-line-strong bg-paper/60 p-4 sm:p-5">
        <Avatar src={avatar} name={me.nickname ?? me.full_name ?? "?"} size={88} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Foto profil</p>
          <p className="mt-0.5 text-sm text-ink-muted">Wajah yang jelas membuat penyelenggara lebih percaya. JPG atau PNG, maks 5 MB.</p>
          <label className="btn btn-outline btn-sm mt-3 cursor-pointer">
            <Upload className="size-4" aria-hidden /> {uploading ? "Mengunggah…" : avatar ? "Ganti foto" : "Unggah foto"}
            <input type="file" accept={IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => onAvatar(e.target.files?.[0])} />
          </label>
          <input type="hidden" name="avatar_url" value={avatar ?? ""} />
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="border-b border-line pb-2 text-sm font-semibold tracking-wide text-ink-muted uppercase">Identitas</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nama lengkap (sesuai KTP)" hint="Hanya terlihat oleh penyelenggara yang kamu lamar.">
            <input name="full_name" defaultValue={me.full_name ?? ""} className="field" required />
          </Field>
          <Field label="Nama panggilan" hint="Terlihat publik.">
            <input name="nickname" defaultValue={me.nickname ?? ""} className="field" required maxLength={40} />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Tanggal lahir" hint="Minimal 17 tahun.">
            <input name="birth_date" type="date" max={maxBirth} defaultValue={me.birth_date ?? ""} className="field" required />
          </Field>
          <Field label="Jenis kelamin">
            <select name="gender" defaultValue={me.gender ?? ""} className="field" required>
              <option value="" disabled>
                Pilih
              </option>
              <option value="L">Laki-laki</option>
              <option value="P">Perempuan</option>
            </select>
          </Field>
          <Field label="Kota domisili" className="sm:col-span-2 xl:col-span-1">
            <select name="city_id" defaultValue={me.city_id ?? ""} className="field" required>
              <option value="" disabled>
                Pilih kota
              </option>
              {provinces.map((p) => (
                <optgroup key={p} label={p}>
                  {master.cities
                    .filter((c) => c.province === p)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="border-b border-line pb-2 text-sm font-semibold tracking-wide text-ink-muted uppercase">Tentang kamu</h3>
        <label className="block">
          <span className="label">Bio singkat</span>
          <textarea
            ref={bioRef}
            name="bio"
            rows={4}
            maxLength={300}
            defaultValue={me.bio ?? ""}
            onChange={(e) => setBioLen(e.target.value.length)}
            className="field"
            placeholder="Siapa kamu dan kenapa ingin jadi relawan?"
          />
          <span className="hint flex justify-between">
            <span>Terlihat publik.</span>
            <span>{bioLen}/300</span>
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className="btn btn-outline btn-sm" disabled={bioPending || bioLen < 10} onClick={polishBio}>
            <Sparkles className="size-4" aria-hidden /> {bioPending ? "AI sedang menulis…" : "Rapikan dengan AI"}
          </button>
          <span className="text-sm text-ink-muted">Tulis pengalamanmu seadanya, AI menyusunnya jadi bio yang menarik bagi penyelenggara.</span>
        </div>
      </section>
    </>
  );
}

function StepStrengths({ me, master }: { me: FullVolunteer; master: MasterData }) {
  const [selected, setSelected] = useState<Map<number, number>>(() => new Map(me.skills.map((s) => [s.skill_id, s.level])));
  const [strengths, setStrengths] = useState<string[]>(me.strengths.length ? me.strengths : [""]);
  const grouped = master.categories
    .map((c) => ({ cat: c, skills: master.skills.filter((s) => s.category_id === c.id) }))
    .filter((g) => g.skills.length);

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 15) next.set(id, 1);
      else toast("Maksimal 15 skill.");
      return next;
    });
  }

  return (
    <>
      <fieldset>
        <legend className="label">Skill yang kamu kuasai</legend>
        <p className="hint mb-3 mt-0">Pilih 3–15. Tandai “mahir” untuk yang benar-benar kamu kuasai, ini menaikkan skor kecocokan. Terpilih: {selected.size}</p>
        <div className="space-y-4">
          {grouped.map((g) => (
            <div key={g.cat.id}>
              <p className="mb-1.5 text-xs font-semibold text-ink-muted">{g.cat.name}</p>
              <div className="flex flex-wrap gap-2">
                {g.skills.map((s) => (
                  <label key={s.id} className="choice">
                    <input type="checkbox" name="skills" value={s.id} checked={selected.has(s.id)} onChange={() => toggle(s.id)} />
                    {s.name}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {selected.size > 0 && (
        <fieldset>
          <legend className="label">Tingkat penguasaan</legend>
          <ul className="divide-y divide-line rounded-xl border border-line">
            {[...selected.keys()].map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                {master.skills.find((s) => s.id === id)?.name}
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="expert"
                    value={id}
                    checked={selected.get(id) === 2}
                    onChange={(e) => setSelected((prev) => new Map(prev).set(id, e.target.checked ? 2 : 1))}
                    className="size-4 accent-[var(--guyub)]"
                  />
                  Mahir
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <fieldset>
        <legend className="label">Kelebihan lain (opsional)</legend>
        <p className="hint mb-2 mt-0">Hal yang tidak ada di daftar skill. Misal: “Tahan kerja lapangan”, “Bisa bahasa Sunda”.</p>
        <div className="space-y-2">
          {strengths.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input name="strengths" defaultValue={s} maxLength={80} className="field" aria-label={`Kelebihan ${i + 1}`} />
              <button type="button" className="btn btn-ghost px-3" aria-label="Hapus" onClick={() => setStrengths(strengths.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {strengths.length < 5 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStrengths([...strengths, ""])}>
              <Plus className="size-4" aria-hidden /> Tambah kelebihan
            </button>
          )}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Keterbatasan</legend>
        <p className="hint mb-3 mt-0">
          Jujur di sini melindungimu: panggilan yang melibatkan hal ini tidak akan ditawarkan. Hanya penyelenggara yang kamu lamar yang bisa melihatnya.
        </p>
        <div className="flex flex-wrap gap-2">
          {master.limitations.map((l) => (
            <label key={l.id} className="choice">
              <input type="checkbox" name="limitations" value={l.id} defaultChecked={me.limitations.includes(l.id)} />
              {l.name}
            </label>
          ))}
        </div>
        <textarea
          name="limitation_note"
          rows={2}
          maxLength={500}
          defaultValue={me.limitation_note ?? ""}
          className="field mt-3"
          placeholder="Catatan lain (opsional), misal: kondisi kesehatan tertentu, tidak bisa naik motor jauh…"
          aria-label="Catatan keterbatasan"
        />
      </fieldset>
    </>
  );
}

function StepInterests({ me, master }: { me: FullVolunteer; master: MasterData }) {
  const avail = new Set(me.availability.map((a) => `${a.weekday}:${a.slot}`));
  const [travel, setTravel] = useState(me.willing_travel);
  return (
    <>
      <fieldset>
        <legend className="label">Bidang yang kamu minati</legend>
        <div className="flex flex-wrap gap-2">
          {master.categories.map((c) => (
            <label key={c.id} className="choice">
              <input type="checkbox" name="interests" value={c.id} defaultChecked={me.interests.includes(c.id)} />
              {c.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Tingkat beban yang kamu sanggupi</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {LOADS.map((l) => (
            <label key={l.value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-line bg-surface p-3 has-[:checked]:border-ink">
              <input type="checkbox" name="loads" value={l.value} defaultChecked={me.loads.includes(l.value)} className="mt-1 size-4 accent-[var(--ink)]" />
              <span>
                <span className="font-semibold">{l.label}</span>
                {l.level === 2 && <span className="ml-2 text-xs text-sigap-ink">butuh verifikasi Level 2</span>}
                <span className="block text-sm text-ink-muted">{l.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Waktu luang</legend>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[28rem] text-sm">
            <thead>
              <tr>
                <th className="w-24 text-left font-medium text-ink-muted" />
                {WEEKDAYS.map((d) => (
                  <th key={d.value} className="pb-2 font-semibold">
                    {d.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SLOTS.map((s) => (
                <tr key={s.value}>
                  <th scope="row" className="py-1.5 text-left font-medium">
                    {s.label}
                    <span className="block text-xs font-normal text-ink-muted">{s.hint}</span>
                  </th>
                  {WEEKDAYS.map((d) => (
                    <td key={d.value} className="p-1 text-center">
                      <label className="relative mx-auto block size-10 cursor-pointer">
                        <input
                          type="checkbox"
                          name="availability"
                          value={`${d.value}:${s.value}`}
                          defaultChecked={avail.has(`${d.value}:${s.value}`)}
                          aria-label={`${d.label} ${s.label}`}
                          className="peer sr-only"
                        />
                        <span className="flex size-full items-center justify-center rounded-xl border border-line bg-surface text-transparent transition-colors hover:border-line-strong peer-checked:border-guyub peer-checked:bg-guyub peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-sigap-ink">
                          <Check className="size-4" aria-hidden />
                        </span>
                      </label>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cara kerja">
          <select name="mode" defaultValue={me.mode} className="field">
            <option value="keduanya">Di lokasi dan online</option>
            <option value="onsite">Hanya di lokasi</option>
            <option value="online">Hanya online</option>
          </select>
        </Field>
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="willing_travel" checked={travel} onChange={(e) => setTravel(e.target.checked)} className="size-4 accent-[var(--ink)]" />
            Bersedia ke luar kota
          </label>
          {travel && (
            <label className="block text-sm">
              Jarak maksimal (km)
              <input name="max_radius_km" type="number" min={1} max={5000} defaultValue={me.max_radius_km ?? ""} placeholder="Kosongkan jika ke mana saja" className="field mt-1" />
            </label>
          )}
        </div>
      </div>
      <label className="flex items-start gap-3 rounded-xl border-2 border-sigap/50 bg-sigap-wash/40 p-4">
        <input type="checkbox" name="emergency_standby" defaultChecked={me.emergency_standby} className="mt-1 size-4 accent-[var(--sigap-ink)]" />
        <span>
          <span className="font-semibold">Siaga darurat</span>
          <span className="block text-sm text-ink-soft">
            Kabari aku untuk panggilan bencana kapan pun, meski di luar jadwal luangku. Butuh tingkat beban “Darurat” dan verifikasi Level 2.
          </span>
        </span>
      </label>
    </>
  );
}

function StepExtras({ me }: { me: FullVolunteer }) {
  const [exps, setExps] = useState(me.experiences.length ? me.experiences : []);
  const [cv, setCv] = useState(me.cv_path);
  const [uploading, setUploading] = useState(false);
  const social = (p: string) => me.socials.find((s) => s.platform === p);

  async function onCv(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      setCv(await uploadFile("private-docs", `${me.id}/cv`, file, ["application/pdf"]));
      toast.success("CV terunggah. Klik Simpan profil.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <fieldset>
        <legend className="label">Pengalaman relawan (opsional)</legend>
        <p className="hint mb-3 mt-0">Kegiatan yang kamu ikuti lewat Sigap tercatat otomatis.</p>
        <div className="space-y-3">
          {exps.map((e, i) => (
            <div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-[2fr_2fr_1fr_1.5fr_auto]">
              <input name="exp_title" defaultValue={e.title} placeholder="Kegiatan" className="field" aria-label="Nama kegiatan" />
              <input name="exp_org" defaultValue={e.organizer ?? ""} placeholder="Penyelenggara" className="field" aria-label="Penyelenggara" />
              <input name="exp_year" defaultValue={e.year ?? ""} placeholder="Tahun" inputMode="numeric" maxLength={4} className="field" aria-label="Tahun" />
              <input name="exp_role" defaultValue={e.role ?? ""} placeholder="Peran" className="field" aria-label="Peran" />
              <button type="button" className="btn btn-ghost px-3" aria-label="Hapus pengalaman" onClick={() => setExps(exps.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => setExps([...exps, { title: "", organizer: null, year: null, role: null }])}
          >
            <Plus className="size-4" aria-hidden /> Tambah pengalaman
          </button>
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">Media sosial</legend>
        <p className="hint mb-3 mt-0">Wajib jika kamu memilih tingkat beban Promosi. Terlihat oleh penyelenggara yang kamu lamar.</p>
        <div className="space-y-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <div key={p.value} className="grid grid-cols-[6rem_1fr_8rem] items-center gap-2">
              <span className="text-sm font-medium">{p.label}</span>
              <input name={`${p.value}_handle`} defaultValue={social(p.value)?.handle ?? ""} placeholder="@username" className="field" aria-label={`Username ${p.label}`} />
              <input
                name={`${p.value}_followers`}
                type="number"
                min={0}
                defaultValue={social(p.value)?.followers ?? ""}
                placeholder="Pengikut"
                className="field"
                aria-label={`Jumlah pengikut ${p.label}`}
              />
            </div>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="label">CV (opsional)</legend>
        <p className="hint mb-3 mt-0">PDF, maks 5 MB. Banyak panggilan, terutama tanggap bencana, tidak butuh CV.</p>
        <input type="hidden" name="cv_path" value={cv ?? ""} />
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn btn-outline btn-sm cursor-pointer">
            <Upload className="size-4" aria-hidden /> {uploading ? "Mengunggah…" : cv ? "Ganti CV" : "Unggah CV"}
            <input type="file" accept="application/pdf" className="sr-only" onChange={(e) => onCv(e.target.files?.[0])} />
          </label>
          {cv && (
            <>
              <button type="button" className="text-sm font-semibold text-ink hover:underline" onClick={() => openPrivateFile(cv).catch((e) => toast.error(e.message))}>
                Lihat CV
              </button>
              <button type="button" className="text-sm text-danger hover:underline" onClick={() => setCv(null)}>
                Hapus
              </button>
            </>
          )}
        </div>
      </fieldset>
    </>
  );
}

function Field({ label, hint, className = "", children }: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint block">{hint}</span>}
    </label>
  );
}
