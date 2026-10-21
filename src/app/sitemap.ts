import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = createPublicClient();
  const [calls, seekers] = await Promise.all([
    db.from("calls").select("slug, published_at").in("status", ["aktif", "penuh"]).order("published_at", { ascending: false }).limit(1000),
    db.from("seekers").select("slug, created_at").eq("verified", true).limit(1000),
  ]);
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/panggilan`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE}/tentang`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/bantuan`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE}/syarat`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE}/kebijakan-privasi`, changeFrequency: "yearly", priority: 0.2 },
    ...(calls.data ?? []).map((c) => ({
      url: `${SITE}/panggilan/${c.slug}`,
      lastModified: c.published_at ? new Date(c.published_at) : now,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...(seekers.data ?? []).map((s) => ({
      url: `${SITE}/penyelenggara/${s.slug}`,
      lastModified: new Date(s.created_at),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
