import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import type { Role } from "./types";

export type Viewer = {
  id: string;
  email: string | null;
  role: Role;
  roleConfirmed: boolean;
  phone: string | null;
  phoneVerified: boolean;
  name: string;
  avatar: string | null;
  slug: string | null;
  level: number;
  verified: boolean;
};

/**
 * Current signed-in user with role-specific display data, or null. Must run inside <Suspense>.
 * Wrapped in `cache` so the header, layout and page share one lookup per request instead of repeating it.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createServerSupabase();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  // All three rows are keyed by the same id, so fetch them together and keep only the one the role needs.
  const [{ data: profile }, { data: v }, { data: s }] = await Promise.all([
    supabase.from("profiles").select("role, role_confirmed, phone, phone_verified, banned_at").eq("id", uid).maybeSingle(),
    supabase.from("volunteers").select("nickname, avatar_url, slug, verification_level").eq("id", uid).maybeSingle(),
    supabase.from("seekers").select("org_name, logo_url, slug, verified").eq("id", uid).maybeSingle(),
  ]);
  if (!profile || profile.banned_at) return null;
  const base = {
    id: uid,
    email: (claims?.claims?.email as string | undefined) ?? null,
    role: profile.role as Role,
    roleConfirmed: profile.role_confirmed,
    phone: profile.phone,
    phoneVerified: profile.phone_verified,
  };
  if (profile.role === "volunteer") {
    return { ...base, name: v?.nickname ?? "Relawan", avatar: v?.avatar_url ?? null, slug: v?.slug ?? null, level: v?.verification_level ?? 0, verified: (v?.verification_level ?? 0) >= 2 };
  }
  if (profile.role === "seeker") {
    return { ...base, name: s?.org_name ?? "Penyelenggara", avatar: s?.logo_url ?? null, slug: s?.slug ?? null, level: 0, verified: s?.verified ?? false };
  }
  return { ...base, name: "Admin", avatar: null, slug: null, level: 0, verified: true };
});

export function homeFor(role: Role): string {
  return role === "volunteer" ? "/r" : role === "seeker" ? "/p" : "/admin";
}

export async function requireViewer(role?: Role): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/masuk");
  if (!viewer.roleConfirmed) redirect("/mulai");
  if (role && viewer.role !== role) redirect(homeFor(viewer.role));
  return viewer;
}
