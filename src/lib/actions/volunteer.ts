"use server";

import { refresh, updateTag } from "next/cache";
import { createServerSupabase } from "../supabase/server";
import type { ActionResult } from "../types";
import { fail, ints, optInt, optStr, str, strs } from "./shared";

async function me() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  return { supabase, uid: data?.claims?.sub as string | undefined };
}

async function afterProfileChange(supabase: Awaited<ReturnType<typeof createServerSupabase>>) {
  const { data } = await supabase.rpc("refresh_volunteer");
  updateTag("calls");
  updateTag("profiles");
  refresh();
  return data as { level: number; matches: number } | null;
}

export type ProfileResult = ActionResult & { level?: number; matches?: number };

export async function saveVolunteerStep(step: 1 | 2 | 3 | 4, fd: FormData): Promise<ProfileResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };

  if (step === 1) {
    const birth = str(fd, "birth_date");
    const gender = str(fd, "gender");
    const cityId = optInt(fd, "city_id");
    if (str(fd, "full_name").length < 2) return { error: "Isi nama lengkap." };
    if (str(fd, "nickname").length < 2) return { error: "Isi nama panggilan." };
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return { error: "Isi tanggal lahir." };
    if (gender !== "L" && gender !== "P") return { error: "Pilih jenis kelamin." };
    if (!cityId) return { error: "Pilih kota domisili." };
    const [a, b] = await Promise.all([
      supabase
        .from("volunteer_private")
        .update({ full_name: str(fd, "full_name", 120), birth_date: birth, gender })
        .eq("id", uid),
      supabase
        .from("volunteers")
        .update({ nickname: str(fd, "nickname", 40), city_id: cityId, bio: optStr(fd, "bio", 300), avatar_url: optStr(fd, "avatar_url", 500) })
        .eq("id", uid),
    ]);
    if (a.error) return a.error.code === "23514" ? { error: "Usia minimal relawan 17 tahun." } : fail(a.error);
    if (b.error) return fail(b.error);
  }

  if (step === 2) {
    const skillIds = ints(fd, "skills").slice(0, 15);
    const expert = new Set(ints(fd, "expert"));
    const strengths = strs(fd, "strengths").map((s) => s.slice(0, 80)).slice(0, 5);
    const limitations = ints(fd, "limitations");
    if (skillIds.length < 3) return { error: "Pilih minimal 3 skill." };
    await supabase.from("volunteer_skills").delete().eq("volunteer_id", uid);
    const s = await supabase.from("volunteer_skills").insert(skillIds.map((id) => ({ volunteer_id: uid, skill_id: id, level: expert.has(id) ? 2 : 1 })));
    if (s.error) return fail(s.error);
    await supabase.from("volunteer_limitations").delete().eq("volunteer_id", uid);
    if (limitations.length) {
      const l = await supabase.from("volunteer_limitations").insert(limitations.map((id) => ({ volunteer_id: uid, limitation_id: id })));
      if (l.error) return fail(l.error);
    }
    const [v, p] = await Promise.all([
      supabase.from("volunteers").update({ strengths }).eq("id", uid),
      supabase.from("volunteer_private").update({ limitation_note: optStr(fd, "limitation_note", 500) }).eq("id", uid),
    ]);
    if (v.error) return fail(v.error);
    if (p.error) return fail(p.error);
  }

  if (step === 3) {
    const interests = ints(fd, "interests");
    const loads = strs(fd, "loads").filter((l) => ["ringan", "promosi", "sedang", "berat", "darurat"].includes(l));
    const slots = strs(fd, "availability")
      .map((s) => s.split(":"))
      .filter(([d, sl]) => /^[1-7]$/.test(d) && ["pagi", "siang", "malam"].includes(sl));
    const mode = str(fd, "mode");
    if (!interests.length) return { error: "Pilih minimal 1 bidang minat." };
    if (!loads.length) return { error: "Pilih tingkat beban yang kamu sanggupi." };
    if (!slots.length) return { error: "Tandai minimal 1 waktu luang." };
    if (!["onsite", "online", "keduanya"].includes(mode)) return { error: "Pilih cara kerja." };
    await Promise.all([
      supabase.from("volunteer_interests").delete().eq("volunteer_id", uid),
      supabase.from("volunteer_loads").delete().eq("volunteer_id", uid),
      supabase.from("volunteer_availability").delete().eq("volunteer_id", uid),
    ]);
    const results = await Promise.all([
      supabase.from("volunteer_interests").insert(interests.map((id) => ({ volunteer_id: uid, category_id: id }))),
      supabase.from("volunteer_loads").insert(loads.map((load) => ({ volunteer_id: uid, load }))),
      supabase.from("volunteer_availability").insert(slots.map(([d, sl]) => ({ volunteer_id: uid, weekday: Number(d), slot: sl }))),
      supabase
        .from("volunteers")
        .update({
          mode,
          willing_travel: fd.get("willing_travel") === "on",
          max_radius_km: optInt(fd, "max_radius_km"),
          emergency_standby: fd.get("emergency_standby") === "on",
        })
        .eq("id", uid),
    ]);
    const err = results.find((r) => r.error)?.error;
    if (err) return fail(err);
  }

  if (step === 4) {
    const titles = strs(fd, "exp_title");
    const organizers = fd.getAll("exp_org").map(String);
    const years = fd.getAll("exp_year").map(String);
    const roles = fd.getAll("exp_role").map(String);
    await supabase.from("volunteer_experiences").delete().eq("volunteer_id", uid);
    const exps = titles.slice(0, 10).map((title, i) => ({
      volunteer_id: uid,
      title: title.slice(0, 120),
      organizer: organizers[i]?.trim().slice(0, 120) || null,
      year: /^\d{4}$/.test(years[i] ?? "") ? Number(years[i]) : null,
      role: roles[i]?.trim().slice(0, 80) || null,
    }));
    if (exps.length) {
      const e = await supabase.from("volunteer_experiences").insert(exps);
      if (e.error) return fail(e.error);
    }
    await supabase.from("volunteer_socials").delete().eq("volunteer_id", uid);
    const socials = (["tiktok", "instagram", "youtube"] as const)
      .map((platform) => ({
        volunteer_id: uid,
        platform,
        handle: str(fd, `${platform}_handle`, 60).replace(/^@/, ""),
        followers: Math.max(0, optInt(fd, `${platform}_followers`) ?? 0),
      }))
      .filter((s) => s.handle);
    if (socials.length) {
      const s = await supabase.from("volunteer_socials").insert(socials);
      if (s.error) return fail(s.error);
    }
    const cv = optStr(fd, "cv_path", 300);
    if (cv && !cv.startsWith(`${uid}/cv/`)) return { error: "Berkas CV tidak valid." };
    const c = await supabase.from("volunteer_private").update({ cv_path: cv }).eq("id", uid);
    if (c.error) return fail(c.error);
  }

  const res = await afterProfileChange(supabase);
  return { ok: true, level: res?.level, matches: res?.matches };
}

export async function saveEmergency(fd: FormData): Promise<ProfileResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };
  const row = {
    volunteer_id: uid,
    contact_name: str(fd, "contact_name", 80),
    relation: str(fd, "relation", 40),
    contact_phone: str(fd, "contact_phone", 20),
    blood_type: optStr(fd, "blood_type", 10),
    health_notes: optStr(fd, "health_notes", 500),
  };
  if (!row.contact_name || !row.relation || !/^[0-9+\s-]{8,20}$/.test(row.contact_phone)) return { error: "Lengkapi nama, hubungan, dan nomor kontak darurat." };
  const { error } = await supabase.from("volunteer_emergency").upsert(row);
  if (error) return fail(error);
  const res = await afterProfileChange(supabase);
  return { ok: true, level: res?.level };
}

export async function updateVolunteerSettings(fd: FormData): Promise<ActionResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };
  const pause = str(fd, "pause");
  const days = pause === "7" ? 7 : pause === "30" ? 30 : 0;
  const patch: Record<string, unknown> = { muted_categories: ints(fd, "muted"), emergency_standby: fd.get("emergency_standby") === "on" };
  if (pause !== "keep") patch.paused_until = days ? new Date(Date.now() + days * 86400000).toISOString().slice(0, 10) : null;
  const { error } = await supabase.from("volunteers").update(patch).eq("id", uid);
  if (error) return fail(error);
  await afterProfileChange(supabase);
  return { ok: true };
}

export async function applyToCall(callId: string, message: string, answers: string[], cvPath: string | null): Promise<ActionResult & { appId?: string }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("apply_to_call", {
    p_call: callId,
    p_message: message.slice(0, 500),
    p_answers: answers.map((a) => a.slice(0, 1000)),
    p_cv_path: cvPath,
  });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true, appId: data as string };
}

export async function toggleSaved(callId: string, save: boolean): Promise<ActionResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Masuk dulu untuk menyimpan." };
  const { error } = save
    ? await supabase.from("saved_calls").upsert({ volunteer_id: uid, call_id: callId })
    : await supabase.from("saved_calls").delete().eq("volunteer_id", uid).eq("call_id", callId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function dismissMatch(callId: string): Promise<ActionResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Masuk dulu." };
  const { error } = await supabase.from("matches").update({ dismissed: true }).eq("volunteer_id", uid).eq("call_id", callId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function respondInvite(appId: string, accept: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("respond_invite", { p_app: appId, p_accept: accept });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true };
}
