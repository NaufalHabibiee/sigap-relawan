"use server";

import { refresh, updateTag } from "next/cache";
import { createServerSupabase } from "../supabase/server";
import type { ActionResult, AppStatus } from "../types";
import { fail, ints, optInt, optStr, str, strs } from "./shared";

async function me() {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  return { supabase, uid: data?.claims?.sub as string | undefined };
}

export async function saveSeekerProfile(fd: FormData): Promise<ActionResult> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };
  const orgName = str(fd, "org_name", 120);
  if (orgName.length < 2) return { error: "Isi nama organisasi." };
  const type = str(fd, "type");
  if (!["perusahaan", "lembaga", "komunitas", "campaign", "individu"].includes(type)) return { error: "Pilih jenis penyelenggara." };
  const { error } = await supabase
    .from("seekers")
    .update({
      org_name: orgName,
      type,
      description: optStr(fd, "description", 2000),
      city_id: optInt(fd, "city_id"),
      website: optStr(fd, "website", 200),
      instagram: optStr(fd, "instagram", 60)?.replace(/^@/, "") ?? null,
      pic_name: optStr(fd, "pic_name", 80),
      pic_title: optStr(fd, "pic_title", 80),
      logo_url: optStr(fd, "logo_url", 500),
    })
    .eq("id", uid);
  if (error) return fail(error);
  updateTag("calls");
  updateTag("profiles");
  refresh();
  return { ok: true };
}

export async function saveCall(callId: string | null, fd: FormData): Promise<ActionResult & { id?: string }> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };
  const mode = str(fd, "mode");
  const load = str(fd, "load");
  const gender = str(fd, "gender");
  const questions = strs(fd, "questions").map((q) => q.slice(0, 200)).slice(0, 3);
  const row = {
    title: str(fd, "title", 120),
    category_id: optInt(fd, "category_id"),
    load,
    description: str(fd, "description", 5000),
    mode,
    city_id: mode === "online" ? null : optInt(fd, "city_id"),
    address: mode === "online" ? null : optStr(fd, "address", 300),
    start_date: str(fd, "start_date"),
    end_date: str(fd, "end_date") || str(fd, "start_date"),
    start_time: optStr(fd, "start_time"),
    end_time: optStr(fd, "end_time"),
    quota: optInt(fd, "quota"),
    deadline: str(fd, "deadline"),
    age_min: optInt(fd, "age_min"),
    age_max: optInt(fd, "age_max"),
    gender: gender === "L" || gender === "P" ? gender : null,
    gender_reason: optStr(fd, "gender_reason", 300),
    min_followers: load === "promosi" ? optInt(fd, "min_followers") : null,
    benefits: strs(fd, "benefits").slice(0, 10),
    allowance: optInt(fd, "allowance"),
    commission_pct: load === "promosi" ? optInt(fd, "commission_pct") : null,
    need_cv: fd.get("need_cv") === "on",
    questions,
    is_emergency: load === "darurat" && fd.get("is_emergency") === "on",
    cover_url: optStr(fd, "cover_url", 500),
  };
  if (row.title.length < 5) return { error: "Judul minimal 5 karakter." };
  if (!row.category_id) return { error: "Pilih kategori." };
  if (!["ringan", "promosi", "sedang", "berat", "darurat"].includes(load)) return { error: "Pilih tingkat beban." };
  if (row.description.length < 30) return { error: "Jelaskan tugas relawan (minimal 30 karakter)." };
  if (!["onsite", "online", "hybrid"].includes(mode)) return { error: "Pilih lokasi kerja." };
  if (mode !== "online" && !row.city_id) return { error: "Pilih kota lokasi kegiatan." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(row.start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(row.deadline)) return { error: "Isi tanggal mulai dan batas pendaftaran." };
  if (row.end_date < row.start_date) return { error: "Tanggal selesai tidak boleh sebelum tanggal mulai." };
  if (!row.quota || row.quota < 1) return { error: "Isi kebutuhan jumlah relawan." };

  let id = callId;
  if (id) {
    const { error } = await supabase.from("calls").update(row).eq("id", id).eq("seeker_id", uid);
    if (error) return fail(error);
  } else {
    const { data, error } = await supabase
      .from("calls")
      .insert({ ...row, seeker_id: uid })
      .select("id")
      .single();
    if (error) return fail(error);
    id = data.id as string;
  }

  const required = new Set(ints(fd, "required_skills"));
  const preferred = ints(fd, "preferred_skills").filter((s) => !required.has(s));
  await supabase.from("call_skills").delete().eq("call_id", id);
  const skills = [...[...required].map((s) => ({ call_id: id, skill_id: s, required: true })), ...preferred.map((s) => ({ call_id: id, skill_id: s, required: false }))];
  if (skills.length) {
    const r = await supabase.from("call_skills").insert(skills);
    if (r.error) return fail(r.error);
  }
  await supabase.from("call_involves").delete().eq("call_id", id);
  const involves = ints(fd, "involves");
  if (involves.length) {
    const r = await supabase.from("call_involves").insert(involves.map((l) => ({ call_id: id, limitation_id: l })));
    if (r.error) return fail(r.error);
  }

  const { data: current } = await supabase.from("calls").select("status").eq("id", id).single();
  if (current?.status === "aktif") await supabase.rpc("refresh_call_matches", { p_call: id });
  updateTag("calls");
  refresh();
  return { ok: true, id: id! };
}

export async function publishCall(callId: string): Promise<ActionResult & { matches?: number }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("publish_call", { p_call: callId });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true, matches: data as number };
}

export async function closeCall(callId: string, cancel: boolean, reason: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("close_call", { p_call: callId, p_cancel: cancel, p_reason: reason.trim().slice(0, 300) });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true };
}

export async function deleteDraft(callId: string): Promise<ActionResult> {
  const { supabase, uid } = await me();
  const { error } = await supabase.from("calls").delete().eq("id", callId).eq("seeker_id", uid!).eq("status", "draf");
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function refreshCallMatches(callId: string): Promise<ActionResult & { matches?: number }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("refresh_call_matches", { p_call: callId });
  if (error) return fail(error);
  refresh();
  return { ok: true, matches: data as number };
}

export async function inviteVolunteer(callId: string, volunteerId: string, message: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("invite_volunteer", { p_call: callId, p_volunteer: volunteerId, p_message: message.slice(0, 500) });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function decideApplication(appId: string, status: Extract<AppStatus, "reviewing" | "accepted" | "rejected">): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("decide_application", { p_app: appId, p_status: status });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true };
}

export async function markAttendance(appId: string, attended: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("mark_attendance", { p_app: appId, p_attended: attended });
  if (error) return fail(error);
  updateTag("calls");
  updateTag("reviews");
  refresh();
  return { ok: true };
}

export async function announce(callId: string, body: string): Promise<ActionResult & { count?: number }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("announce", { p_call: callId, p_body: body.slice(0, 2000) });
  if (error) return fail(error);
  refresh();
  return { ok: true, count: data as number };
}

const shiftDate = (d: string, days: number) => {
  const t = new Date(`${d}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + days);
  return t.toISOString().slice(0, 10);
};

/** Copies a call into a new draft two weeks out, keeping its duration, skills and involved tasks. */
export async function duplicateCall(callId: string): Promise<ActionResult & { id?: string }> {
  const { supabase, uid } = await me();
  if (!uid) return { error: "Sesi berakhir. Masuk lagi." };
  const { data: c, error } = await supabase.from("calls").select("*").eq("id", callId).eq("seeker_id", uid).single();
  if (error || !c) return fail(error, "Panggilan tidak ditemukan.");

  const today = new Date(Date.now() + 7 * 3600000).toISOString().slice(0, 10); // Jakarta date
  const start = shiftDate(today, 14);
  const span = Math.max(0, Math.round((Date.parse(c.end_date) - Date.parse(c.start_date)) / 86400000));
  const title = `${String(c.title).replace(/ \(salinan\)$/, "")} (salinan)`.slice(0, 120);
  const { data: created, error: insErr } = await supabase
    .from("calls")
    .insert({
      seeker_id: uid,
      title,
      category_id: c.category_id,
      load: c.load,
      description: c.description,
      cover_url: c.cover_url,
      mode: c.mode,
      city_id: c.city_id,
      address: c.address,
      start_date: start,
      end_date: shiftDate(start, span),
      start_time: c.start_time,
      end_time: c.end_time,
      quota: c.quota,
      deadline: shiftDate(start, -2),
      age_min: c.age_min,
      age_max: c.age_max,
      gender: c.gender,
      gender_reason: c.gender_reason,
      min_followers: c.min_followers,
      benefits: c.benefits,
      allowance: c.allowance,
      commission_pct: c.commission_pct,
      need_cv: c.need_cv,
      questions: c.questions,
      is_emergency: false,
    })
    .select("id")
    .single();
  if (insErr || !created) return fail(insErr);

  const [skills, involves] = await Promise.all([
    supabase.from("call_skills").select("skill_id, required").eq("call_id", callId),
    supabase.from("call_involves").select("limitation_id").eq("call_id", callId),
  ]);
  if (skills.data?.length) await supabase.from("call_skills").insert(skills.data.map((s) => ({ call_id: created.id, skill_id: s.skill_id, required: s.required })));
  if (involves.data?.length) await supabase.from("call_involves").insert(involves.data.map((l) => ({ call_id: created.id, limitation_id: l.limitation_id })));
  refresh();
  return { ok: true, id: created.id as string };
}
