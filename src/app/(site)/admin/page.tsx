import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { DemoOtpToggle } from "@/components/admin/admin-buttons";
import { EmailQueueCard } from "@/components/admin/email-queue-card";
import { emailConfigured } from "@/lib/email";
import { Card, Hero, Row, Tile, TileGrid } from "@/components/cards";
import { Activity, ArrowRight, BarChart3, CheckCircle2, Flag, Handshake, Layers, Megaphone, ShieldCheck, UserRound, Users } from "lucide-react";
import { Container, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDateTime, formatNumber, isoDaysAgo } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin" };

export default function AdminHome() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Overview />
      </Suspense>
  );
}

async function Overview() {
  await requireViewer("admin");
  const supabase = await createServerSupabase();
  const since = new Date(isoDaysAgo(13));
  const count = (table: string, filter?: (q: ReturnType<ReturnType<typeof supabase.from>["select"]>) => unknown) => {
    const q = supabase.from(table).select("*", { count: "exact", head: true });
    return (filter ? filter(q) : q) as unknown as Promise<{ count: number | null }>;
  };
  const [lvl0, lvl1, lvl2, seekers, active, emergency, apps, accepted, matches, pendingVer, openReports, recent, audit, otp, emailQueue] = await Promise.all([
    count("volunteers", (q) => q.eq("verification_level", 0)),
    count("volunteers", (q) => q.eq("verification_level", 1)),
    count("volunteers", (q) => q.eq("verification_level", 2)),
    count("seekers"),
    count("calls", (q) => q.eq("status", "aktif")),
    count("calls", (q) => q.eq("status", "aktif").eq("is_emergency", true)),
    count("applications"),
    count("applications", (q) => q.in("status", ["accepted", "completed"])),
    count("matches"),
    count("verification_requests", (q) => q.eq("status", "pending")),
    count("reports", (q) => q.eq("status", "open")),
    supabase.from("profiles").select("created_at, role").gte("created_at", since.toISOString()),
    supabase.from("admin_audit_log").select("action, target, created_at").order("created_at", { ascending: false }).limit(8),
    supabase.from("app_settings").select("value").eq("key", "demo_otp").maybeSingle(),
    supabase.rpc("email_queue", { p_limit: 200 }),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(since.getTime() + i * 86400000);
    return { key: d.toISOString().slice(0, 10), label: d.getDate(), v: 0, s: 0 };
  });
  for (const p of recent.data ?? []) {
    const day = days.find((d) => d.key === p.created_at.slice(0, 10));
    if (!day) continue;
    if (p.role === "seeker") day.s++;
    else day.v++;
  }
  const max = Math.max(1, ...days.map((d) => d.v + d.s));
  const accRate = apps.count ? Math.round(((accepted.count ?? 0) / apps.count) * 100) : 0;
  const volunteers = (lvl0.count ?? 0) + (lvl1.count ?? 0) + (lvl2.count ?? 0);
  const signupsTotal = days.reduce((a, d) => a + d.v + d.s, 0);
  const todo = (pendingVer.count ?? 0) + (openReports.count ?? 0);

  const levels = [
    { label: "Level 2 · identitas terverifikasi", value: lvl2.count ?? 0, color: "bg-guyub" },
    { label: "Level 1 · profil lengkap", value: lvl1.count ?? 0, color: "bg-ladang" },
    { label: "Level 0 · belum lengkap", value: lvl0.count ?? 0, color: "bg-line-strong" },
  ];
  const funnel = [
    { label: "Kecocokan tersimpan", value: matches.count ?? 0 },
    { label: "Lamaran & undangan", value: apps.count ?? 0 },
    { label: "Diterima atau selesai", value: accepted.count ?? 0 },
  ];
  const funnelMax = Math.max(1, ...funnel.map((f) => f.value));

  return (
    <Container className="space-y-4 py-8">
      <Hero
        aside={
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:w-80">
            <Link href="/admin/verifikasi" className="rounded-2xl border border-paper/15 bg-paper/5 p-4 transition-colors hover:bg-paper/10">
              <ShieldCheck className="size-5 text-sigap" aria-hidden />
              <span className="mt-3 block font-display text-3xl leading-none font-bold">{pendingVer.count ?? 0}</span>
              <span className="mt-1 block text-xs text-paper/70">Verifikasi menunggu</span>
            </Link>
            <Link href="/admin/laporan" className="rounded-2xl border border-paper/15 bg-paper/5 p-4 transition-colors hover:bg-paper/10">
              <Flag className="size-5 text-sigap" aria-hidden />
              <span className="mt-3 block font-display text-3xl leading-none font-bold">{openReports.count ?? 0}</span>
              <span className="mt-1 block text-xs text-paper/70">Laporan terbuka</span>
            </Link>
          </div>
        }
      >
        <p className="text-sm font-medium text-paper/70">Panel admin</p>
        <h1 className="h-section mt-2 text-3xl sm:text-4xl">Ringkasan platform</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-paper/75">
          {todo > 0 ? `${todo} hal menunggu tindakanmu.` : "Tidak ada antrean. Semua verifikasi dan laporan sudah ditangani."}
        </p>
        {todo > 0 && (
          <Link href={(pendingVer.count ?? 0) > 0 ? "/admin/verifikasi" : "/admin/laporan"} className="btn btn-primary mt-5">
            Tangani sekarang <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </Hero>

      <TileGrid>
        <Tile icon={Users} tint="bg-guyub-wash text-guyub-deep" value={formatNumber(volunteers)} label="Relawan terdaftar" sub={`${lvl2.count ?? 0} sudah Level 2`} />
        <Tile icon={UserRound} value={formatNumber(seekers.count ?? 0)} label="Penyelenggara" />
        <Tile icon={Megaphone} tint="bg-sigap-wash text-sigap-ink" value={formatNumber(active.count ?? 0)} label="Panggilan aktif" sub={`${emergency.count ?? 0} berstatus darurat`} />
        <Tile icon={CheckCircle2} tint="bg-ladang-wash text-[#6b5410]" value={`${accRate}%`} label="Tingkat diterima" sub={`${formatNumber(accepted.count ?? 0)} dari ${formatNumber(apps.count ?? 0)} lamaran`} />
      </TileGrid>

      <Row
        main={
          <Card icon={Handshake} title="Alur pencocokan" meta="Keseluruhan">
            <ul className="space-y-5">
              {funnel.map((f, i) => {
                const prev = i > 0 ? funnel[i - 1].value : 0;
                const rate = i > 0 && prev > 0 ? Math.round((f.value / prev) * 100) : null;
                return (
                  <li key={f.label}>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-ink-soft">{f.label}</span>
                      <span className="flex items-baseline gap-2">
                        {rate !== null && <span className="text-xs font-medium text-ink-muted">{rate}% dari tahap sebelumnya</span>}
                        <span className="font-display text-xl font-bold">{formatNumber(f.value)}</span>
                      </span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-paper" aria-hidden>
                      <div className={`h-full rounded-full ${i === 0 ? "bg-ink" : i === 1 ? "bg-sigap" : "bg-guyub"}`} style={{ width: `${Math.max(2, (f.value / funnelMax) * 100)}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>
        }
        side={
          <Card icon={Layers} title="Level relawan" meta={formatNumber(volunteers)}>
            <div className="flex h-4 overflow-hidden rounded-full bg-paper" role="img" aria-label="Sebaran level verifikasi relawan">
              {levels.map((l) => (
                <span key={l.label} className={l.color} style={{ width: `${volunteers ? (l.value / volunteers) * 100 : 0}%` }} />
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {levels.map((l) => (
                <li key={l.label} className="flex items-center gap-3 text-sm">
                  <span className={`size-3 shrink-0 rounded-full ${l.color}`} aria-hidden />
                  <span className="flex-1 text-ink-soft">{l.label}</span>
                  <span className="font-semibold">{l.value}</span>
                </li>
              ))}
            </ul>
          </Card>
        }
      />

      <Row
        main={
          <Card icon={BarChart3} title="Pendaftar 14 hari terakhir" meta={`${signupsTotal} baru`}>
            <p className="flex items-center gap-4 text-sm text-ink-muted">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-guyub" /> Relawan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-ink" /> Penyelenggara
              </span>
            </p>
            <div className="relative mt-4" role="img" aria-label="Grafik pendaftar harian">
              <div className="flex h-44 items-end gap-2">
                {days.map((d) => (
                  <div key={d.key} className="flex h-full flex-1 flex-col items-center gap-1.5" title={`${d.key}: ${d.v} relawan, ${d.s} penyelenggara`}>
                    <div className="flex w-full flex-1 flex-col justify-end overflow-hidden rounded-lg bg-paper">
                      <div className="w-full bg-ink" style={{ height: `${(d.s / max) * 100}%` }} />
                      <div className="w-full bg-guyub" style={{ height: `${(d.v / max) * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-ink-muted">{d.label}</span>
                  </div>
                ))}
              </div>
              {signupsTotal === 0 && (
                <p className="absolute inset-x-0 top-1/3 text-center text-sm text-ink-muted">Belum ada pendaftar baru dalam 14 hari terakhir.</p>
              )}
            </div>
          </Card>
        }
        side={
          <Card icon={Activity} title="Aktivitas admin">
            <ul className="space-y-3 text-sm">
              {(audit.data ?? []).length === 0 && <li className="text-ink-muted">Belum ada aktivitas tercatat.</li>}
              {(audit.data ?? []).map((a, i) => (
                <li key={i} className="flex items-start justify-between gap-3">
                  <span className="font-mono text-xs break-all">{a.action}</span>
                  <span className="shrink-0 text-xs text-ink-muted">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-5 border-t border-line pt-4">
              <EmailQueueCard pending={(emailQueue.data as unknown[] | null)?.length ?? 0} configured={emailConfigured} />
              <DemoOtpToggle on={otp.data?.value === true} />
            </div>
          </Card>
        }
      />
    </Container>
  );
}
