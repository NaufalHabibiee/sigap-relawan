import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import type { ActionResult } from "../types";

/** Exceptions raised in our SQL functions carry user-facing Indonesian messages (SQLSTATE P0001). */
export function fail(error: PostgrestError | null | undefined, fallback = "Terjadi kesalahan. Coba lagi."): ActionResult {
  if (!error) return { error: fallback };
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "42501") return { error: "Kamu tidak punya akses untuk tindakan ini." };
  if (error.code === "23505") return { error: "Data ini sudah ada." };
  if (error.code === "23514") return { error: "Ada isian yang tidak sesuai ketentuan." };
  console.error(error);
  return { error: fallback };
}

export function str(fd: FormData, key: string, max = 2000): string {
  return String(fd.get(key) ?? "").trim().slice(0, max);
}

export function optStr(fd: FormData, key: string, max = 2000): string | null {
  const v = str(fd, key, max);
  return v === "" ? null : v;
}

export function optInt(fd: FormData, key: string): number | null {
  const v = str(fd, key);
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

export function ints(fd: FormData, key: string): number[] {
  return fd
    .getAll(key)
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n));
}

export function strs(fd: FormData, key: string): string[] {
  return fd
    .getAll(key)
    .map((v) => String(v).trim())
    .filter(Boolean);
}
