import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { flushEmailQueue } from "@/lib/email-queue";
import { SUPABASE_URL } from "@/lib/supabase/env";

/**
 * Called by a scheduler (Vercel Cron, GitHub Actions, cron-job.org) every few minutes:
 *   GET /api/cron/email   with   Authorization: Bearer $CRON_SECRET
 * Needs SUPABASE_SERVICE_ROLE_KEY and RESEND_API_KEY on the server.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret || !serviceKey) return NextResponse.json({ error: "CRON_SECRET atau SUPABASE_SERVICE_ROLE_KEY belum diisi" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = createClient(SUPABASE_URL, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const result = await flushEmailQueue(db, 100);
  return NextResponse.json(result);
}
