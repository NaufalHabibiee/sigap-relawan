import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { emailConfigured, renderNotificationEmail, sendEmail } from "./email";

type QueueRow = { id: string; email: string; title: string; body: string | null; link: string | null; type: string };
export type FlushResult = { configured: boolean; pending: number; sent: number; skipped: number; failed: number; error?: string };

/** Demo accounts live on a fake domain; mailing them would only bounce and hurt sender reputation. */
const isDemoAddress = (email: string) => email.toLowerCase().endsWith("@contoh.id");

/**
 * Sends the next batch of unsent notifications. `db` must be an admin session or the service-role client,
 * because `email_queue` and `email_mark_sent` reject everyone else.
 */
export async function flushEmailQueue(db: SupabaseClient, limit = 50): Promise<FlushResult> {
  const { data, error } = await db.rpc("email_queue", { p_limit: limit });
  if (error) return { configured: emailConfigured, pending: 0, sent: 0, skipped: 0, failed: 0, error: error.message };
  const rows = (data ?? []) as QueueRow[];
  if (!emailConfigured) return { configured: false, pending: rows.length, sent: 0, skipped: 0, failed: 0 };

  const done: string[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const r of rows) {
    if (isDemoAddress(r.email)) {
      done.push(r.id);
      skipped++;
      continue;
    }
    const { html, text } = renderNotificationEmail(r);
    const res = await sendEmail(r.email, r.title, html, text);
    if (res.ok) {
      done.push(r.id);
      sent++;
    } else {
      failed++;
    }
  }
  if (done.length) await db.rpc("email_mark_sent", { p_ids: done });
  return { configured: true, pending: rows.length - done.length, sent, skipped, failed };
}
