import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, MapPin, Siren, Sparkles } from "lucide-react";
import { MatchCard } from "@/components/volunteer/match-card";
import { DismissMatch } from "@/components/volunteer/dismiss-match";
import { Container, EmptyState, LevelBadge, PageSkeleton, Rating } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { CARD_SELECT, getStats } from "@/lib/data";
import { formatDate, formatDateRange, formatTime, timeLeft, todayJakarta } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CallCard } from "@/lib/types";
import { completeness, getMyVolunteer, missingForLevel1 } from "@/lib/volunteer-data";

export const metadata: Metadata = { title: "Beranda relawan" };

export default function VolunteerHome() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Home />
      </Suspense>
  );
}

async function Home() {
  const viewer = await requireViewer("volunteer");
  const supabase = await createServerSupabase();
  const today = todayJakarta();
  const [me, stats, matchesRes, appsRes] = await Promise.all([
    getMyVolunteer(viewer.id),
    getStats(viewer.id),
    supabase
      .from("matches")
      .select(`score, reasons, call:calls!inner(${CARD_SELECT})`)
      .eq("volunteer_id", viewer.id)
      .eq("dismissed", false)
      .eq("call.status", "aktif")
      .order("score", { ascending: false })
      .limit(30),
    supabase
      .from("applications")
      .select("id, status, expires_at, call:calls(id, slug, title, start_date, end_date, start_time, mode, is_emergency, city:cities(name))")
      .eq("volunteer_id", viewer.id)
      .in("status", ["invited", "accepted", "applied", "reviewing"])
      .order("created_at", { ascending: false }),
  ]);
  // Fire-and-forget: the activity ping must not delay the page. The query builder is lazy, so `.then` starts it.
  supabase.rpc("touch_activity").then(
    () => {},
    () => {},
  );

  const missing = missingForLevel1(me);
  const pct = completeness(me);
  type MatchRow = { score: number; reasons: string[]; call: CallCard };
  const matches = (matchesRes.data ?? []) as unknown as MatchRow[];
  const strong = matches.filter((m) => m.score >= 70);
  const maybe = matches.filter((m) => m.score < 70);
  type AppRow = {
    id: string;
    status: string;
    expires_at: string | null;
    call: { id: string; slug: string; title: string; start_date: string; end_date: string; start_time: string | null; mode: string; is_emergency: boolean; city: { name: string } | null };
  };
  const apps = (appsRes.data ?? []) as unknown as AppRow[];
  const invites = apps.filter((a) => a.status === "invited");
  const upcoming = apps.filter((a) => a.status === "accepted" && a.call.end_date >= today).sort((a, b) => a.call.start_date.localeCompare(b.call.start_date));
  const pendingCount = apps.filter((a) => a.status === "applied" || a.status === "reviewing").length;
  const appliedIds = new Set(apps.map((a) => a.call.id));
  const paused = me.paused_until && me.paused_until >= today;

  const hour = Number(new Intl.DateTimeFormat("en-GB", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Jakarta" }).format(new Date()));
  const greeting = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
  const headline =
    strong.length > 0 ? `${strong.length} panggilan cocok untukmu` : viewer.level === 0 ? "Lengkapi profil untuk mulai dicocokkan" : "Belum ada panggilan yang sangat cocok";
  const subline =
    invites.length > 0
      ? `${invites.length} undangan menunggu jawabanmu. Jawab sebelum kedaluwarsa.`
      : upcoming.length > 0
        ? `Kegiatan terdekatmu: ${upcoming[0].call.title}, ${formatDateRange(upcoming[0].call.start_date, upcoming[0].call.end_date)}.`
        : "Sigap mengabari saat ada panggilan yang cocok dengan kemampuan dan waktu luangmu.";
  const tiles = [
    { label: "Cocok untukmu", value: strong.length, icon: Sparkles, href: "#cocok" },
    { label: "Menunggu keputusan", value: pendingCount, icon: Clock, href: "/r/lamaran" },
    { label: "Kegiatan mendatang", value: upcoming.length, icon: CalendarDays, href: "/r/lamaran" },
    { label: "Kegiatan selesai", value: stats.completed, icon: CheckCircle2, href: "/r/lamaran" },
  ];
  const ringC = 2 * Math.PI * 34;

  return (
    <Container className="space-y-8 py-8">
      {/* Hero */}
      <header className="relative overflow-hidden rounded-3xl bg-ink p-6 text-paper sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(30rem_18rem_at_88%_0%,rgba(232,98,44,0.38),transparent_70%),radial-gradient(circle_at_1px_1px,rgba(238,236,229,0.08)_1px,transparent_0)] [background-size:auto,24px_24px]"
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 max-w-xl">
            <p className="text-sm font-medium text-paper/70">
              {greeting}, {me.nickname ?? "relawan"}
            </p>
            <h1 className="h-section mt-2 text-3xl sm:text-4xl">{headline}</h1>
            <p className="mt-3 text-[0.95rem] leading-relaxed text-paper/75">{subline}</p>
            {paused && <p className="mt-2 text-sm text-sigap">Notifikasi kecocokan dijeda sampai {me.paused_until}. Ubah di Pengaturan.</p>}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              {missing.length > 0 ? (
                <Link href="/r/profil" className="btn btn-primary">
                  Lengkapi profil <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : (
                <Link href="/panggilan" className="btn btn-primary">
                  Jelajah panggilan <ArrowRight className="size-4" aria-hidden />
                </Link>
              )}
              <Link href="/r/lamaran" className="btn border border-paper/25 text-paper hover:bg-paper/10">
                Kegiatanku
              </Link>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-4 rounded-3xl border border-paper/15 bg-paper/5 p-4 sm:flex-col sm:items-start sm:p-5">
            <div className="relative size-20">
              <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden>
                <circle cx="40" cy="40" r="34" fill="none" strokeWidth="7" className="stroke-paper/15" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - pct / 100)}
                  className="stroke-sigap"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center font-display text-lg font-bold" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                {pct}%
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold">Kelengkapan profil</p>
              <p className="mt-0.5 text-xs text-paper/70">
                {viewer.level >= 2 ? "Identitas terverifikasi" : viewer.level === 1 ? "Level 1 · profil lengkap" : "Belum mencapai Level 1"}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stat tiles */}
      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.label}>
            <Link
              href={t.href}
              className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-line-strong"
            >
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-sigap-ink">
                <t.icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block font-display text-2xl leading-none font-bold">{t.value}</span>
                <span className="mt-1 block text-xs leading-snug font-medium text-ink-muted">{t.label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Needs attention */}
      {missing.length > 0 && (
        <section className="rounded-3xl border border-sigap/50 bg-sigap-wash/50 p-5 sm:p-6">
          <h2 className="font-semibold">Profilmu belum bisa dicocokkan</h2>
          <p className="mt-1 text-sm text-ink-soft">Lengkapi hal berikut agar mencapai Level 1 dan mulai menerima notifikasi panggilan:</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {missing.map((m) => (
              <li key={m.label}>
                <Link
                  href={m.step === 0 ? "/r/verifikasi" : `/r/profil?langkah=${m.step}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-sigap/30 bg-white px-3.5 py-1.5 text-sm font-medium hover:border-sigap"
                >
                  {m.label} <ArrowRight className="size-3.5 text-sigap-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {invites.length > 0 && (
        <section>
          <h2 className="h-section mb-3 text-xl">Undangan menunggu jawabanmu</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {invites.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-sigap/50 border-l-4 border-l-sigap bg-surface p-4">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    {a.call.is_emergency && <Siren className="size-4 shrink-0 text-sigap-ink" aria-label="Darurat" />}
                    <span className="truncate">{a.call.title}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-muted">
                    {formatDateRange(a.call.start_date, a.call.end_date)} · {a.call.mode === "online" ? "Online" : a.call.city?.name}
                    {a.expires_at && ` · ${timeLeft(a.expires_at)}`}
                  </p>
                </div>
                <Link href={`/pesan/${a.id}`} className="btn btn-primary btn-sm">
                  Lihat undangan
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="min-w-0 space-y-10">
          <section id="cocok" className="scroll-mt-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="h-section text-xl">Cocok untukmu</h2>
              <Link href="/panggilan" className="inline-flex items-center gap-1 text-sm font-semibold text-sigap-ink hover:underline">
                Jelajah semua <ArrowRight className="size-3.5" aria-hidden />
              </Link>
            </div>
            {strong.length === 0 ? (
              <EmptyState
                icon={Sparkles}
                title={viewer.level === 0 ? "Belum ada kecocokan" : "Belum ada panggilan dengan kecocokan tinggi"}
                body="Tambah skill, perluas radius, atau tandai lebih banyak waktu luang agar peluang cocok lebih besar."
                action={{ href: "/r/profil?langkah=3", label: "Perbarui minat & ketersediaan" }}
              />
            ) : (
              <div className="space-y-4">
                {strong.map((m) => (
                  <MatchCard
                    key={m.call.id}
                    call={m.call}
                    score={m.score}
                    reasons={m.reasons}
                    footer={!appliedIds.has(m.call.id) ? <DismissMatch callId={m.call.id} /> : <span className="text-xs font-semibold text-guyub">Sudah terhubung</span>}
                  />
                ))}
              </div>
            )}
          </section>

          {maybe.length > 0 && (
            <section>
              <h2 className="h-section text-xl">Mungkin cocok</h2>
              <p className="mt-1 text-sm text-ink-muted">Kecocokan sedang. Tidak dikirim sebagai notifikasi.</p>
              <div className="mt-4 space-y-4">
                {maybe.slice(0, 8).map((m) => (
                  <MatchCard key={m.call.id} call={m.call} score={m.score} reasons={m.reasons} footer={<DismissMatch callId={m.call.id} />} />
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <LevelBadge level={viewer.level} />
              <Rating value={stats.rating_avg} count={stats.rating_count} />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e3e0d6]" aria-hidden>
              <div className="h-full rounded-full bg-guyub" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-xs text-ink-muted">Profil {pct}% lengkap. Semakin lengkap, semakin akurat kecocokannya.</p>
            {viewer.level === 1 && (
              <Link href="/r/verifikasi" className="btn btn-outline btn-sm mt-4 w-full">
                Naik ke Level 2
              </Link>
            )}
          </div>

          <div className="panel p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold">Kegiatan mendatang</h2>
              {upcoming.length > 4 && (
                <Link href="/r/lamaran" className="text-xs font-semibold text-sigap-ink hover:underline">
                  Semua
                </Link>
              )}
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-3 text-sm text-ink-muted">Belum ada kegiatan yang kamu ikuti. Lamar panggilan yang cocok untuk mengisi jadwalmu.</p>
            ) : (
              <ul className="mt-4 space-y-1">
                {upcoming.slice(0, 4).map((a) => (
                  <li key={a.id}>
                    <Link href={`/pesan/${a.id}`} className="flex gap-3 rounded-xl p-2 transition-colors hover:bg-ink/5">
                      <span className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-ink text-paper">
                        <span className="font-display text-base leading-none font-bold">{formatDate(a.call.start_date, { day: "numeric" })}</span>
                        <span className="mt-0.5 text-[0.65rem] font-semibold tracking-wide uppercase text-paper/70">
                          {formatDate(a.call.start_date, { month: "short" })}
                        </span>
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{a.call.title}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-ink-muted">
                          {a.call.start_time && <span>{formatTime(a.call.start_time)}</span>}
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden />
                            {a.call.mode === "online" ? "Online" : a.call.city?.name}
                          </span>
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </Container>
  );
}
