import "server-only";
import { createServerSupabase } from "./supabase/server";
import type { DaySlot, Gender, Load, VolMode } from "./types";

export type FullVolunteer = {
  id: string;
  slug: string;
  nickname: string | null;
  avatar_url: string | null;
  city_id: number | null;
  bio: string | null;
  strengths: string[];
  mode: VolMode;
  willing_travel: boolean;
  max_radius_km: number | null;
  emergency_standby: boolean;
  paused_until: string | null;
  muted_categories: number[];
  verification_level: number;
  full_name: string | null;
  birth_date: string | null;
  gender: Gender | null;
  limitation_note: string | null;
  cv_path: string | null;
  phone: string | null;
  phone_verified: boolean;
  skills: { skill_id: number; level: number }[];
  limitations: number[];
  interests: number[];
  loads: Load[];
  availability: { weekday: number; slot: DaySlot }[];
  socials: { platform: string; handle: string; followers: number }[];
  experiences: { title: string; organizer: string | null; year: number | null; role: string | null }[];
  emergency: { contact_name: string; relation: string; contact_phone: string; blood_type: string | null; health_notes: string | null } | null;
  verification: { status: string; reason: string | null; created_at: string } | null;
};

export async function getMyVolunteer(uid: string): Promise<FullVolunteer> {
  const db = await createServerSupabase();
  const [v, p, prof, sk, lim, intr, ld, av, so, ex, em, ver] = await Promise.all([
    db.from("volunteers").select("*").eq("id", uid).single(),
    db.from("volunteer_private").select("*").eq("id", uid).single(),
    db.from("profiles").select("phone, phone_verified").eq("id", uid).single(),
    db.from("volunteer_skills").select("skill_id, level").eq("volunteer_id", uid),
    db.from("volunteer_limitations").select("limitation_id").eq("volunteer_id", uid),
    db.from("volunteer_interests").select("category_id").eq("volunteer_id", uid),
    db.from("volunteer_loads").select("load").eq("volunteer_id", uid),
    db.from("volunteer_availability").select("weekday, slot").eq("volunteer_id", uid),
    db.from("volunteer_socials").select("platform, handle, followers").eq("volunteer_id", uid),
    db.from("volunteer_experiences").select("title, organizer, year, role").eq("volunteer_id", uid),
    db.from("volunteer_emergency").select("contact_name, relation, contact_phone, blood_type, health_notes").eq("volunteer_id", uid).maybeSingle(),
    db.from("verification_requests").select("status, reason, created_at").eq("user_id", uid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    ...v.data,
    full_name: p.data?.full_name ?? null,
    birth_date: p.data?.birth_date ?? null,
    gender: p.data?.gender ?? null,
    limitation_note: p.data?.limitation_note ?? null,
    cv_path: p.data?.cv_path ?? null,
    phone: prof.data?.phone ?? null,
    phone_verified: prof.data?.phone_verified ?? false,
    skills: sk.data ?? [],
    limitations: (lim.data ?? []).map((r) => r.limitation_id),
    interests: (intr.data ?? []).map((r) => r.category_id),
    loads: (ld.data ?? []).map((r) => r.load),
    availability: av.data ?? [],
    socials: so.data ?? [],
    experiences: ex.data ?? [],
    emergency: em.data ?? null,
    verification: ver.data ?? null,
  } as FullVolunteer;
}

/** Human-readable list of what still blocks Level 1, in the order the wizard asks for it. */
export function missingForLevel1(v: FullVolunteer): { label: string; step: number }[] {
  const out: { label: string; step: number }[] = [];
  if (!v.full_name || !v.birth_date || !v.gender || !v.city_id || !v.nickname) out.push({ label: "Data diri (nama, tanggal lahir, kota)", step: 1 });
  if (v.skills.length < 3) out.push({ label: "Minimal 3 skill", step: 2 });
  if (!v.interests.length || !v.loads.length) out.push({ label: "Bidang minat dan tingkat beban", step: 3 });
  if (!v.availability.length) out.push({ label: "Waktu luang", step: 3 });
  if (v.loads.includes("promosi") && !v.socials.length) out.push({ label: "Akun media sosial (karena memilih Promosi)", step: 4 });
  if (!v.phone_verified) out.push({ label: "Verifikasi nomor HP", step: 0 });
  return out;
}

export function completeness(v: FullVolunteer): number {
  const checks = [
    Boolean(v.full_name && v.birth_date && v.gender && v.city_id),
    Boolean(v.avatar_url),
    Boolean(v.bio),
    v.skills.length >= 3,
    v.strengths.length > 0,
    v.interests.length > 0 && v.loads.length > 0,
    v.availability.length > 0,
    v.experiences.length > 0,
    Boolean(v.cv_path),
    v.phone_verified,
    Boolean(v.emergency),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
