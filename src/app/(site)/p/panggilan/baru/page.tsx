import type { Metadata } from "next";
import { Suspense } from "react";
import { CallForm } from "@/components/seeker/call-form";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";

export const metadata: Metadata = { title: "Buat panggilan" };

export default function NewCallPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <NewCall />
      </Suspense>
  );
}

async function NewCall() {
  const viewer = await requireViewer("seeker");
  const master = await getMasterData();
  return (
    <Container className="max-w-4xl py-8">
      <PageHeader title="Buat panggilan relawan" description="Setelah dipublikasikan, sistem langsung menghitung kecocokan dan mengabari relawan yang paling sesuai." />
      <CallForm master={master} verified={viewer.verified} phoneVerified={viewer.phoneVerified} />
    </Container>
  );
}
