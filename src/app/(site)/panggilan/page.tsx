import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { CallRow } from "@/components/call-row";
import { Container, EmptyState, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { LOADS } from "@/lib/constants";
import { getAcceptedCounts, getMasterData, parseCallFilters, searchCalls, type CallFilters } from "@/lib/data";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Jelajah panggilan relawan",
  description: "Temukan panggilan relawan di seluruh Indonesia: tanggap bencana, pendidikan, lingkungan, acara sosial, dan promosi UMKM.",
};

export default function ExplorePage(props: PageProps<"/panggilan">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Explore searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Explore({ searchParams }: Pick<PageProps<"/panggilan">, "searchParams">) {
  const sp = await searchParams;
  const filters = parseCallFilters(sp);
  const [{ items, total, pageSize }, master, viewer] = await Promise.all([searchCalls(filters), getMasterData(), getViewer()]);
  const accepted = await getAcceptedCounts(items.map((c) => c.id));

  let scores: Record<string, { score: number; reasons: string[] }> = {};
  if (viewer?.role === "volunteer" && items.length) {
    const supabase = await createServerSupabase();
    const { data } = await supabase
      .from("matches")
      .select("call_id, score, reasons")
      .eq("volunteer_id", viewer.id)
      .in(
        "call_id",
        items.map((c) => c.id),
      );
    scores = Object.fromEntries((data ?? []).map((m) => [m.call_id, { score: m.score, reasons: m.reasons }]));
  }

  const provinces = [...new Set(master.cities.map((c) => c.province))].sort();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <Container className="py-10">
      <h1 className="h-section text-3xl sm:text-4xl">Jelajah panggilan</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        {total} panggilan sedang mencari relawan.{" "}
        {viewer?.role === "volunteer"
          ? "Angka kecocokan dihitung dari profilmu."
          : !viewer && (
              <>
                <Link href="/daftar?peran=relawan" className="font-semibold text-sigap-ink hover:underline">
                  Buat profil
                </Link>{" "}
                untuk melihat panggilan yang cocok denganmu.
              </>
            )}
      </p>

      <form method="get" className="mt-6 grid gap-3 rounded-3xl border border-line bg-surface p-5 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto]" role="search">
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="q" className="sr-only">
            Cari judul panggilan
          </label>
          <input id="q" name="q" defaultValue={filters.q} placeholder="Cari: dapur umum, mengajar, konten…" className="field" />
        </div>
        <FilterSelect name="kategori" label="Kategori" value={filters.category} options={master.categories.map((c) => [c.slug, c.name])} />
        <FilterSelect name="beban" label="Tingkat beban" value={filters.load} options={LOADS.map((l) => [l.value, l.label])} />
        <FilterSelect name="provinsi" label="Provinsi" value={filters.province} options={provinces.map((p) => [p, p])} />
        <FilterSelect
          name="mode"
          label="Lokasi kerja"
          value={filters.mode}
          options={[
            ["onsite", "Di lokasi"],
            ["online", "Online"],
            ["hybrid", "Hybrid"],
          ]}
        />
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-1">
          <button className="btn btn-ink flex-1">Terapkan</button>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm sm:col-span-2 lg:col-span-6">
          <label className="inline-flex items-center gap-2">
            <input type="checkbox" name="darurat" value="1" defaultChecked={filters.emergency} className="size-4 accent-[var(--sigap-ink)]" />
            Hanya darurat
          </label>
          <label className="inline-flex items-center gap-2">
            Urutkan
            <select name="urut" defaultValue={filters.sort} className="field !w-auto !py-1.5">
              <option value="terbaru">Terbaru</option>
              <option value="deadline">Batas daftar terdekat</option>
              <option value="mulai">Tanggal mulai</option>
            </select>
          </label>
          {hasFilters(filters) && (
            <Link href="/panggilan" className="text-ink-soft underline-offset-2 hover:underline">
              Hapus filter
            </Link>
          )}
        </div>
      </form>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <EmptyState icon={SearchX} title="Tidak ada panggilan yang sesuai" body="Coba longgarkan filter atau cari kata lain." action={{ href: "/panggilan", label: "Lihat semua" }} />
        ) : (
          items.map((c) => <CallRow key={c.id} call={c} accepted={accepted[c.id] ?? 0} score={scores[c.id]?.score} reasons={scores[c.id]?.reasons} />)
        )}
      </div>

      {pages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Halaman">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(Object.entries(sp).flatMap(([k, v]) => (typeof v === "string" && k !== "hal" ? [[k, v]] : [])));
            params.set("hal", String(p));
            return (
              <Link
                key={p}
                href={`/panggilan?${params}`}
                aria-current={p === filters.page ? "page" : undefined}
                className={`inline-flex size-9 items-center justify-center rounded-full text-sm font-semibold ${p === filters.page ? "bg-ink text-paper" : "hover:bg-ink/5"}`}
              >
                {p}
              </Link>
            );
          })}
        </nav>
      )}
    </Container>
  );
}

function hasFilters(f: CallFilters) {
  return Boolean(f.q || f.category || f.load || f.province || f.mode || f.emergency);
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: [string, string][] }) {
  return (
    <div>
      <label htmlFor={name} className="sr-only">
        {label}
      </label>
      <select id={name} name={name} defaultValue={value ?? ""} className="field">
        <option value="">{label}</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
