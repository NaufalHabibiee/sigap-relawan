import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

/** Marks one notification read, then follows its link. */
export async function GET(request: NextRequest, ctx: RouteContext<"/notifikasi/buka/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .select("link")
    .maybeSingle();
  const link = data?.link && data.link.startsWith("/") && !data.link.startsWith("//") ? data.link : "/notifikasi";
  return NextResponse.redirect(new URL(link, request.nextUrl.origin));
}
