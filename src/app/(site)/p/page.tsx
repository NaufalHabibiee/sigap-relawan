import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, ClipboardList, Megaphone, Plus, ShieldCheck, Sparkles, UserPlus, Users } from "lucide-react";
import { Card, Hero, Row, Tile, TileGrid } from "@/components/cards";
import { CallStatusBadge, Container, EmptyState, LoadTag, PageSkeleton, Rating, VerifiedMark } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getStats } from "@/lib/data";
import { formatDateRange } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CallStatus, Load } from "@/lib/types";

export const metadata: Metadata = { title: "Beranda penyelenggara" };

export default function SeekerHome() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Home />
    </Suspense>
  );
}

type CallRowData = { id: string; slug: string; title: string; load: Load; status: CallStatus; start_date: string; end_date: string; quota: number; is_emergency: boolean };

async function Home() {
  const viewer = await requireViewer("seeker");
  const supabase = await createServerSupabase();
  const [{ data: calls }, { data: apps }, { data: matches }, { data: seeker }, stats] = await Promise.all([
    supabase.from("calls").select("id, slug, title, load, status, start_date, end_date, quota, is_emergency").eq("seeker_id", viewer.id).order("created_at", { ascending: false }),
    supabase.from("applications").select("call_id, status, call:calls!inner(seeker_id)").eq("call.seeker_id", viewer.id),
    supabase.from("matches").select("call_id, score, call:calls!inner(seeker_id)").eq("call.seeker_id", viewer.id).gte("score", 50),
    supabase.from("seekers").select("description, city_id, pic_name, verified").eq("id", viewer.id).single(),
    getStats(viewer.id),
  ]);
  const rows = (calls ?? []) as CallRowData[];
  const count = (callId: string, statuses: string[]) => (apps ?? []).filter((a) => a.call_id === callId && statuses.includes(a.status)).length;
  const matchCount = (callId: string) => (matches ?? []).filter((m) => m.call_id === callId).length;
  const live = rows.filter((c) => c.status === "aktif" || c.status === "penuh");
  const drafts = rows.filter((c) => c.status === "draf");
  const past = rows.filter((c) => ["ditutup", "selesai", "dibatalkan"].includes(c.status));
  const newApplicants = (apps ?? []).filter((a) => a.status === "applied").length;
  const teamTotal = (apps ?? []).filter((a) => a.status === "accepted" || a.status === "completed").length;
  const profileGaps = [!seeker?.description && "deskripsi organisasi", !seeker?.city_id && "kota", !seeker?.pic_name && "nama penanggung jawab", !viewer.phoneVerified && "verifikasi nomor HP"].filter(
    Boolean,
  ) as string[];

  return (
    <Container className="space-y-4 py-8">
      <Hero>
        <p className="flex items-center gap-2 text-sm font-medium text-paper/70">
          {viewer.name} {viewer.verified && <VerifiedMark label="Terverifikasi" />}
        </p>
        <h1 className="h-section mt-2 text-3xl sm:text-4xl">{newApplicants > 0 ? `${newApplicants} pelamar baru menunggu` : live.length > 0 ? "Panggilanmu sedang berjalan" : "Mulai cari relawan"}</h1>
        <p className="mt-3 text-[0.95rem] leading-relaxed text-paper/75">
          {newApplicants > 0
            ? "Tinjau pelamar dan putuskan siapa yang bergabung. Relawan yang cocok sudah dikabari otomatis."
            : "Tulis kebutuhan relawanmu. Sigap langsung mencari dan mengabari relawan yang cocok."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link href="/p/panggilan/baru" className="btn btn-primary">
            <Plus className="size-4" aria-hidden /> Buat panggilan
          </Link>
          {!viewer.verified && (
            <Link href="/p/verifikasi" className="btn border border-paper/25 text-paper hover:bg-paper/10">
              Ajukan verifikasi
            </Link>
          )}
        </div>
      </Hero>

      <TileGrid>
        <Tile icon={Megaphone} tint="bg-sigap-wash text-sigap-ink" value={live.length} label="Panggilan aktif" />
        <Tile icon={UserPlus} tint="bg-ladang-wash text-[#6b5410]" value={newApplicants} label="Pelamar baru" />
        <Tile icon={Users} tint="bg-guyub-wash text-guyub-deep" value={teamTotal} label="Relawan bergabung" />
        <Tile icon={CheckCircle2} value={stats.completed} label="Kegiatan selesai" />
      </TileGrid>

      {profileGaps.length > 0 && (
        <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-sigap/50 bg-sigap-wash/50 p-6">
          <div className="min-w-0">
            <p className="font-semibold">Lengkapi profil organisasi</p>
            <p className="mt-1 text-sm text-ink-soft">Relawan lebih percaya pada penyelenggara yang jelas. Masih kurang: {profileGaps.join(", ")}.</p>
          </div>
          <Link href="/p/profil" className="btn btn-ink btn-sm">
            Lengkapi profil <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      )}

      <Row
        main={
          <div className="space-y-4">
            <Group icon={Sparkles} title="Sedang berjalan" rows={live} count={count} matchCount={matchCount} empty="Belum ada panggilan aktif." />
            {drafts.length > 0 && <Group icon={ClipboardList} title="Draf" rows={drafts} count={count} matchCount={matchCount} />}
            {past.length > 0 && <Group icon={CalendarDays} title="Selesai & ditutup" rows={past} count={count} matchCount={matchCount} />}
          </div>
        }
        side={
          <div className="space-y-4">
            <Card icon={ShieldCheck} title="Reputasi">
              <Rating value={stats.rating_avg} count={stats.rating_count} />
              <p className="mt-2 text-sm text-ink-soft">{stats.completed} kegiatan selesai</p>
              {!viewer.verified && (
                <>
                  <p className="mt-4 text-sm text-ink-soft">Verifikasi organisasi untuk membuka panggilan tingkat Berat dan Darurat.</p>
                  <Link href="/p/verifikasi" className="btn btn-outline btn-sm mt-3 w-full">
                    Ajukan verifikasi
                  </Link>
                </>
              )}
            </Card>
          </div>
        }
      />
    </Container>
  );
}

function Group({
  icon,
  title,
  rows,
  count,
  matchCount,
  empty,
}: {
  icon: React.ComponentProps<typeof Card>["icon"];
  title: string;
  rows: CallRowData[];
  count: (id: string, s: string[]) => number;
  matchCount: (id: string) => number;
  empty?: string;
}) {
  return (
    <Card icon={icon} title={title} meta={rows.length ? String(rows.length) : undefined} className="h-auto">
      {rows.length === 0 ? (
        <EmptyState icon={Megaphone} title={empty ?? "Kosong"} body="Tulis kebutuhan relawanmu; sistem langsung mencari relawan yang cocok." action={{ href: "/p/panggilan/baru", label: "Buat panggilan" }} />
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((c) => {
            const accepted = count(c.id, ["accepted", "completed"]);
            const fresh = count(c.id, ["applied"]);
            const pct = Math.min(100, Math.round((accepted / Math.max(1, c.quota)) * 100));
            return (
              <li key={c.id} className="first:pt-0 last:pb-0">
                <Link href={`/p/panggilan/${c.id}`} className="group block rounded-2xl py-4 transition-colors hover:bg-ink/[0.02]">
                  <div className="flex flex-wrap items-center gap-2">
                    <LoadTag load={c.load} />
                    <CallStatusBadge status={c.status} />
                    {fresh > 0 && <span className="rounded-full bg-sigap-ink px-2 py-0.5 text-xs font-bold text-white">{fresh} pelamar baru</span>}
                  </div>
                  <p className="mt-2 text-lg leading-snug font-semibold group-hover:underline">{c.title}</p>
                  <p className="mt-0.5 text-sm text-ink-muted">{formatDateRange(c.start_date, c.end_date)}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2">
                    <div className="min-w-48 flex-1 max-w-sm">
                      <div className="h-2 overflow-hidden rounded-full bg-paper" aria-hidden>
                        <div className="h-full rounded-full bg-guyub" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-ink-muted">
                        {accepted} dari {c.quota} relawan diterima
                      </p>
                    </div>
                    {c.status === "aktif" && <span className="text-sm text-ink-soft">{matchCount(c.id)} relawan cocok</span>}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
