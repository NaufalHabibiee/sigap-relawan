import type { Metadata } from "next";
import { Suspense } from "react";
import { MasterForm } from "@/components/admin/admin-buttons";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";

export const metadata: Metadata = { title: "Admin · Master data" };

export default function AdminMaster() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Master />
      </Suspense>
  );
}

async function Master() {
  await requireViewer("admin");
  const m = await getMasterData();
  return (
    <Container className="space-y-8 py-8">
      <PageHeader title="Master data" description="Dipakai di formulir profil, panggilan, dan engine pencocokan." />
      <Block title={`Kategori (${m.categories.length})`} items={m.categories.map((c) => c.name)}>
        <MasterForm kind="categories" />
      </Block>
      <Block title={`Skill (${m.skills.length})`} items={m.skills.map((s) => `${s.name} · ${m.categories.find((c) => c.id === s.category_id)?.name ?? "—"}`)}>
        <MasterForm kind="skills" categories={m.categories} />
      </Block>
      <Block title={`Keterbatasan (${m.limitations.length})`} items={m.limitations.map((l) => `${l.name} → ${l.task_label}`)}>
        <MasterForm kind="limitations" />
      </Block>
      <Block title={`Kota (${m.cities.length})`} items={m.cities.map((c) => `${c.name}, ${c.province}`)}>
        <MasterForm kind="cities" />
      </Block>
    </Container>
  );
}

function Block({ title, items, children }: { title: string; items: string[]; children: React.ReactNode }) {
  return (
    <section className="panel p-5">
      <h2 className="font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-ink-muted">Lihat daftar</summary>
        <ul className="mt-2 columns-1 gap-6 text-sm sm:columns-2 lg:columns-3">
          {items.map((i) => (
            <li key={i} className="py-0.5">
              {i}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
