"use server";

import { refresh, updateTag } from "next/cache";
import { createServerSupabase } from "../supabase/server";
import type { ActionResult } from "../types";
import { flushEmailQueue, type FlushResult } from "../email-queue";
import { fail } from "./shared";

export async function reviewVerification(id: string, approve: boolean, reason: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data: files, error } = await supabase.rpc("admin_review_verification", { p_id: id, p_approve: approve, p_reason: reason.trim() });
  if (error) return fail(error);
  // Identity documents are removed as soon as a decision is made; only the last 4 NIK digits are kept.
  const paths = (files as string[] | null) ?? [];
  if (paths.length) await supabase.storage.from("private-docs").remove(paths);
  updateTag("calls");
  updateTag("profiles");
  refresh();
  return { ok: true };
}

export async function takedownCall(callId: string, reason: string): Promise<ActionResult> {
  if (reason.trim().length < 5) return { error: "Tulis alasan penurunan." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("admin_moderate_call", { p_call: callId, p_reason: reason.trim() });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true };
}

export async function setBanned(userId: string, banned: boolean, reason: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("admin_set_banned", { p_user: userId, p_banned: banned, p_reason: reason });
  if (error) return fail(error);
  updateTag("calls");
  updateTag("profiles");
  refresh();
  return { ok: true };
}

export async function resolveReport(id: string, status: "resolved" | "dismissed", note: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("admin_resolve_report", { p_report: id, p_status: status, p_note: note });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

type MasterKind = "categories" | "skills" | "limitations" | "cities";

export async function addMaster(kind: MasterKind, fd: FormData): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const name = String(fd.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Isi nama." };
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let row: Record<string, unknown>;
  if (kind === "categories") row = { slug, name, sort: 50 };
  else if (kind === "skills") row = { slug, name, category_id: Number(fd.get("category_id")) || null };
  else if (kind === "limitations") row = { slug, name, task_label: String(fd.get("task_label") ?? "").trim() || name };
  else {
    const lat = Number(fd.get("lat"));
    const lng = Number(fd.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 15 || lng < 90 || lng > 145) return { error: "Koordinat tidak valid untuk Indonesia." };
    row = { name, province: String(fd.get("province") ?? "").trim(), lat, lng };
  }
  const { error } = await supabase.from(kind).insert(row);
  if (error) return fail(error);
  updateTag("master");
  refresh();
  return { ok: true };
}

export async function saveAnnouncement(fd: FormData): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const title = String(fd.get("title") ?? "").trim();
  if (title.length < 5) return { error: "Judul minimal 5 karakter." };
  const link = String(fd.get("link") ?? "").trim();
  const { error } = await supabase.from("announcements").insert({
    title,
    body: String(fd.get("body") ?? "").trim() || null,
    link: link.startsWith("/") ? link : null,
    is_disaster: fd.get("is_disaster") === "on",
  });
  if (error) return fail(error);
  updateTag("announcements");
  refresh();
  return { ok: true };
}

export async function toggleAnnouncement(id: string, active: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("announcements").update({ active }).eq("id", id);
  if (error) return fail(error);
  updateTag("announcements");
  refresh();
  return { ok: true };
}

export async function setDemoOtp(on: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("app_settings").upsert({ key: "demo_otp", value: on });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

/** Admin-triggered flush of the email queue; the same logic the cron endpoint runs. */
export async function sendPendingEmails(): Promise<ActionResult & { result?: FlushResult }> {
  const supabase = await createServerSupabase();
  const result = await flushEmailQueue(supabase, 100);
  if (result.error) return { error: result.error === "Tidak diizinkan" ? "Hanya admin yang bisa mengirim email." : "Gagal membaca antrean email." };
  refresh();
  return { ok: true, result };
}
