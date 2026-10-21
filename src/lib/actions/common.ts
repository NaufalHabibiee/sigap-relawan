"use server";

import { refresh, updateTag } from "next/cache";
import { createServerSupabase } from "../supabase/server";
import type { ActionResult } from "../types";
import { fail } from "./shared";

export async function cancelApplication(appId: string, reason: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("cancel_application", { p_app: appId, p_reason: reason.trim().slice(0, 300) });
  if (error) return fail(error);
  updateTag("calls");
  refresh();
  return { ok: true };
}

export async function submitReview(appId: string, rating: number, aspects: Record<string, number>, body: string): Promise<ActionResult> {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: "Pilih bintang 1–5." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("submit_review", {
    p_app: appId,
    p_rating: rating,
    p_aspects: aspects,
    p_body: body.trim().slice(0, 1000),
  });
  if (error) return fail(error);
  updateTag("reviews");
  refresh();
  return { ok: true };
}

export async function replyReview(reviewId: string, reply: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("reply_review", { p_review: reviewId, p_reply: reply.trim().slice(0, 1000) });
  if (error) return fail(error);
  updateTag("reviews");
  refresh();
  return { ok: true };
}

export async function fileReport(targetType: "user" | "call" | "review" | "message", targetId: string, reason: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Masuk dulu untuk melapor." };
  const text = reason.trim().slice(0, 1000);
  if (text.length < 5) return { error: "Jelaskan alasan laporan (minimal 5 karakter)." };
  const { error } = await supabase.from("reports").insert({ reporter_id: data.claims.sub, target_type: targetType, target_id: targetId, reason: text });
  if (error) return fail(error);
  return { ok: true };
}

export async function toggleBlock(userId: string, block: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Masuk dulu." };
  const { error } = block
    ? await supabase.from("user_blocks").insert({ blocker_id: data.claims.sub, blocked_id: userId })
    : await supabase.from("user_blocks").delete().eq("blocker_id", data.claims.sub).eq("blocked_id", userId);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { error: "Masuk dulu." };
  const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", data.claims.sub).is("read_at", null);
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function markNotificationRead(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id).is("read_at", null);
}

export async function requestOtp(phone: string): Promise<ActionResult & { demoCode?: string | null }> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("request_phone_otp", { p_phone: phone });
  if (error) return fail(error);
  return { ok: true, demoCode: data as string | null };
}

export async function verifyOtp(code: string): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.rpc("verify_phone_otp", { p_code: code.trim() });
  if (error) return fail(error);
  if (!data) return { error: "Kode salah. Periksa lagi." };
  updateTag("calls");
  refresh();
  return { ok: true };
}

export async function submitVerification(files: string[], nikLast4: string, note: string): Promise<ActionResult> {
  if (nikLast4 && !/^\d{4}$/.test(nikLast4)) return { error: "Isi 4 digit terakhir NIK." };
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("submit_verification", { p_files: files, p_nik_last4: nikLast4, p_note: note.slice(0, 500) });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}

export async function markThreadRead(appId: string): Promise<void> {
  const supabase = await createServerSupabase();
  await supabase.rpc("mark_thread_read", { p_app: appId });
}

export async function setEmailNotifications(on: boolean): Promise<ActionResult> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("set_email_notifications", { p_on: on });
  if (error) return fail(error);
  refresh();
  return { ok: true };
}
