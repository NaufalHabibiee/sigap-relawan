import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getViewer, homeFor } from "@/lib/auth";
import { ChooseRole } from "./choose-role";

export const metadata: Metadata = { title: "Pilih peran" };

export default function StartPage() {
  return (
    <Suspense fallback={null}>
      <Start />
    </Suspense>
  );
}

async function Start() {
  const viewer = await getViewer();
  if (!viewer) redirect("/masuk");
  if (viewer.roleConfirmed) redirect(homeFor(viewer.role));
  return (
    <div>
      <h1 className="h-section text-3xl">Satu langkah lagi</h1>
      <p className="mt-2 text-ink-soft">Kamu ingin memakai Sigap sebagai apa? Pilihan ini tidak bisa diubah nanti.</p>
      <ChooseRole />
    </div>
  );
}
