import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const d8 = (d: string) => d.replace(/-/g, "");
const t6 = (t: string) => t.slice(0, 5).replace(":", "") + "00";

/** RFC 5545 asks for 75-octet lines; fold long ones so strict calendar clients accept the file. */
function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 74) {
    out.push(rest.slice(0, 74));
    rest = " " + rest.slice(74);
  }
  out.push(rest);
  return out.join("\r\n");
}

function nextDay(d: string): string {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
}

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("Not found", { status: 404 });
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims?.sub) return new NextResponse("Unauthorized", { status: 401 });

  // RLS limits this to applications the signed-in user takes part in.
  const { data } = await supabase
    .from("applications")
    .select("id, status, call:calls(title, description, start_date, end_date, start_time, end_time, mode, address, city:cities(name))")
    .eq("id", id)
    .maybeSingle();
  const call = (data as unknown as { status: string; call: { title: string; description: string; start_date: string; end_date: string; start_time: string | null; end_time: string | null; mode: string; address: string | null; city: { name: string } | null } | null } | null)?.call;
  if (!data || !call || !["accepted", "completed"].includes((data as { status: string }).status)) return new NextResponse("Not found", { status: 404 });

  const where = call.mode === "online" ? "Online" : [call.address, call.city?.name].filter(Boolean).join(", ");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Sigap//Kegiatan relawan//ID", "CALSCALE:GREGORIAN", "BEGIN:VEVENT", `UID:${id}@sigap`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`];

  const multiDay = call.end_date > call.start_date;
  const timeNote = call.start_time ? `Jam ${call.start_time.slice(0, 5).replace(":", ".")}${call.end_time ? `–${call.end_time.slice(0, 5).replace(":", ".")}` : ""} WIB` : "";
  if (call.start_time && !multiDay) {
    const end = call.end_time ?? (() => {
      const h = Math.min(23, Number(call.start_time!.slice(0, 2)) + 3);
      return `${String(h).padStart(2, "0")}:${call.start_time!.slice(3, 5)}`;
    })();
    lines.push(`DTSTART;TZID=Asia/Jakarta:${d8(call.start_date)}T${t6(call.start_time)}`, `DTEND;TZID=Asia/Jakarta:${d8(call.start_date)}T${t6(end)}`);
  } else {
    // A multi-day call is a period, not a daily meeting: block the whole range and put the hours in the notes.
    lines.push(`DTSTART;VALUE=DATE:${d8(call.start_date)}`, `DTEND;VALUE=DATE:${d8(nextDay(call.end_date))}`);
  }
  lines.push(`SUMMARY:${esc(call.title)}`);
  if (where) lines.push(`LOCATION:${esc(where)}`);
  lines.push(`DESCRIPTION:${esc(`Kegiatan relawan lewat Sigap.${timeNote ? `\n${timeNote}` : ""}\n${call.description.slice(0, 300)}`)}`, "END:VEVENT", "END:VCALENDAR");

  return new NextResponse(lines.map(fold).join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/calendar; charset=utf-8", "Content-Disposition": 'attachment; filename="kegiatan-sigap.ics"', "Cache-Control": "private, no-store" },
  });
}
