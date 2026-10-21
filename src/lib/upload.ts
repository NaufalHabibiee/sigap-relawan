"use client";

import { createBrowserSupabase } from "./supabase/browser";

const MAX = 5 * 1024 * 1024;

function ext(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  return file.type === "application/pdf" ? "pdf" : file.type.split("/")[1] ?? "bin";
}

/** Uploads to `<bucket>/<folder>/<random>.<ext>` and returns the storage path. */
export async function uploadFile(bucket: "public-media" | "private-docs", folder: string, file: File, accept: string[]): Promise<string> {
  if (file.size > MAX) throw new Error("Ukuran berkas maksimal 5 MB.");
  if (!accept.includes(file.type)) throw new Error("Format berkas tidak didukung.");
  const path = `${folder}/${crypto.randomUUID()}.${ext(file)}`;
  const { error } = await createBrowserSupabase().storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("Gagal mengunggah berkas. Coba lagi.");
  return path;
}

export function publicUrl(path: string): string {
  return createBrowserSupabase().storage.from("public-media").getPublicUrl(path).data.publicUrl;
}

export async function openPrivateFile(path: string) {
  const { data, error } = await createBrowserSupabase().storage.from("private-docs").createSignedUrl(path, 120);
  if (error || !data) throw new Error("Berkas tidak bisa dibuka.");
  window.open(data.signedUrl, "_blank", "noopener");
}

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DOC_TYPES = ["application/pdf", ...IMAGE_TYPES];
