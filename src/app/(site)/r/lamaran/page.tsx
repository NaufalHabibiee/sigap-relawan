import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Clock, MailOpen, MapPin, Sparkles, Wifi } from "lucide-react";
import { AppStatusBadge, Container, EmptyState, LoadTag, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { ACTIVE_APP } from "@/lib/constants";
import { formatDate, formatDateRange, timeAgo, timeLeft } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppStatus, Load } from "@/lib/types";

export const metadata: Metadata = { title: "Kegiatanku" };

export default function MyApplications() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <List />
    </Suspense>
  );
}

type Row = {
  id: string;
  status: AppStatus;
  source: string;
  updated_at: string;
  expires_at: string | null;
  call: {
    slug: string;
    title: string;
    load: Load;
    mode: string;
    start_date: string;
    end_date: string;
    city: { name: string } | null;
    seeker: { org_name: string } | null;
  };
};

async function List() {
  const viewer = await requireViewer("volunteer");
  const supabase = await createServerSupabase();
  const [{ data }, { data: myReviews }] = await Promise.all([
    supabase
      .from("applications")
      .select("id, status, source, updated_at, expires_at, call:calls(slug, title, load, mode, start_date, end_date, city:cities(name), seeker:seekers(org_name))")
      .eq("volunteer_id", viewer.id)
      .order("updated_at", { ascending: false }),
    supabase.from("reviews").select("application_id").eq("reviewer_id", viewer.id),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const reviewed = new Set((myReviews ?? []).map((r) => r.application_id));
  const invited = rows.filter((r) => r.status === "invited");
  const running = rows.filter((r) => ACTIVE_APP.includes(r.status) && r.status !== "invited");
  const history = rows.filter((r) => !ACTIVE_APP.includes(r.status));
  const tiles = [
    { label: "Undangan baru", value: invited.length, icon: MailOpen },
    { label: "Menunggu keputusan", value: rows.filter((r) => r.status === "applied" || r.status === "reviewing").length, icon: Clock },
    { label: "Diterima", value: rows.filter((r) => r.status === "accepted").length, icon: Sparkles },
    { label: "Selesai", value: rows.filter((r) => r.status === "completed").length, icon: CheckCircle2 },
  ];

  return (
    <Container className="py-8">
      <PageHeader
        title="Kegiatanku"
        description="Lamaran, undangan, dan riwayat kegiatanmu."
        actions={
          <Link href="/panggilan" className="btn btn-ink btn-sm">
            Jelajah panggilan <ArrowRight className="size-4" aria-hidden />
          </Link>
        }
      />
      {rows.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Belum ada kegiatan" body="Lamar panggilan yang cocok atau tunggu undangan dari penyelenggara." action={{ href: "/panggilan", label: "Jelajah panggilan" }} />
      ) : (
        <div className="space-y-10">
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {tiles.map((t) => (
              <li key={t.label} className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4">
                <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-paper text-sigap-ink">
                  <t.icon className="size-5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-2xl leading-none font-bold">{t.value}</span>
                  <span className="mt-1 block text-xs leading-snug font-medium text-ink-muted">{t.label}</span>
                </span>
              </li>
            ))}
          </ul>

          <Section title="Menunggu jawabanmu" hint="Jawab sebelum undangan kedaluwarsa." rows={invited} reviewed={reviewed} />
          <Section title="Sedang berjalan" rows={running} reviewed={reviewed} />
          <Section title="Riwayat" rows={history} reviewed={reviewed} muted />
        </div>
      )}
    </Container>
  );
}

const STEPS = ["Dilamar", "Ditinjau", "Diterima", "Selesai"];
const STEP_OF: Partial<Record<AppStatus, number>> = { applied: 0, reviewing: 1, accepted: 2, completed: 3 };

/** Four-segment progress bar for the happy path of an application. */
function Progress({ status }: { status: AppStatus }) {
  const step = STEP_OF[status];
  if (step === undefined) return null;
  return (
    <div className="mt-3 max-w-sm" aria-label={`Tahap ${step + 1} dari ${STEPS.length}: ${STEPS[step]}`}>
      <div className="flex gap-1.5">
        {STEPS.map((s, i) => (
          <span key={s} className={`h-1.5 flex-1 rounded-full ${i <= step ? (status === "completed" ? "bg-ink" : "bg-guyub") : "bg-line/70"}`} />
        ))}
      </div>
      <p className="mt-1.5 text-xs font-medium text-ink-muted">
        Tahap {step + 1} dari {STEPS.length} · {STEPS[step]}
      </p>
    </div>
  );
}

function actionLabel(r: Row, reviewed: Set<string>): { text: string; strong: boolean } {
  if (r.status === "invited") return { text: "Jawab undangan", strong: true };
  if (r.status === "completed" && !reviewed.has(r.id)) return { text: "Beri ulasan", strong: true };
  if (ACTIVE_APP.includes(r.status)) return { text: "Buka percakapan", strong: false };
  return { text: "Lihat detail", strong: false };
}

function Section({ title, hint, rows, reviewed, muted }: { title: string; hint?: string; rows: Row[]; reviewed: Set<string>; muted?: boolean }) {
  if (!rows.length) return null;
  return (
    <section>
      <div className="flex flex-wrap items-baseline gap-x-3">
        <h2 className="h-section text-xl">{title}</h2>
        <span className="rounded-full bg-[#e3e1d8] px-2 py-0.5 text-xs font-semibold text-ink-soft">{rows.length}</span>
      </div>
      {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      <ul className="mt-4 space-y-3">
        {rows.map((r) => {
          const invite = r.status === "invited";
          const action = actionLabel(r, reviewed);
          return (
            <li key={r.id}>
              <Link
                href={`/pesan/${r.id}`}
                className={`group flex flex-col gap-4 rounded-3xl border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-26px_rgba(27,36,48,0.55)] sm:flex-row sm:items-center sm:gap-5 sm:p-5 ${
                  invite ? "border-sigap/50 border-l-4 border-l-sigap" : "border-line hover:border-line-strong"
                } ${muted ? "opacity-90" : ""}`}
              >
                <span
                  className={`flex size-14 shrink-0 flex-col items-center justify-center rounded-xl ${
                    muted ? "bg-[#e3e1d8] text-ink-soft" : invite ? "bg-sigap-ink text-white" : "bg-ink text-paper"
                  }`}
                  aria-hidden
                >
                  <span className="font-display text-lg leading-none font-bold">{formatDate(r.call.start_date, { day: "numeric" })}</span>
                  <span className="mt-0.5 text-[0.65rem] font-semibold tracking-wide uppercase opacity-75">{formatDate(r.call.start_date, { month: "short" })}</span>
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <LoadTag load={r.call.load} />
                    <span className="text-xs text-ink-muted">
                      {invite ? "Diundang" : r.source === "invite" ? "Diundang" : "Melamar"} · diperbarui {timeAgo(r.updated_at)}
                    </span>
                    {invite && r.expires_at && <span className="text-xs font-semibold text-sigap-ink">{timeLeft(r.expires_at)}</span>}
                  </div>
                  <p className="mt-1.5 text-lg leading-snug font-semibold">{r.call.title}</p>
                  <ul className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                    {r.call.seeker && <li>{r.call.seeker.org_name}</li>}
                    <li className="inline-flex items-center gap-1.5">
                      <CalendarDays className="size-4 text-ink-muted" aria-hidden />
                      {formatDateRange(r.call.start_date, r.call.end_date)}
                    </li>
                    <li className="inline-flex items-center gap-1.5">
                      {r.call.mode === "online" ? <Wifi className="size-4 text-ink-muted" aria-hidden /> : <MapPin className="size-4 text-ink-muted" aria-hidden />}
                      {r.call.mode === "online" ? "Online" : (r.call.city?.name ?? "—")}
                    </li>
                  </ul>
                  {!muted && <Progress status={r.status} />}
                </div>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:flex-col sm:items-end sm:gap-2">
                  <AppStatusBadge status={r.status} />
                  <span className={`inline-flex items-center gap-1 text-sm font-semibold ${action.strong ? "text-sigap-ink" : "text-ink-muted group-hover:text-ink"}`}>
                    {action.text}
                    <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
