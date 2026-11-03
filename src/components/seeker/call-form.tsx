"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Mic, MicOff, Plus, ShieldAlert, Siren, Sparkles, Trash2 } from "lucide-react";
import { draftCallWithAi, type CallDraft } from "@/lib/actions/ai";
import { publishCall, saveCall } from "@/lib/actions/seeker";
import { BENEFITS, LOADS } from "@/lib/constants";
import { todayJakarta } from "@/lib/format";
import type { CallDetail, Load, MasterData } from "@/lib/types";

export function CallForm({ master, call, verified, phoneVerified }: { master: MasterData; call?: CallDetail; verified: boolean; phoneVerified: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [load, setLoad] = useState<Load>(call?.load ?? "ringan");
  const [mode, setMode] = useState(call?.mode ?? "onsite");
  const [gender, setGender] = useState(call?.gender ?? "");
  const [questions, setQuestions] = useState<string[]>(call?.questions ?? []);
  const [required, setRequired] = useState<Set<number>>(new Set(call?.skills.filter((s) => s.required).map((s) => s.skill.id)));
  const [preferred, setPreferred] = useState<Set<number>>(new Set(call?.skills.filter((s) => !s.required).map((s) => s.skill.id)));
  const today = todayJakarta();
  const provinces = useMemo(() => [...new Set(master.cities.map((c) => c.province))], [master.cities]);
  const isDraft = !call || call.status === "draf";
  const formRef = useRef<HTMLFormElement>(null);

  function applyDraft(d: CallDraft) {
    const f = formRef.current;
    if (!f) return;
    const set = (name: string, value: string) => {
      const el = f.elements.namedItem(name) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
      if (el) el.value = value;
    };
    set("title", d.title);
    set("description", d.description);
    if (d.category_id) set("category_id", String(d.category_id));
    set("quota", String(d.quota));
    const lvl = LOADS.find((l) => l.value === d.load);
    setLoad(lvl && lvl.level === 2 && !verified ? "sedang" : d.load);
  }

  function submit(publish: boolean) {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      const form = e.currentTarget.form!;
      if (!form.reportValidity()) return;
      const fd = new FormData(form);
      setError(null);
      start(async () => {
        const res = await saveCall(call?.id ?? null, fd);
        if (res.error || !res.id) return setError(res.error ?? "Gagal menyimpan.");
        if (publish) {
          const pub = await publishCall(res.id);
          if (pub.error) {
            setError(`Tersimpan sebagai draf, tapi belum bisa dipublikasikan: ${pub.error}`);
            router.replace(`/p/panggilan/${res.id}/ubah`);
            return;
          }
          toast.success(`Panggilan tayang. ${pub.matches ?? 0} relawan cocok sudah dikabari.`);
        } else {
          toast.success(isDraft ? "Draf disimpan" : "Perubahan disimpan, kecocokan dihitung ulang");
        }
        router.push(`/p/panggilan/${res.id}`);
      });
    };
  }

  return (
    <form ref={formRef} className="space-y-6" onSubmit={(e) => e.preventDefault()} noValidate>
      {isDraft && <AiDraftPanel onApply={applyDraft} verified={verified} />}
      <Section title="Kegiatan">
        <label className="block">
          <span className="label">Judul panggilan</span>
          <input name="title" defaultValue={call?.title} minLength={5} maxLength={120} required className="field" placeholder="Contoh: Relawan dapur umum banjir Demak" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Kategori</span>
            <select name="category_id" defaultValue={call?.category_id ?? ""} required className="field">
              <option value="" disabled>
                Pilih kategori
              </option>
              {master.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <fieldset>
          <legend className="label">Tingkat beban</legend>
          <div className="grid gap-2 sm:grid-cols-6">
            {LOADS.map((l, i) => {
              const locked = l.level === 2 && !verified;
              return (
                <label
                  key={l.value}
                  className={`flex cursor-pointer gap-3 rounded-xl border-2 p-3 ${i < 3 ? "sm:col-span-2" : "sm:col-span-3"} ${load === l.value ? "border-ink bg-ink text-paper" : "border-line bg-surface"} ${locked ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input type="radio" name="load" value={l.value} checked={load === l.value} disabled={locked} onChange={() => setLoad(l.value)} className="sr-only" />
                  <span>
                    <span className="font-semibold">{l.label}</span>
                    <span className={`block text-xs ${load === l.value ? "text-paper/70" : "text-ink-muted"}`}>{locked ? "Butuh verifikasi organisasi" : l.hint}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <p className="hint">Tingkat Berat dan Darurat otomatis mewajibkan relawan Level 2 (KTP terverifikasi + kontak darurat).</p>
        </fieldset>
        {load === "darurat" && (
          <label className="flex items-start gap-3 rounded-xl border-2 border-sigap bg-sigap-wash/50 p-4">
            <input type="checkbox" name="is_emergency" defaultChecked={call?.is_emergency ?? true} className="mt-1 size-4 accent-[var(--sigap-ink)]" />
            <span>
              <span className="inline-flex items-center gap-1.5 font-semibold">
                <Siren className="size-4" aria-hidden /> Tandai sebagai panggilan darurat
              </span>
              <span className="block text-sm text-ink-soft">Dipin di beranda, dikirim ke relawan Siaga Darurat terdekat tanpa batas notifikasi harian, undangan berlaku 6 jam.</span>
            </span>
          </label>
        )}
        <label className="block">
          <span className="label">Tugas relawan</span>
          <textarea
            name="description"
            defaultValue={call?.description}
            required
            minLength={30}
            maxLength={5000}
            rows={7}
            className="field"
            placeholder="Apa yang akan dikerjakan, berapa lama per hari, perlengkapan yang perlu dibawa, siapa yang akan dibantu…"
          />
        </label>
      </Section>

      <Section title="Lokasi & jadwal">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="label">Lokasi kerja</span>
            <select name="mode" value={mode} onChange={(e) => setMode(e.target.value as typeof mode)} className="field">
              <option value="onsite">Di lokasi</option>
              <option value="online">Online</option>
              <option value="hybrid">Hybrid</option>
            </select>
          </label>
          {mode !== "online" && (
            <>
              <label className="block">
                <span className="label">Kota</span>
                <select name="city_id" defaultValue={call?.city_id ?? ""} required className="field">
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
              </label>
              <label className="block">
                <span className="label">Alamat / titik kumpul</span>
                <input name="address" defaultValue={call?.address ?? ""} className="field" />
                <span className="hint block">Hanya terlihat oleh relawan yang diterima.</span>
              </label>
            </>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="label">Mulai</span>
            <input type="date" name="start_date" min={today} defaultValue={call?.start_date} required className="field" />
          </label>
          <label className="block">
            <span className="label">Selesai</span>
            <input type="date" name="end_date" min={today} defaultValue={call?.end_date} className="field" />
          </label>
          <label className="block">
            <span className="label">Jam mulai</span>
            <input type="time" name="start_time" defaultValue={call?.start_time?.slice(0, 5)} className="field" />
          </label>
          <label className="block">
            <span className="label">Jam selesai</span>
            <input type="time" name="end_time" defaultValue={call?.end_time?.slice(0, 5)} className="field" />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Jumlah relawan dibutuhkan</span>
            <input type="number" name="quota" min={1} max={1000} defaultValue={call?.quota ?? 5} required className="field" />
          </label>
          <label className="block">
            <span className="label">Batas pendaftaran</span>
            <input type="date" name="deadline" min={today} defaultValue={call?.deadline} required className="field" />
          </label>
        </div>
      </Section>

      <Section title="Kriteria relawan" hint="Kriteria wajib menyaring relawan. Preferensi hanya menaikkan skor kecocokan.">
        <SkillPicker
          label="Skill wajib"
          name="required_skills"
          master={master}
          selected={required}
          onToggle={(id) => {
            setRequired(toggle(required, id));
            setPreferred((p) => {
              const n = new Set(p);
              n.delete(id);
              return n;
            });
          }}
        />
        <SkillPicker label="Skill yang diutamakan" name="preferred_skills" master={master} selected={preferred} exclude={required} onToggle={(id) => setPreferred(toggle(preferred, id))} />
        <fieldset>
          <legend className="label">Tugas ini melibatkan</legend>
          <p className="hint mb-2 mt-0">Relawan dengan keterbatasan terkait tidak akan dicocokkan.</p>
          <div className="flex flex-wrap gap-2">
            {master.limitations.map((l) => (
              <label key={l.id} className="choice">
                <input type="checkbox" name="involves" value={l.id} defaultChecked={call?.involves.some((i) => i.limitation.id === l.id)} />
                {l.task_label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="label">Usia min.</span>
            <input type="number" name="age_min" min={17} max={99} defaultValue={call?.age_min ?? ""} className="field" />
          </label>
          <label className="block">
            <span className="label">Usia maks.</span>
            <input type="number" name="age_max" min={17} max={99} defaultValue={call?.age_max ?? ""} className="field" />
          </label>
          <label className="block sm:col-span-2">
            <span className="label">Jenis kelamin</span>
            <select name="gender" value={gender} onChange={(e) => setGender(e.target.value as typeof gender)} className="field">
              <option value="">Semua</option>
              <option value="P">Hanya perempuan</option>
              <option value="L">Hanya laki-laki</option>
            </select>
          </label>
        </div>
        {gender && (
          <label className="block">
            <span className="label">Alasan kriteria jenis kelamin</span>
            <input name="gender_reason" defaultValue={call?.gender_reason ?? ""} required className="field" placeholder="Misal: mendampingi korban perempuan di pengungsian" />
            <span className="hint block">Wajib diisi dan ditampilkan ke relawan.</span>
          </label>
        )}
        {load === "promosi" && (
          <label className="block max-w-xs">
            <span className="label">Minimal pengikut media sosial</span>
            <input type="number" name="min_followers" min={0} defaultValue={call?.min_followers ?? ""} className="field" />
          </label>
        )}
      </Section>

      <Section title="Yang didapat relawan" hint="Wajib jujur. Panggilan promosi tanpa imbalan yang jelas bisa diturunkan admin.">
        <div className="flex flex-wrap gap-2">
          {BENEFITS.map((b) => (
            <label key={b.value} className="choice">
              <input type="checkbox" name="benefits" value={b.value} defaultChecked={call?.benefits.includes(b.value)} />
              {b.label}
            </label>
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Uang saku per hari (Rp, opsional)</span>
            <input type="number" name="allowance" min={0} step={1000} defaultValue={call?.allowance ?? ""} className="field" />
          </label>
          {load === "promosi" && (
            <label className="block">
              <span className="label">Komisi affiliate (%)</span>
              <input type="number" name="commission_pct" min={0} max={100} defaultValue={call?.commission_pct ?? ""} className="field" />
            </label>
          )}
        </div>
      </Section>

      <Section title="Syarat lamaran">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="need_cv" defaultChecked={call?.need_cv} className="size-4 accent-[var(--ink)]" /> Wajib melampirkan CV
        </label>
        <div className="space-y-2">
          <p className="label">Pertanyaan untuk pelamar (maks 3)</p>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input name="questions" defaultValue={q} maxLength={200} className="field" aria-label={`Pertanyaan ${i + 1}`} />
              <button type="button" className="btn btn-ghost px-3" aria-label="Hapus pertanyaan" onClick={() => setQuestions(questions.filter((_, j) => j !== i))}>
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          {questions.length < 3 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setQuestions([...questions, ""])}>
              <Plus className="size-4" aria-hidden /> Tambah pertanyaan
            </button>
          )}
        </div>
      </Section>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="sticky bottom-0 -mx-4 flex flex-wrap justify-end gap-3 border-t border-line bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border">
        {isDraft ? (
          <>
            <button type="submit" className="btn btn-outline" disabled={pending} onClick={submit(false)}>
              Simpan draf
            </button>
            <button type="submit" className="btn btn-primary" disabled={pending || !phoneVerified} onClick={submit(true)} title={phoneVerified ? undefined : "Verifikasi nomor HP dulu"}>
              {pending ? "Memproses…" : "Publikasikan & cari relawan"}
            </button>
          </>
        ) : (
          <button type="submit" className="btn btn-ink" disabled={pending} onClick={submit(false)}>
            {pending ? "Menyimpan…" : "Simpan perubahan"}
          </button>
        )}
      </div>
      {isDraft && !phoneVerified && <p className="text-right text-sm text-sigap-ink">Verifikasi nomor HP di Profil organisasi untuk bisa mempublikasikan.</p>}
    </form>
  );
}

const URGENCY_STYLE: Record<CallDraft["urgency"], string> = {
  rendah: "bg-guyub-wash text-guyub-deep",
  sedang: "bg-ladang-wash text-[#6b5410]",
  tinggi: "bg-sigap-wash text-sigap-ink",
  kritis: "bg-danger-wash text-danger",
};

type SpeechRec = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

export function AiDraftPanel({
  onApply,
  verified,
  draft = draftCallWithAi,
  maxLength = 800,
  initial = "",
}: {
  onApply: (d: CallDraft) => void;
  verified: boolean;
  draft?: (text: string) => Promise<{ error?: string; draft?: CallDraft }>;
  maxLength?: number;
  initial?: string;
}) {
  const [brief, setBrief] = useState(initial);
  const [pending, start] = useTransition();
  const [result, setResult] = useState<CallDraft | null>(null);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRec | null>(null);

  function toggleVoice() {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Browser ini belum mendukung input suara. Coba Chrome atau Edge.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "id-ID";
    rec.interimResults = true;
    rec.continuous = true;
    const base = brief.trim() ? `${brief.trim()} ` : "";
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      setBrief((base + text).slice(0, maxLength));
    };
    rec.onerror = (e) => {
      if (e.error === "not-allowed") toast.error("Izinkan akses mikrofon untuk memakai input suara.");
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
    };
    recRef.current = rec;
    rec.start();
    setListening(true);
  }

  function run(text = brief) {
    recRef.current?.stop();
    start(async () => {
      const res = await draft(text);
      if (res.error || !res.draft) {
        toast.error(res.error ?? "Gagal membuat draf.");
        return;
      }
      setResult(res.draft);
      onApply(res.draft);
      toast.success("Form terisi. Periksa lagi sebelum dipublikasikan.");
    });
  }

  return (
    <section className="panel space-y-4 border-sigap p-5 sm:p-7">
      <div>
        <h2 className="h-section inline-flex items-center gap-2 text-lg">
          <Sparkles className="size-5 text-sigap-ink" aria-hidden /> Isi cepat dengan AI
        </h2>
        <p className="text-sm text-ink-muted">Ketik atau ucapkan kebutuhanmu dengan bahasa sehari-hari. AI menyusun judul, tugas, kategori, jumlah relawan, menilai urgensi, dan memeriksa tanda penipuan.</p>
      </div>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={3}
        maxLength={maxLength}
        className="field"
        aria-label="Kebutuhan relawan"
        placeholder="Contoh: Banjir di Kampung Pulo sejak tadi pagi, butuh 15 orang buat bantu dapur umum dan angkut logistik sampai Minggu"
      />
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={`btn btn-sm ${listening ? "btn-ink" : "btn-outline"}`} onClick={toggleVoice} aria-pressed={listening}>
          {listening ? <MicOff className="size-4" aria-hidden /> : <Mic className="size-4" aria-hidden />} {listening ? "Berhenti merekam" : "Bicara"}
        </button>
        <button type="button" className="btn btn-primary btn-sm" disabled={pending || brief.trim().length < 10} onClick={() => run()}>
          <Sparkles className="size-4" aria-hidden /> {pending ? "AI sedang menyusun…" : "Susun dengan AI"}
        </button>
        {listening && <span className="text-sm text-sigap-ink">Mendengarkan… (Bahasa Indonesia)</span>}
        {result && (
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${URGENCY_STYLE[result.urgency]}`}>
            Urgensi: {result.urgency}
          </span>
        )}
      </div>
      {result && (
        <p className="text-sm text-ink-soft">
          {result.urgency_reason}
          {result.load === "darurat" && !verified && " Tingkat Darurat butuh verifikasi organisasi, jadi diset ke Sedang."}
          {result.source === "aturan" && " (Mode cadangan: layanan AI sedang tidak tersedia.)"}
        </p>
      )}
      {result && result.risk_flags.length > 0 && (
        <div role="alert" className="rounded-xl border-2 border-danger bg-danger-wash p-4 text-sm text-danger">
          <p className="inline-flex items-center gap-1.5 font-semibold">
            <ShieldAlert className="size-4" aria-hidden /> Periksa sebelum dipublikasikan
          </p>
          <ul className="mt-1 list-disc pl-5">
            {result.risk_flags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          <p className="mt-1">Lengkapi informasi keselamatan yang kurang. Panggilan yang meminta uang atau data pribadi relawan akan diturunkan admin.</p>
        </div>
      )}
    </section>
  );
}

function toggle(set: Set<number>, id: number) {
  const n = new Set(set);
  if (n.has(id)) n.delete(id);
  else n.add(id);
  return n;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="panel space-y-4 p-5 sm:p-7">
      <div>
        <h2 className="h-section text-lg">{title}</h2>
        {hint && <p className="text-sm text-ink-muted">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function SkillPicker({
  label,
  name,
  master,
  selected,
  exclude,
  onToggle,
}: {
  label: string;
  name: string;
  master: MasterData;
  selected: Set<number>;
  exclude?: Set<number>;
  onToggle: (id: number) => void;
}) {
  const [q, setQ] = useState("");
  const shown = master.skills.filter((s) => !exclude?.has(s.id) && (q ? s.name.toLowerCase().includes(q.toLowerCase()) : true));
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      {[...selected].map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div className="mb-2 flex flex-wrap gap-1.5">
        {[...selected].map((id) => (
          <button key={id} type="button" onClick={() => onToggle(id)} className="rounded-full bg-ink px-3 py-1 text-sm text-paper" aria-label={`Hapus ${master.skills.find((s) => s.id === id)?.name}`}>
            {master.skills.find((s) => s.id === id)?.name} ×
          </button>
        ))}
        {selected.size === 0 && <span className="text-sm text-ink-muted">Belum ada.</span>}
      </div>
      <details className="rounded-xl border border-line">
        <summary className="cursor-pointer px-3 py-2 text-sm font-medium">Pilih skill</summary>
        <div className="border-t border-line p-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cari skill…" className="field mb-3" aria-label="Cari skill" />
          <div className="flex max-h-56 flex-wrap gap-1.5 overflow-y-auto">
            {shown.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={selected.has(s.id)}
                onClick={() => onToggle(s.id)}
                className={`rounded-full border px-3 py-1 text-sm ${selected.has(s.id) ? "border-ink bg-ink text-paper" : "border-line bg-surface hover:border-line-strong"}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
      </details>
    </fieldset>
  );
}
