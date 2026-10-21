import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "./supabase/public";
import type { CallCard, CallDetail, Load, MasterData, Review, Stats, WorkMode } from "./types";
import { todayJakarta } from "./format";

export const CARD_SELECT =
  "id, slug, title, load, mode, status, is_emergency, start_date, end_date, start_time, deadline, quota, benefits, published_at, category:categories(name, slug), city:cities(name, province), seeker:seekers(id, slug, org_name, logo_url, verified, type)";

export async function getMasterData(): Promise<MasterData> {
  "use cache";
  cacheLife("hours");
  cacheTag("master");
  const db = createPublicClient();
  const [cities, categories, skills, limitations] = await Promise.all([
    db.from("cities").select("id, name, province").order("province").order("name"),
    db.from("categories").select("id, slug, name").order("sort"),
    db.from("skills").select("id, slug, name, category_id").order("name"),
    db.from("limitations").select("id, slug, name, task_label").order("id"),
  ]);
  return {
    cities: cities.data ?? [],
    categories: categories.data ?? [],
    skills: skills.data ?? [],
    limitations: limitations.data ?? [],
  };
}

export type CallFilters = {
  q?: string;
  category?: string;
  load?: Load;
  province?: string;
  mode?: WorkMode;
  emergency?: boolean;
  sort?: "terbaru" | "deadline" | "mulai";
  page?: number;
};

const PAGE_SIZE = 12;
type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function parseCallFilters(p: Params): CallFilters {
  const load = first(p.beban);
  const mode = first(p.mode);
  const sort = first(p.urut);
  const page = Number(first(p.hal) ?? "1");
  return {
    q: first(p.q)?.slice(0, 80),
    category: first(p.kategori)?.slice(0, 40),
    load: ["ringan", "promosi", "sedang", "berat", "darurat"].includes(load ?? "") ? (load as Load) : undefined,
    province: first(p.provinsi)?.slice(0, 60),
    mode: ["onsite", "online", "hybrid"].includes(mode ?? "") ? (mode as WorkMode) : undefined,
    emergency: first(p.darurat) === "1" || undefined,
    sort: sort === "deadline" || sort === "mulai" ? sort : "terbaru",
    page: Number.isInteger(page) && page > 0 && page < 500 ? page : 1,
  };
}

function sanitize(q: string) {
  return q.replace(/[%_,.()*\\:"']/g, " ").replace(/\s+/g, " ").trim();
}

export async function searchCalls(f: CallFilters): Promise<{ items: CallCard[]; total: number; pageSize: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const db = createPublicClient();
  const today = todayJakarta();
  let query = db
    .from("calls")
    .select(f.category || f.province ? CARD_SELECT.replace("categories(", "categories!inner(").replace("cities(", f.province ? "cities!inner(" : "cities(") : CARD_SELECT, {
      count: "exact",
    })
    .in("status", ["aktif", "penuh"])
    .gte("end_date", today);
  if (f.q) {
    const q = sanitize(f.q);
    if (q) query = query.ilike("title", `%${q}%`);
  }
  if (f.category) query = query.eq("category.slug", f.category);
  if (f.province) query = query.eq("city.province", f.province);
  if (f.load) query = query.eq("load", f.load);
  if (f.mode) query = query.eq("mode", f.mode);
  if (f.emergency) query = query.eq("is_emergency", true);
  query = query.order("is_emergency", { ascending: false });
  if (f.sort === "deadline") query = query.order("deadline", { ascending: true });
  else if (f.sort === "mulai") query = query.order("start_date", { ascending: true });
  else query = query.order("published_at", { ascending: false });
  const from = ((f.page ?? 1) - 1) * PAGE_SIZE;
  const { data, count } = await query.range(from, from + PAGE_SIZE - 1);
  return { items: (data ?? []) as unknown as CallCard[], total: count ?? 0, pageSize: PAGE_SIZE };
}

export async function getFeed(): Promise<CallCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const { data } = await createPublicClient()
    .from("calls")
    .select(CARD_SELECT)
    .eq("status", "aktif")
    .gte("deadline", todayJakarta())
    .order("published_at", { ascending: false })
    .limit(14);
  return (data ?? []) as unknown as CallCard[];
}

export async function getEmergencyCalls(): Promise<CallCard[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const { data } = await createPublicClient()
    .from("calls")
    .select(CARD_SELECT)
    .eq("status", "aktif")
    .eq("is_emergency", true)
    .gte("deadline", todayJakarta())
    .order("published_at", { ascending: false })
    .limit(6);
  return (data ?? []) as unknown as CallCard[];
}

export async function getPlatformStats(): Promise<{ volunteers: number; active_calls: number; completed: number; cities: number }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const { data } = await createPublicClient().rpc("platform_stats");
  return data ?? { volunteers: 0, active_calls: 0, completed: 0, cities: 0 };
}

export async function getCategoryCounts(): Promise<Record<string, number>> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const { data } = await createPublicClient()
    .from("calls")
    .select("category:categories(slug)")
    .eq("status", "aktif")
    .gte("deadline", todayJakarta());
  const counts: Record<string, number> = {};
  for (const row of (data ?? []) as unknown as { category: { slug: string } | null }[]) {
    if (row.category) counts[row.category.slug] = (counts[row.category.slug] ?? 0) + 1;
  }
  return counts;
}

export async function getAnnouncements(): Promise<{ id: string; title: string; body: string | null; link: string | null; is_disaster: boolean }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("announcements");
  const { data } = await createPublicClient()
    .from("announcements")
    .select("id, title, body, link, is_disaster")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function getCallBySlug(slug: string): Promise<CallDetail | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", `call:${slug}`);
  const db = createPublicClient();
  const { data } = await db
    .from("calls")
    .select(
      `${CARD_SELECT}, description, address, end_time, min_level, age_min, age_max, gender, gender_reason, min_followers, allowance, commission_pct, need_cv, questions, cover_url, category_id, city_id, seeker_id, cancel_reason, skills:call_skills(required, skill:skills(id, name)), involves:call_involves(limitation:limitations(id, task_label))`,
    )
    .eq("slug", slug)
    .neq("status", "draf")
    .maybeSingle();
  if (!data) return null;
  const { data: counts } = await db.rpc("call_accepted_counts", { p_calls: [data.id] });
  return { ...(data as unknown as CallDetail), accepted_count: counts?.[0]?.accepted ?? 0 };
}

export async function getAcceptedCounts(ids: string[]): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await createPublicClient().rpc("call_accepted_counts", { p_calls: ids });
  return Object.fromEntries(((data ?? []) as { call_id: string; accepted: number }[]).map((r) => [r.call_id, r.accepted]));
}

export async function getStats(userId: string): Promise<Stats> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews", `stats:${userId}`);
  const { data } = await createPublicClient().rpc("user_stats", { p_user: userId });
  const row = (data as Stats[] | null)?.[0];
  return row ?? { rating_avg: null, rating_count: 0, completed: 0, no_show: 0 };
}

/** Visible reviews about a user, with the reviewer's public display name. */
export async function getReviewsFor(userId: string): Promise<Review[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("reviews", `stats:${userId}`);
  const { data } = await createPublicClient().rpc("public_reviews", { p_user: userId });
  return (data ?? []) as Review[];
}

export type HeroPeople = {
  volunteers: { nickname: string | null; avatar_url: string | null }[];
  seekers: { org_name: string; logo_url: string | null; slug: string }[];
  verifiedSeekers: number;
};

export async function getHeroPeople(): Promise<HeroPeople> {
  "use cache";
  cacheLife("hours");
  cacheTag("profiles");
  const db = createPublicClient();
  const [v, s, count] = await Promise.all([
    db.from("volunteers").select("nickname, avatar_url").gte("verification_level", 1).not("avatar_url", "is", null).order("last_active_at", { ascending: false }).limit(5),
    db.from("seekers").select("org_name, logo_url, slug").eq("verified", true).order("created_at").limit(5),
    db.from("seekers").select("id", { count: "exact", head: true }).eq("verified", true),
  ]);
  return { volunteers: v.data ?? [], seekers: s.data ?? [], verifiedSeekers: count.count ?? 0 };
}
