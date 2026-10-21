import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { TakedownButton } from "@/components/admin/admin-buttons";
import { CallStatusBadge, Container, LoadTag, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CallStatus, Load } from "@/lib/types";

export const metadata: Metadata = { title: "Admin · Panggilan" };

export default function AdminCalls(props: PageProps<"/admin/panggilan">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Calls searchParams={props.searchParams} />
      </Suspense>
  );
}

const STATUSES: CallStatus[] = ["aktif", "penuh", "draf", "ditutup", "selesai", "dibatalkan"];

async function Calls({ searchParams }: Pick<PageProps<"/admin/panggilan">, "searchParams">) {
  await requireViewer("admin");
  const sp = await searchParams;
  const status = STATUSES.includes(sp.status as CallStatus) ? (sp.status as CallStatus) : null;
  const supabase = await createServerSupabase();
  let q = supabase.from("calls").select("id, slug, title, load, status, is_emergency, start_date, created_at, seeker:seekers(org_name, verified)").order("created_at", { ascending: false }).limit(200);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  const rows = (data ?? []) as unknown as { id: string; slug: string; title: string; load: Load; status: CallStatus; start_date: string; created_at: string; seeker: { org_name: string; verified: boolean } | null }[];

  return (
    <Container className="py-8">
      <PageHeader title="Semua panggilan" />
      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/admin/panggilan" className={`btn btn-sm ${!status ? "btn-ink" : "btn-ghost"}`}>
          Semua
        </Link>
        {STATUSES.map((s) => (
          <Link key={s} href={`/admin/panggilan?status=${s}`} className={`btn btn-sm ${status === s ? "btn-ink" : "btn-ghost"}`}>
            {s}
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full min-w-[48rem] text-sm">
          <thead className="border-b border-line text-left text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Panggilan</th>
              <th className="px-4 py-3 font-medium">Penyelenggara</th>
              <th className="px-4 py-3 font-medium">Mulai</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-3">
                  <LoadTag load={c.load} />
                  <Link href={`/panggilan/${c.slug}`} className="mt-1 block font-medium hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {c.seeker?.org_name} {c.seeker?.verified && "✓"}
                </td>
                <td className="px-4 py-3">{formatDate(c.start_date)}</td>
                <td className="px-4 py-3">
                  <CallStatusBadge status={c.status} />
                </td>
                <td className="px-4 py-3 text-right">{["aktif", "penuh", "draf"].includes(c.status) && <TakedownButton callId={c.id} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
