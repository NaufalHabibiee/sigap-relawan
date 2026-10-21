import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CallForm } from "@/components/seeker/call-form";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";
import { getOwnCall } from "@/lib/seeker-data";

export const metadata: Metadata = { title: "Ubah panggilan" };

export default function EditCallPage(props: PageProps<"/p/panggilan/[id]/ubah">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Edit params={props.params} />
      </Suspense>
  );
}

async function Edit({ params }: Pick<PageProps<"/p/panggilan/[id]/ubah">, "params">) {
  const { id } = await params;
  const viewer = await requireViewer("seeker");
  const [call, master] = await Promise.all([getOwnCall(id, viewer.id), getMasterData()]);
  if (!call) notFound();
  const editable = ["draf", "aktif", "penuh"].includes(call.status);
  return (
    <Container className="max-w-4xl py-8">
      <Link href={`/p/panggilan/${id}`} className="text-sm text-ink-muted hover:underline">
        ← Kembali ke panggilan
      </Link>
      <PageHeader title={call.status === "draf" ? "Lanjutkan draf" : "Ubah panggilan"} description={call.status !== "draf" ? "Perubahan pada panggilan aktif menghitung ulang kecocokan relawan." : undefined} />
      {editable ? (
        <CallForm master={master} call={call} verified={viewer.verified} phoneVerified={viewer.phoneVerified} />
      ) : (
        <p className="text-ink-soft">Panggilan yang sudah selesai atau dibatalkan tidak bisa diubah.</p>
      )}
    </Container>
  );
}
