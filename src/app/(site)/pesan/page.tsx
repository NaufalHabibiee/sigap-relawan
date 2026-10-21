import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { ChevronRight, MessageSquare, SearchX } from "lucide-react";
import { AppStatusBadge, Avatar, Container, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { ACTIVE_APP } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Pesan" };

export default function InboxPage(props: PageProps<"/pesan">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Inbox searchParams={props.searchParams} />
    </Suspense>
  );
}

const FILTERS = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum dibaca" },
  { key: "berjalan", label: "Berjalan" },
  { key: "selesai", label: "Selesai & arsip" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

type Thread = {
  id: string;
  status: AppStatus;
  updated_at: string;
  volunteer: { nickname: string | null; avatar_url: string | null } | null;
  call: { title: string; seeker: { org_name: string; logo_url: string | null } | null } | null;
};

async function Inbox({ searchParams }: Pick<PageProps<"/pesan">, "searchParams">) {
  const sp = await searchParams;
  const viewer = await requireViewer();
  if (viewer.role === "admin") return <Container className="py-8">Admin tidak memiliki percakapan.</Container>;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("applications")
    .select("id, status, updated_at, volunteer:volunteers(nickname, avatar_url), call:calls!inner(title, seeker_id, seeker:seekers(org_name, logo_url))")
    .order("updated_at", { ascending: false })
    .limit(80);
  const threads = (data ?? []) as unknown as Thread[];
  const ids = threads.map((t) => t.id);
  const { data: msgs } = ids.length
    ? await supabase.from("messages").select("application_id, body, kind, sender_id, read_at, created_at").in("application_id", ids).order("created_at", { ascending: false }).limit(800)
    : { data: [] };
  const last = new Map<string, { body: string | null; created_at: string; kind: string; sender_id: string | null }>();
  const unread = new Map<string, number>();
  for (const m of msgs ?? []) {
    if (!last.has(m.application_id)) last.set(m.application_id, m);
    if (m.kind !== "system" && m.sender_id !== viewer.id && !m.read_at) unread.set(m.application_id, (unread.get(m.application_id) ?? 0) + 1);
  }
  const sorted = [...threads].sort((a, b) => (last.get(b.id)?.created_at ?? b.updated_at).localeCompare(last.get(a.id)?.created_at ?? a.updated_at));
  const isVol = viewer.role === "volunteer";

  const raw = Array.isArray(sp.f) ? sp.f[0] : sp.f;
  const filter: FilterKey = FILTERS.some((f) => f.key === raw) ? (raw as FilterKey) : "semua";
  const totalUnread = [...unread.values()].reduce((a, b) => a + b, 0);
  const counts: Record<FilterKey, number> = {
    semua: sorted.length,
    belum: sorted.filter((t) => (unread.get(t.id) ?? 0) > 0).length,
    berjalan: sorted.filter((t) => ACTIVE_APP.includes(t.status)).length,
    selesai: sorted.filter((t) => !ACTIVE_APP.includes(t.status)).length,
  };
  const shown = sorted.filter((t) =>
    filter === "belum" ? (unread.get(t.id) ?? 0) > 0 : filter === "berjalan" ? ACTIVE_APP.includes(t.status) : filter === "selesai" ? !ACTIVE_APP.includes(t.status) : true,
  );

  return (
    <Container className="py-8">
      <PageHeader
        title="Pesan"
        description={totalUnread > 0 ? `${totalUnread} pesan belum dibaca. Setiap lamaran dan undangan punya percakapan sendiri.` : "Setiap lamaran dan undangan punya percakapan sendiri."}
      />

      {sorted.length === 0 ? (
        <EmptyState icon={MessageSquare} title="Belum ada percakapan" body={isVol ? "Percakapan dimulai saat kamu melamar atau diundang." : "Percakapan dimulai saat relawan melamar atau kamu mengundang relawan."} />
      ) : (
        <>
          <nav aria-label="Saring percakapan" className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => {
              const active = f.key === filter;
              return (
                <Link
                  key={f.key}
                  href={f.key === "semua" ? "/pesan" : `/pesan?f=${f.key}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    active ? "border-ink bg-ink text-paper" : "border-line bg-surface text-ink-soft hover:border-line-strong hover:text-ink"
                  }`}
                >
                  {f.label}
                  <span className={`rounded-full px-1.5 text-xs leading-5 ${active ? "bg-paper/20" : "bg-[#e3e1d8]"}`}>{counts[f.key]}</span>
                </Link>
              );
            })}
          </nav>

          {shown.length === 0 ? (
            <EmptyState icon={SearchX} title="Tidak ada percakapan di sini" body="Coba pilih saringan lain." action={{ href: "/pesan", label: "Lihat semua" }} />
          ) : (
            <ul className="space-y-3">
              {shown.map((t) => {
                const name = isVol ? (t.call?.seeker?.org_name ?? "Penyelenggara") : (t.volunteer?.nickname ?? "Relawan");
                const avatar = isVol ? t.call?.seeker?.logo_url : t.volunteer?.avatar_url;
                const l = last.get(t.id);
                const n = unread.get(t.id) ?? 0;
                const mine = l?.sender_id === viewer.id && l.kind !== "system";
                const system = l?.kind === "system";
                return (
                  <li key={t.id}>
                    <Link
                      href={`/pesan/${t.id}`}
                      className={`group flex items-center gap-4 rounded-3xl border bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_36px_-26px_rgba(27,36,48,0.55)] sm:p-5 ${
                        n ? "border-sigap/50 border-l-4 border-l-sigap" : "border-line hover:border-line-strong"
                      }`}
                    >
                      <span className="relative shrink-0">
                        <Avatar src={avatar} name={name} size={52} square={isVol} />
                        {n > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-sigap-ink px-1 text-[11px] leading-5 font-bold text-white ring-2 ring-surface">
                            {n > 99 ? "99+" : n}
                          </span>
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className={`truncate text-base ${n ? "font-bold" : "font-semibold"}`}>{name}</p>
                          <span className={`shrink-0 text-xs ${n ? "font-semibold text-sigap-ink" : "text-ink-muted"}`}>{l ? timeAgo(l.created_at) : ""}</span>
                        </div>
                        <p className="mt-0.5 truncate text-sm font-medium text-ink-soft">{t.call?.title}</p>
                        <p className={`mt-1 truncate text-sm ${system ? "italic text-ink-muted" : n ? "font-medium text-ink" : "text-ink-muted"}`}>
                          {mine && <span className="text-ink-muted">Kamu: </span>}
                          {l?.body ?? "Lampiran"}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <AppStatusBadge status={t.status} />
                        <ChevronRight className="hidden size-4 text-ink-muted transition-transform group-hover:translate-x-0.5 sm:block" aria-hidden />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Container>
  );
}
