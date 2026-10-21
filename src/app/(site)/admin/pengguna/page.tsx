import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { BanButton } from "@/components/admin/admin-buttons";
import { Container, LevelBadge, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Admin · Pengguna" };

export default function AdminUsers(props: PageProps<"/admin/pengguna">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Users searchParams={props.searchParams} />
      </Suspense>
  );
}

type U = { id: string; email: string; role: string; name: string; slug: string | null; level: number | null; verified: boolean | null; banned_at: string | null; created_at: string };

async function Users({ searchParams }: Pick<PageProps<"/admin/pengguna">, "searchParams">) {
  const viewer = await requireViewer("admin");
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.slice(0, 60) : "";
  const role = sp.peran === "volunteer" || sp.peran === "seeker" ? sp.peran : "";
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc("admin_users", { p_q: q, p_role: role });
  const users = (data ?? []) as U[];

  return (
    <Container className="py-8">
      <PageHeader title="Pengguna" />
      <form className="mb-4 flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={q} placeholder="Cari email atau nama" className="field max-w-xs" aria-label="Cari" />
        <select name="peran" defaultValue={role} className="field max-w-48" aria-label="Peran">
          <option value="">Semua peran</option>
          <option value="volunteer">Relawan</option>
          <option value="seeker">Penyelenggara</option>
        </select>
        <button className="btn btn-ink">Cari</button>
      </form>
      <div className="overflow-x-auto rounded-3xl border border-line bg-surface">
        <table className="w-full min-w-[46rem] text-sm">
          <thead className="border-b border-line text-left text-ink-muted">
            <tr>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">Peran</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Daftar</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.map((u) => (
              <tr key={u.id} className={u.banned_at ? "bg-danger-wash/40" : ""}>
                <td className="px-4 py-3">
                  {u.slug ? (
                    <Link href={u.role === "seeker" ? `/penyelenggara/${u.slug}` : `/relawan/${u.slug}`} className="font-medium hover:underline">
                      {u.name}
                    </Link>
                  ) : (
                    <span className="font-medium">{u.name}</span>
                  )}
                  <span className="block text-xs text-ink-muted">{u.email}</span>
                </td>
                <td className="px-4 py-3">{u.role === "volunteer" ? "Relawan" : u.role === "seeker" ? "Penyelenggara" : "Admin"}</td>
                <td className="px-4 py-3">
                  {u.banned_at ? (
                    <span className="font-semibold text-danger">Diblokir</span>
                  ) : u.role === "volunteer" ? (
                    <LevelBadge level={u.level ?? 0} />
                  ) : u.role === "seeker" ? (
                    u.verified ? "Terverifikasi" : "Dasar"
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                <td className="px-4 py-3 text-right">{u.role !== "admin" && u.id !== viewer.id && <BanButton userId={u.id} banned={Boolean(u.banned_at)} />}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
