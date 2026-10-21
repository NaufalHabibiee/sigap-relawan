import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Suspense } from "react";
import { VerificationDecision } from "@/components/admin/admin-buttons";
import { Container, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Verifikasi" };

export default function AdminVerify() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Queue />
      </Suspense>
  );
}

async function Queue() {
  await requireViewer("admin");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("verification_requests").select("id, user_id, kind, files, nik_last4, note, created_at").eq("status", "pending").order("created_at");
  const rows = data ?? [];
  const ids = rows.map((r) => r.user_id);
  const [{ data: vols }, { data: seekers }] = await Promise.all([
    ids.length ? supabase.from("volunteer_private").select("id, full_name, birth_date") .in("id", ids) : Promise.resolve({ data: [] as { id: string; full_name: string | null; birth_date: string | null }[] }),
    ids.length ? supabase.from("seekers").select("id, org_name, type, pic_name").in("id", ids) : Promise.resolve({ data: [] as { id: string; org_name: string; type: string; pic_name: string | null }[] }),
  ]);

  return (
    <Container className="py-8">
      <PageHeader title="Antrean verifikasi" description="Cocokkan nama dan foto dengan dokumen. Berkas dihapus otomatis setelah diputuskan." />
      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Antrean kosong" />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((r) => {
            const v = vols?.find((x) => x.id === r.user_id);
            const s = seekers?.find((x) => x.id === r.user_id);
            return (
              <li key={r.id} className="panel p-5">
                <p className="text-xs font-semibold text-ink-muted">{r.kind === "seeker" ? "Penyelenggara" : "Relawan Level 2"} · {formatDateTime(r.created_at)}</p>
                <p className="mt-1 text-lg font-semibold">{s ? s.org_name : v?.full_name}</p>
                <dl className="mt-2 space-y-0.5 text-sm text-ink-soft">
                  {v?.birth_date && <div>Tanggal lahir: {v.birth_date}</div>}
                  {r.nik_last4 && <div>4 digit NIK: {r.nik_last4}</div>}
                  {s && <div>Jenis: {s.type} · PIC: {s.pic_name ?? "—"}</div>}
                  {r.note && <div>Catatan: {r.note}</div>}
                </dl>
                <div className="mt-4">
                  <VerificationDecision id={r.id} files={r.files} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Container>
  );
}
