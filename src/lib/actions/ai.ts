"use server";

import { headers } from "next/headers";
import { aiEnabled, askJson } from "../ai";
import { getViewer } from "../auth";
import { getOwnCall } from "../seeker-data";
import { createServerSupabase } from "../supabase/server";
import type { Load } from "../types";

export type CallDraft = {
  title: string;
  description: string;
  category_id: number | null;
  load: Load;
  quota: number;
  is_emergency: boolean;
  urgency: "rendah" | "sedang" | "tinggi" | "kritis";
  urgency_reason: string;
  risk_flags: string[];
  source: "ai" | "aturan";
};

const SCAM = [
  { re: /transfer|biaya pendaftaran|uang jaminan|deposit|bayar dulu|top ?up/i, msg: "Meminta relawan membayar atau mentransfer uang." },
  { re: /nomor rekening|\bpin\b|\botp\b|kode verifikasi|password|kata sandi|foto ktp.*(wa|whatsapp)/i, msg: "Meminta data sensitif di luar platform." },
  { re: /gaji (besar|tinggi|jutaan)|penghasilan pasti|kerja dari rumah dapat/i, msg: "Menjanjikan imbalan tidak wajar untuk kegiatan relawan." },
  { re: /(hubungi|chat|dm) (via|lewat|ke) (wa|whatsapp|telegram)|wa\.me|t\.me/i, msg: "Mengarahkan komunikasi keluar dari platform." },
];

function ruleFlags(text: string): string[] {
  return SCAM.filter((s) => s.re.test(text)).map((s) => s.msg);
}

const LOAD_VALUES: Load[] = ["ringan", "promosi", "sedang", "berat", "darurat"];

const EMERGENCY = /banjir|gempa|longsor|kebakaran|evakuasi|darurat|korban|pengungsi|tsunami|erupsi|bencana|puting beliung/i;
const HEAVY = /bongkar|angkut|bangun|renovasi|gotong royong|bersih.?bersih sungai/i;
const MEDIUM = /mengajar|ngajar|panitia|acara|bimbel|posyandu|kerja bakti/i;

/** Feature: turn a one-line need into a complete call, with urgency detection. */
export async function draftCallWithAi(brief: string): Promise<{ error?: string; draft?: CallDraft }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "seeker") return { error: "Masuk sebagai penyelenggara dulu." };
  return draftCore(brief.trim().slice(0, 800));
}

// Best-effort per-IP throttle for the public demo (per server instance).
const demoHits = new Map<string, number[]>();

/** Public demo on /coba-ai: same AI drafting without login, shorter input and a per-IP limit. */
export async function demoDraftWithAi(brief: string): Promise<{ error?: string; draft?: CallDraft; category?: string }> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "anon";
  const now = Date.now();
  const recent = (demoHits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  if (recent.length >= 8) return { error: "Batas demo tercapai. Coba lagi 10 menit lagi." };
  demoHits.set(ip, [...recent, now]);
  const res = await draftCore(brief.trim().slice(0, 400));
  if (!res.draft) return res;
  const supabase = await createServerSupabase();
  const { data } = res.draft.category_id ? await supabase.from("categories").select("name").eq("id", res.draft.category_id).maybeSingle() : { data: null };
  return { ...res, category: (data as { name: string } | null)?.name };
}

async function draftCore(text: string): Promise<{ error?: string; draft?: CallDraft }> {
  if (text.length < 10) return { error: "Ceritakan kebutuhanmu minimal satu kalimat." };

  const supabase = await createServerSupabase();
  const { data: cats } = await supabase.from("categories").select("id, name").order("name");
  const categories = (cats ?? []) as { id: number; name: string }[];

  const ai = await askJson<Omit<CallDraft, "source" | "category_id"> & { category: string }>(
    `Kamu asisten platform relawan Indonesia "Sigap". Ubah kebutuhan berikut menjadi panggilan relawan yang jelas, jujur, dan aman.
Kebutuhan dari penyelenggara: """${text}"""

Aturan:
- title: 5-120 karakter, spesifik (kegiatan + lokasi bila disebut).
- description: 80-900 karakter Bahasa Indonesia; tugas relawan, durasi per hari, perlengkapan yang dibawa, siapa yang dibantu. Jangan mengarang fakta yang tidak ada; tulis "(lengkapi: ...)" untuk info yang kurang.
- category: pilih tepat satu dari: ${categories.map((c) => c.name).join(", ")}.
- load: salah satu ${LOAD_VALUES.join(", ")}. "darurat" hanya untuk bencana/keselamatan jiwa; "berat" untuk kerja fisik berat.
- quota: perkiraan jumlah relawan (1-200).
- urgency: rendah/sedang/tinggi/kritis berdasarkan risiko keselamatan dan waktu.
- is_emergency: true hanya jika urgency kritis.
- urgency_reason: satu kalimat alasan tingkat urgensi.
- risk_flags: daftar tanda bahaya keselamatan/penipuan bagi relawan (meminta uang/transfer, data sensitif, imbalan tidak wajar, ajakan pindah ke kanal pribadi, kegiatan berbahaya tanpa pengaman). Kosongkan jika aman.`,
    {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        category: { type: "STRING" },
        load: { type: "STRING", enum: LOAD_VALUES },
        quota: { type: "INTEGER" },
        urgency: { type: "STRING", enum: ["rendah", "sedang", "tinggi", "kritis"] },
        is_emergency: { type: "BOOLEAN" },
        urgency_reason: { type: "STRING" },
        risk_flags: { type: "ARRAY", items: { type: "STRING" } },
      },
      required: ["title", "description", "category", "load", "quota", "urgency", "is_emergency", "urgency_reason", "risk_flags"],
    },
  );

  if (ai) {
    const cat = categories.find((c) => c.name.toLowerCase() === ai.category?.toLowerCase());
    return {
      draft: {
        title: ai.title.slice(0, 120),
        description: ai.description.slice(0, 5000),
        category_id: cat?.id ?? null,
        load: LOAD_VALUES.includes(ai.load) ? ai.load : "ringan",
        quota: Math.min(200, Math.max(1, Math.round(ai.quota) || 5)),
        is_emergency: ai.is_emergency && ai.load === "darurat",
        urgency: ai.urgency,
        urgency_reason: ai.urgency_reason,
        risk_flags: [...new Set([...(ai.risk_flags ?? []), ...ruleFlags(text)])].slice(0, 5),
        source: "ai",
      },
    };
  }

  // Rule-based fallback when the AI service is unavailable.
  const emergency = EMERGENCY.test(text);
  const load: Load = emergency ? "darurat" : HEAVY.test(text) ? "berat" : MEDIUM.test(text) ? "sedang" : "ringan";
  const cat = categories.find((c) => text.toLowerCase().includes(c.name.toLowerCase().split(/[ &/]/)[0]));
  const first = text.split(/[.!?\n]/)[0].trim();
  return {
    draft: {
      title: first.length >= 5 ? first.slice(0, 120) : `Relawan: ${text.slice(0, 100)}`,
      description: `${text}\n\n(lengkapi: tugas relawan, durasi per hari, perlengkapan yang perlu dibawa, siapa yang akan dibantu)`,
      category_id: cat?.id ?? null,
      load,
      quota: Number(text.match(/(\d{1,3})\s*(orang|relawan)/i)?.[1] ?? 5),
      is_emergency: emergency,
      urgency: emergency ? "kritis" : load === "berat" ? "sedang" : "rendah",
      urgency_reason: emergency ? "Mengandung kata kunci bencana atau keselamatan jiwa." : "Tidak terdeteksi unsur darurat.",
      risk_flags: ruleFlags(text),
      source: "aturan",
    },
  };
}

/** Feature: volunteer writes rough notes, AI turns them into a profile bio (max 300 chars). */
export async function writeBioWithAi(raw: string): Promise<{ error?: string; bio?: string; source?: "ai" | "aturan" }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "volunteer") return { error: "Masuk sebagai relawan dulu." };
  const text = raw.trim().slice(0, 1000);
  if (text.length < 10) return { error: "Tulis dulu pengalamanmu minimal satu kalimat." };

  const ai = await askJson<{ bio: string }>(
    `Rapikan catatan relawan berikut menjadi bio profil di platform relawan "Sigap".
Catatan: """${text}"""

Aturan: Bahasa Indonesia yang hangat dan lugas, sudut pandang orang pertama, maksimal 280 karakter, sebutkan pengalaman/keahlian konkret dan motivasi. Jangan menambah fakta yang tidak ada di catatan. Jangan menyertakan nomor HP, alamat, atau data pribadi.`,
    { type: "OBJECT", properties: { bio: { type: "STRING" } }, required: ["bio"] },
  );
  if (ai?.bio) return { bio: ai.bio.trim().slice(0, 300), source: "ai" };

  const tidy = text.replace(/\s+/g, " ").replace(/^./, (c) => c.toUpperCase());
  return { bio: (/[.!?]$/.test(tidy) ? tidy : `${tidy}.`).slice(0, 300), source: "aturan" };
}

export type RankedVolunteer ={ volunteer_id: string; fit: number; reason: string };

/** Feature: AI re-ranks the SQL matches for a call and explains each pick. */
export async function rankMatchesWithAi(callId: string): Promise<{ error?: string; ranked?: RankedVolunteer[]; source?: "ai" | "aturan" }> {
  const viewer = await getViewer();
  if (!viewer || viewer.role !== "seeker") return { error: "Masuk sebagai penyelenggara dulu." };
  const call = await getOwnCall(callId, viewer.id);
  if (!call) return { error: "Panggilan tidak ditemukan." };

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("matches")
    .select("score, reasons, volunteer:volunteers(id, nickname, bio, verification_level, emergency_standby, city:cities(name), skills:volunteer_skills(level, skill:skills(name)))")
    .eq("call_id", callId)
    .order("score", { ascending: false })
    .limit(15);
  type Row = {
    score: number;
    reasons: string[];
    volunteer: { id: string; nickname: string | null; bio: string | null; verification_level: number; emergency_standby: boolean; city: { name: string } | null; skills: { level: number; skill: { name: string } | null }[] } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => r.volunteer);
  if (rows.length === 0) return { ranked: [], source: aiEnabled() ? "ai" : "aturan" };

  const candidates = rows.map((r, i) => ({
    ref: `K${i + 1}`,
    nama: r.volunteer!.nickname,
    kota: r.volunteer!.city?.name,
    level_verifikasi: r.volunteer!.verification_level,
    siaga_darurat: r.volunteer!.emergency_standby,
    skill: r.volunteer!.skills.map((s) => `${s.skill?.name}${s.level === 2 ? " (mahir)" : ""}`),
    bio: r.volunteer!.bio,
    skor_sistem: r.score,
    alasan_sistem: r.reasons,
  }));

  const ai = await askJson<{ ranked: { ref: string; fit: number; reason: string }[] }>(
    `Kamu asisten penyelenggara di platform relawan "Sigap". Pilih maksimal 5 relawan terbaik untuk panggilan ini dan urutkan.
Panggilan: ${JSON.stringify({ judul: call.title, beban: call.load, mode: call.mode, kota: call.city?.name, tugas: call.description.slice(0, 1200), skill: call.skills.map((s) => `${s.skill.name}${s.required ? " (wajib)" : ""}`) })}
Kandidat (sudah lolos filter wajib): ${JSON.stringify(candidates)}

Untuk setiap pilihan beri fit 0-100 dan reason: satu kalimat Bahasa Indonesia yang konkret (skill, pengalaman dari bio, jarak/kota, kesiapan darurat). Jangan menilai berdasarkan nama, agama, suku, atau jenis kelamin.`,
    {
      type: "OBJECT",
      properties: {
        ranked: {
          type: "ARRAY",
          items: { type: "OBJECT", properties: { ref: { type: "STRING" }, fit: { type: "INTEGER" }, reason: { type: "STRING" } }, required: ["ref", "fit", "reason"] },
        },
      },
      required: ["ranked"],
    },
  );

  if (ai?.ranked?.length) {
    const ranked = ai.ranked
      .map((r) => {
        const idx = Number(r.ref.replace(/\D/g, "")) - 1;
        const row = rows[idx];
        return row ? { volunteer_id: row.volunteer!.id, fit: Math.min(100, Math.max(0, r.fit)), reason: r.reason } : null;
      })
      .filter((r): r is RankedVolunteer => r !== null)
      .slice(0, 5);
    return { ranked, source: "ai" };
  }

  return {
    ranked: rows.slice(0, 5).map((r) => ({ volunteer_id: r.volunteer!.id, fit: r.score, reason: r.reasons.join(" · ") })),
    source: "aturan",
  };
}
