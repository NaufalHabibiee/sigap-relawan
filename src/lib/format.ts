const TZ = "Asia/Jakarta";

export function initials(name: string | null | undefined): string {
  const words = (name ?? "").split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
  return (
    words
      .slice(0, 2)
      .map((w) => w.replace(/[^a-z0-9]/gi, "")[0] ?? "")
      .join("")
      .toUpperCase() || "?"
  );
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("id-ID").format(n);
}

export function formatRupiah(n: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

export function formatRating(r: number | null | undefined): string {
  return r == null ? "–" : Number(r).toFixed(1).replace(".", ",");
}

/** Date-only strings ("2026-10-12") are calendar dates, so they're parsed at noon to avoid TZ shifts. */
function toDate(value: string): Date {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00+07:00`) : new Date(value);
}

export function formatDate(value: string, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }): string {
  return new Intl.DateTimeFormat("id-ID", { ...opts, timeZone: TZ }).format(toDate(value));
}

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start, { weekday: "short", day: "numeric", month: "short" });
  const s = toDate(start);
  const e = toDate(end);
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  return sameMonth
    ? `${formatDate(start, { day: "numeric" })}–${formatDate(end, { day: "numeric", month: "short" })}`
    : `${formatDate(start, { day: "numeric", month: "short" })} – ${formatDate(end, { day: "numeric", month: "short" })}`;
}

export function formatTime(t: string | null | undefined): string | null {
  return t ? t.slice(0, 5).replace(":", ".") : null;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(value));
}

export function timeAgo(value: string, now: number = Date.now()): string {
  const diff = Math.max(0, now - new Date(value).getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return "baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} hari lalu`;
  return formatDate(value);
}

export function daysUntil(date: string, now: number = Date.now()): number {
  return Math.ceil((toDate(date).getTime() - now) / 86400000);
}

export function ageFrom(birth: string | null | undefined): number | null {
  if (!birth) return null;
  const b = toDate(birth);
  const n = new Date();
  let age = n.getFullYear() - b.getFullYear();
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--;
  return age;
}

export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

export function whatsappLink(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  return d.startsWith("628") ? `https://wa.me/${d}` : null;
}

export function todayJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

export function timeLeft(value: string, now: number = Date.now()): string {
  const diff = new Date(value).getTime() - now;
  if (diff <= 0) return "kedaluwarsa";
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))} menit lagi`;
  if (h < 48) return `${h} jam lagi`;
  return `${Math.floor(h / 24)} hari lagi`;
}

export function isoDaysAgo(days: number): string {
  const d = new Date(Date.now() - days * 86400000);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function dateYearsAgo(years: number): string {
  return new Date(Date.now() - years * 365.25 * 86400000).toISOString().slice(0, 10);
}

export function isPast(iso: string, plusDays = 0): boolean {
  return new Date(iso).getTime() + plusDays * 86400000 < Date.now();
}
