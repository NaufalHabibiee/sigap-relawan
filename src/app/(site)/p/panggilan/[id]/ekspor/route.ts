import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Neutralise spreadsheet formulas in user-supplied text, then quote.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

const STATUS: Record<string, string> = {
  applied: "Dilamar",
  invited: "Diundang",
  reviewing: "Ditinjau",
  accepted: "Diterima",
  rejected: "Tidak diterima",
  declined: "Undangan ditolak",
  expired: "Kedaluwarsa",
  cancelled: "Dibatalkan",
  completed: "Selesai",
  no_show: "Tidak hadir",
};

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return new NextResponse("Unauthorized", { status: 401 });

  const { data: call } = await supabase.from("calls").select("title, slug").eq("id", id).eq("seeker_id", uid).maybeSingle();
  if (!call) return new NextResponse("Not found", { status: 404 });

  const { data } = await supabase
    .from("applications")
    .select("status, source, message, created_at, volunteer:volunteers(nickname, verification_level, city:cities(name))")
    .eq("call_id", id)
    .order("created_at", { ascending: true });

  type Row = { status: string; source: string; message: string | null; created_at: string; volunteer: { nickname: string | null; verification_level: number; city: { name: string } | null } | null };
  const rows = (data ?? []) as unknown as Row[];
  const header = ["Nama panggilan", "Kota", "Level verifikasi", "Asal", "Status", "Pesan", "Tanggal"];
  const lines = [
    header.map(cell).join(","),
    ...rows.map((r) =>
      [r.volunteer?.nickname, r.volunteer?.city?.name, r.volunteer?.verification_level, r.source === "invite" ? "Undangan" : "Lamaran", STATUS[r.status] ?? r.status, r.message, r.created_at.slice(0, 10)].map(cell).join(","),
    ),
  ];
  // UTF-8 BOM so Excel reads Indonesian characters correctly.
  return new NextResponse("\uFEFF" + lines.join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="relawan-${call.slug}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
