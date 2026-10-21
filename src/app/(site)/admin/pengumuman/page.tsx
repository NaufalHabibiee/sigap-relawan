import type { Metadata } from "next";
import { Suspense } from "react";
import { AnnouncementForm, AnnouncementToggle } from "@/components/admin/admin-buttons";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Pengumuman" };

export default function AdminAnnouncements() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Announcements />
      </Suspense>
  );
}

async function Announcements() {
  await requireViewer("admin");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("announcements").select("*").order("created_at", { ascending: false });
  return (
    <Container className="max-w-3xl space-y-6 py-8">
      <PageHeader title="Pengumuman" description="Banner bencana tampil di atas panggilan darurat di beranda." />
      <AnnouncementForm />
      <ul className="divide-y divide-line overflow-hidden rounded-3xl border border-line bg-surface">
        {(data ?? []).map((a) => (
          <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-semibold">
                {a.is_disaster && <span className="mr-2 text-sigap-ink">[Bencana]</span>}
                {a.title}
              </p>
              {a.body && <p className="text-sm text-ink-soft">{a.body}</p>}
              <p className="text-xs text-ink-muted">
                {formatDateTime(a.created_at)} · {a.active ? "tayang" : "disembunyikan"}
              </p>
            </div>
            <AnnouncementToggle id={a.id} active={a.active} />
          </li>
        ))}
      </ul>
    </Container>
  );
}
