import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft, CalendarDays, Clock, Hourglass, MapPin, SearchX, Sparkles, UserPlus, Users } from "lucide-react";
import { Tile, TileGrid } from "@/components/cards";
import { AiRanking } from "@/components/seeker/ai-ranking";
import { CallControls } from "@/components/seeker/call-controls";
import { InviteButton } from "@/components/seeker/invite-button";
import { QuickDecision } from "@/components/seeker/quick-decision";
import { AppStatusBadge, Avatar, CallStatusBadge, Container, EmptyState, LevelBadge, LoadTag, PageSkeleton, ScoreBadge } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDateRange, timeAgo } from "@/lib/format";
import { getOwnCall } from "@/lib/seeker-data";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Kelola panggilan" };

export default function ManageCallPage(props: PageProps<"/p/panggilan/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Manage params={props.params} searchParams={props.searchParams} />
      </Suspense>
  );
}

type Vol = { id: string; slug: string; nickname: string | null; avatar_url: string | null; verification_level: number; city: { name: string } | null };
type AppRow = { id: string; status: AppStatus; source: string; created_at: string; message: string | null; volunteer: Vol | null };

async function Manage({ params, searchParams }: Pick<PageProps<"/p/panggilan/[id]">, "params" | "searchParams">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const viewer = await requireViewer("seeker");
  const call = await getOwnCall(id, viewer.id);
  if (!call) notFound();
  const supabase = await createServerSupabase();
  const volSelect = "id, slug, nickname, avatar_url, verification_level, city:cities(name)";
  const [{ data: matchData }, { data: appData }] = await Promise.all([
    supabase.from("matches").select(`score, reasons, volunteer:volunteers(${volSelect})`).eq("call_id", id).order("score", { ascending: false }).limit(60),
    supabase.from("applications").select(`id, status, source, created_at, message, volunteer:volunteers(${volSelect})`).eq("call_id", id).order("created_at", { ascending: false }),
  ]);
  const apps = (appData ?? []) as unknown as AppRow[];
  const connected = new Set(apps.map((a) => a.volunteer?.id));
  const matches = ((matchData ?? []) as unknown as { score: number; reasons: string[]; volunteer: Vol | null }[]).filter((m) => m.volunteer && !connected.has(m.volunteer.id));
  const applicants = apps.filter((a) => !["accepted", "completed", "no_show"].includes(a.status));
  const team = apps.filter((a) => ["accepted", "completed", "no_show"].includes(a.status));
  const fresh = apps.filter((a) => a.status === "applied").length;

  const tab = sp.tab === "pelamar" || sp.tab === "tim" ? sp.tab : call.status === "aktif" ? "rekomendasi" : applicants.length ? "pelamar" : "tim";
  const tabs = [
    { key: "rekomendasi", label: `Rekomendasi (${matches.length})` },
    { key: "pelamar", label: `Pelamar & undangan (${applicants.length})${fresh ? ` · ${fresh} baru` : ""}` },
    { key: "tim", label: `Tim relawan (${team.length}/${call.quota})` },
  ];

  return (
    <Container className="space-y-4 py-8">
      <Link href="/p" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Semua panggilan
      </Link>

      <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <LoadTag load={call.load} />
          <CallStatusBadge status={call.status} />
        </div>
        <h1 className="h-section mt-3 text-2xl sm:text-3xl">{call.title}</h1>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-ink-soft">
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays className="size-4 text-ink-muted" aria-hidden /> {formatDateRange(call.start_date, call.end_date)}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <MapPin className="size-4 text-ink-muted" aria-hidden /> {call.mode === "online" ? "Online" : call.city?.name}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <Clock className="size-4 text-ink-muted" aria-hidden /> Batas daftar {formatDateRange(call.deadline, call.deadline)}
          </li>
        </ul>
        <div className="mt-5">
          <CallControls call={{ id: call.id, slug: call.slug, status: call.status, acceptedCount: team.filter((t) => t.status === "accepted").length }} />
        </div>
      </section>

      <TileGrid>
        <Tile icon={Sparkles} tint="bg-sigap-wash text-sigap-ink" value={matches.length} label="Relawan cocok" />
        <Tile icon={UserPlus} tint="bg-ladang-wash text-[#6b5410]" value={fresh} label="Pelamar baru" />
        <Tile icon={Users} tint="bg-guyub-wash text-guyub-deep" value={`${team.length}/${call.quota}`} label="Tim terkumpul" />
        <Tile icon={Hourglass} value={applicants.length} label="Menunggu keputusan" />
      </TileGrid>

      <nav className="flex gap-2 overflow-x-auto pt-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Bagian panggilan">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/p/panggilan/${id}?tab=${t.key}`}
            aria-current={tab === t.key ? "page" : undefined}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.key ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      <div>
        {tab === "rekomendasi" &&
          (call.status !== "aktif" ? (
            <EmptyState icon={Sparkles} title="Rekomendasi muncul saat panggilan aktif" body={call.status === "draf" ? "Publikasikan panggilan agar sistem mencari relawan yang cocok." : "Panggilan ini tidak sedang menerima relawan."} />
          ) : matches.length === 0 ? (
            <EmptyState icon={SearchX} title="Belum ada relawan yang cocok" body="Coba longgarkan skill wajib, perluas lokasi ke online/hybrid, atau kurangi batasan usia." action={{ href: `/p/panggilan/${id}/ubah`, label: "Ubah kriteria" }} />
          ) : (
            <>
            <AiRanking callId={id} volunteers={matches.map((m) => ({ id: m.volunteer!.id, nickname: m.volunteer!.nickname }))} />
            <ul className="grid gap-4 md:grid-cols-2">
              {matches.map((m) => (
                <li key={m.volunteer!.id} className="panel flex flex-col gap-4 p-6">
                  <div className="flex items-start gap-3">
                    <Avatar src={m.volunteer!.avatar_url} name={m.volunteer!.nickname ?? "?"} size={48} />
                    <div className="min-w-0 flex-1">
                      <Link href={`/relawan/${m.volunteer!.slug}`} className="font-semibold hover:underline" target="_blank">
                        {m.volunteer!.nickname}
                      </Link>
                      <p className="flex items-center gap-1 text-sm text-ink-muted">
                        <MapPin className="size-3.5" aria-hidden /> {m.volunteer!.city?.name ?? "—"}
                      </p>
                      <div className="mt-1">
                        <LevelBadge level={m.volunteer!.verification_level} />
                      </div>
                    </div>
                    <ScoreBadge score={m.score} />
                  </div>
                  <p className="text-sm text-guyub-deep">{m.reasons.join(" · ")}</p>
                  <InviteButton callId={id} volunteerId={m.volunteer!.id} name={m.volunteer!.nickname ?? "relawan"} />
                </li>
              ))}
            </ul>
            </>
          ))}

        {tab === "pelamar" &&
          (applicants.length === 0 ? (
            <EmptyState icon={UserPlus} title="Belum ada pelamar" body="Relawan yang cocok sudah dikabari. Kamu juga bisa mengundang dari tab Rekomendasi." />
          ) : (
            <PeopleList rows={applicants} showDecision={call.status === "aktif"} />
          ))}

        {tab === "tim" && (team.length === 0 ? <EmptyState icon={Users} title="Belum ada relawan yang bergabung" /> : <PeopleList rows={team} />)}
      </div>
    </Container>
  );
}

function PeopleList({ rows, showDecision }: { rows: AppRow[]; showDecision?: boolean }) {
  return (
    <ul className="space-y-4">
      {rows.map((a) => (
        <li key={a.id} className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-5">
          <Avatar src={a.volunteer?.avatar_url} name={a.volunteer?.nickname ?? "?"} size={48} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">{a.volunteer?.nickname}</p>
            <p className="text-sm text-ink-muted">
              {a.source === "invite" ? "Diundang" : "Melamar"} {timeAgo(a.created_at)} · {a.volunteer?.city?.name}
            </p>
            {a.message && <p className="mt-0.5 line-clamp-1 text-sm text-ink-soft">“{a.message}”</p>}
          </div>
          <AppStatusBadge status={a.status} />
          {showDecision && (a.status === "applied" || a.status === "reviewing") && <QuickDecision appId={a.id} />}
          <Link href={`/pesan/${a.id}`} className="btn btn-outline btn-sm">
            Buka
          </Link>
        </li>
      ))}
    </ul>
  );
}
