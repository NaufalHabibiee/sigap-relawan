import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { CARD_SELECT } from "./data";
import { createPublicClient } from "./supabase/public";
import type { CallCard, SeekerType } from "./types";

export type PublicVolunteer = {
  id: string;
  slug: string;
  nickname: string | null;
  avatar_url: string | null;
  bio: string | null;
  strengths: string[];
  verification_level: number;
  emergency_standby: boolean;
  created_at: string;
  city: { name: string; province: string } | null;
  skills: { level: number; skill: { name: string } | null }[];
  interests: { category: { name: string } | null }[];
  experiences: { title: string; organizer: string | null; year: number | null; role: string | null }[];
};

export async function getPublicVolunteer(slug: string): Promise<PublicVolunteer | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("profiles", `volunteer:${slug}`);
  const { data } = await createPublicClient()
    .from("volunteers")
    .select(
      "id, slug, nickname, avatar_url, bio, strengths, verification_level, emergency_standby, created_at, city:cities(name, province), skills:volunteer_skills(level, skill:skills(name)), interests:volunteer_interests(category:categories(name)), experiences:volunteer_experiences(title, organizer, year, role)",
    )
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as PublicVolunteer) ?? null;
}

export type PublicSeeker = {
  id: string;
  slug: string;
  org_name: string;
  type: SeekerType;
  logo_url: string | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  verified: boolean;
  created_at: string;
  city: { name: string; province: string } | null;
};

export async function getPublicSeeker(slug: string): Promise<{ seeker: PublicSeeker; calls: CallCard[] } | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("profiles", "calls", `seeker:${slug}`);
  const db = createPublicClient();
  const { data } = await db
    .from("seekers")
    .select("id, slug, org_name, type, logo_url, description, website, instagram, verified, created_at, city:cities(name, province)")
    .eq("slug", slug)
    .maybeSingle();
  if (!data) return null;
  const { data: calls } = await db
    .from("calls")
    .select(CARD_SELECT)
    .eq("seeker_id", data.id)
    .neq("status", "draf")
    .order("start_date", { ascending: false })
    .limit(20);
  return { seeker: data as unknown as PublicSeeker, calls: (calls ?? []) as unknown as CallCard[] };
}
