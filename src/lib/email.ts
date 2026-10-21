import "server-only";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const FROM = process.env.EMAIL_FROM ?? "Sigap <onboarding@resend.dev>";

/** True when an email provider key is present. Without it nothing is sent and the queue is left untouched. */
export const emailConfigured = Boolean(process.env.RESEND_API_KEY);

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function renderNotificationEmail({ title, body, link }: { title: string; body: string | null; link: string | null }) {
  const href = link ? (link.startsWith("http") ? link : `${SITE}${link}`) : `${SITE}/notifikasi`;
  const html = `<!doctype html><html lang="id"><body style="margin:0;background:#eeece5;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#1b2430">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#f8f7f3;border:1px solid #d8d2c4;border-radius:20px;padding:32px">
<tr><td style="font-size:22px;font-weight:800;letter-spacing:-0.5px">sigap</td></tr>
<tr><td style="padding-top:24px;font-size:20px;font-weight:700;line-height:1.3">${esc(title)}</td></tr>
${body ? `<tr><td style="padding-top:10px;font-size:15px;line-height:1.55;color:#46505d">${esc(body)}</td></tr>` : ""}
<tr><td style="padding-top:28px"><a href="${esc(href)}" style="display:inline-block;background:#c4501e;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:999px">Buka di Sigap</a></td></tr>
<tr><td style="padding-top:28px;font-size:12px;color:#6f7680">Kamu menerima email ini karena notifikasi email aktif di akun Sigap-mu. Matikan kapan saja lewat Pengaturan.</td></tr>
</table></td></tr></table></body></html>`;
  const text = `${title}\n\n${body ?? ""}\n\nBuka: ${href}\n`;
  return { html, text };
}

export async function sendEmail(to: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, error: "RESEND_API_KEY belum diisi" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: [to], subject, html, text }),
    });
    if (!res.ok) return { ok: false, error: `Resend ${res.status}` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
