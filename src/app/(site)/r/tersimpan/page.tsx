import type { Metadata } from "next";
import { Bookmark } from "lucide-react";
import { Suspense } from "react";
import { CallRow } from "@/components/call-row";
import { Container, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { CARD_SELECT } from "@/lib/data";
import { createServerSupabase } from "@/lib/supabase/server";
import type { CallCard } from "@/lib/types";

export const metadata: Metadata = { title: "Tersimpan" };

export default function SavedPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Saved />
      </Suspense>
  );
}

async function Saved() {
  const viewer = await requireViewer("volunteer");
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("saved_calls").select(`call:calls(${CARD_SELECT})`).eq("volunteer_id", viewer.id).order("created_at", { ascending: false });
  const calls = ((data ?? []) as unknown as { call: CallCard | null }[]).map((r) => r.call).filter((c): c is CallCard => Boolean(c));
  return (
    <Container className="py-8">
      <PageHeader title="Panggilan tersimpan" />
      {calls.length === 0 ? (
        <EmptyState icon={Bookmark} title="Belum ada yang disimpan" body="Tekan “Simpan untuk nanti” di halaman panggilan." action={{ href: "/panggilan", label: "Jelajah panggilan" }} />
      ) : (
        <div className="space-y-3">
          {calls.map((c) => (
            <CallRow key={c.id} call={c} />
          ))}
        </div>
      )}
    </Container>
  );
}
