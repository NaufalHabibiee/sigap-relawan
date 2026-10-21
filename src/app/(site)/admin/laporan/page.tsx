import type { Metadata } from "next";
import { Flag } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { ReportDecision } from "@/components/admin/admin-buttons";
import { Container, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Laporan" };

export default function AdminReports() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Reports />
      </Suspense>
  );
}

async function Reports() {
  await requireViewer("admin");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = data ?? [];
  const callIds = rows.filter((r) => r.target_type === "call").map((r) => r.target_id);
  const userIds = rows.filter((r) => r.target_type === "user").map((r) => r.target_id);
  const [{ data: calls }, { data: vols }, { data: seekers }] = await Promise.all([
    callIds.length ? supabase.from("calls").select("id, slug, title").in("id", callIds) : Promise.resolve({ data: [] as { id: string; slug: string; title: string }[] }),
    userIds.length ? supabase.from("volunteers").select("id, slug, nickname").in("id", userIds) : Promise.resolve({ data: [] as { id: string; slug: string; nickname: string | null }[] }),
    userIds.length ? supabase.from("seekers").select("id, slug, org_name").in("id", userIds) : Promise.resolve({ data: [] as { id: string; slug: string; org_name: string }[] }),
  ]);

  function target(type: string, id: string) {
    if (type === "call") {
      const c = calls?.find((x) => x.id === id);
      return c ? { href: `/panggilan/${c.slug}`, label: `Panggilan: ${c.title}` } : null;
    }
    if (type === "user") {
      const v = vols?.find((x) => x.id === id);
      if (v) return { href: `/relawan/${v.slug}`, label: `Relawan: ${v.nickname}` };
      const s = seekers?.find((x) => x.id === id);
      if (s) return { href: `/penyelenggara/${s.slug}`, label: `Penyelenggara: ${s.org_name}` };
    }
    return null;
  }

  return (
    <Container className="py-8">
      <PageHeader title="Laporan pengguna" description="Untuk pelanggaran berat, blokir pengguna di menu Pengguna atau turunkan panggilan di menu Panggilan." />
      {rows.length === 0 ? (
        <EmptyState icon={Flag} title="Belum ada laporan" />
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const t = target(r.target_type, r.target_id);
            return (
              <li key={r.id} className={`panel p-5 ${r.status === "open" ? "border-sigap" : "opacity-70"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold">{t ? <Link href={t.href} className="hover:underline">{t.label}</Link> : `${r.target_type} ${r.target_id.slice(0, 8)}`}</p>
                  <span className="text-xs text-ink-muted">
                    {r.status} · {formatDateTime(r.created_at)}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-line">{r.reason}</p>
                {r.admin_note && <p className="mt-2 text-sm text-ink-muted">Catatan admin: {r.admin_note}</p>}
                {r.status === "open" && (
                  <div className="mt-3">
                    <ReportDecision id={r.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
