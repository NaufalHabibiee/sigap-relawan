/**
 * On-device triage: runs entirely in the browser with no network, for disaster
 * sites without signal. First version is a weighted lexicon scorer; the planned
 * next step is a small quantized model running on the phone's NPU.
 */

export type Urgency = "rendah" | "sedang" | "tinggi" | "kritis";

export type OfflineTriage = {
  urgency: Urgency;
  score: number;
  signals: string[];
  risk_flags: string[];
  quota: number | null;
  ms: number;
};

const SIGNALS: { re: RegExp; w: number; label: string }[] = [
  { re: /tenggelam|hanyut|terjebak|tertimbun|terseret|tidak sadar|pingsan|sesak napas|pendarahan|kritis/i, w: 5, label: "ancaman langsung terhadap jiwa" },
  { re: /banjir|gempa|longsor|kebakaran|tsunami|erupsi|puting beliung|angin kencang|bencana/i, w: 3, label: "kejadian bencana" },
  { re: /evakuasi|darurat|sar\b|tim medis|pertolongan pertama|ambulans/i, w: 3, label: "kebutuhan penyelamatan" },
  { re: /sepinggang|sedada|seleher|setinggi atap|naik terus|meluap/i, w: 3, label: "kondisi air berbahaya" },
  { re: /lansia|balita|bayi|ibu hamil|disabilitas|anak.?anak|sakit/i, w: 2, label: "kelompok rentan terdampak" },
  { re: /malam ini|sekarang|segera|secepatnya|hari ini|sejak (tadi|pagi|semalam)|belum (dievakuasi|ditolong|makan)/i, w: 2, label: "waktu mendesak" },
  { re: /pengungsi|posko|dapur umum|logistik|sembako|air bersih/i, w: 1, label: "kebutuhan dasar warga" },
];

const RISKS: { re: RegExp; label: string }[] = [
  { re: /transfer|biaya pendaftaran|uang jaminan|deposit|bayar dulu|top ?up/i, label: "Meminta relawan membayar atau mentransfer uang." },
  { re: /nomor rekening|\bpin\b|\botp\b|kode verifikasi|password|kata sandi/i, label: "Meminta data sensitif." },
  { re: /(hubungi|chat|dm) (via|lewat|ke) (wa|whatsapp|telegram)|wa\.me|t\.me/i, label: "Mengarahkan komunikasi keluar dari platform." },
  { re: /gaji (besar|tinggi|jutaan)|penghasilan pasti/i, label: "Menjanjikan imbalan tidak wajar." },
];

const SAFETY: { when: RegExp; missing: RegExp; label: string }[] = [
  { when: /evakuasi|banjir|arus|sungai/i, missing: /pelampung|perahu|life ?jacket|tali/i, label: "Kegiatan di air tanpa menyebut alat pengaman (pelampung/perahu)." },
  { when: /evakuasi|longsor|gempa|kebakaran/i, missing: /bpbd|basarnas|sar\b|damkar|koordinator/i, label: "Belum ada koordinasi dengan BPBD/SAR atau koordinator lapangan." },
];

export function triageOffline(text: string): OfflineTriage {
  const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
  let score = 0;
  const signals: string[] = [];
  for (const s of SIGNALS) {
    if (s.re.test(text)) {
      score += s.w;
      signals.push(s.label);
    }
  }
  const urgency: Urgency = score >= 9 ? "kritis" : score >= 6 ? "tinggi" : score >= 3 ? "sedang" : "rendah";
  const risk_flags = [
    ...RISKS.filter((r) => r.re.test(text)).map((r) => r.label),
    ...(score >= 6 ? SAFETY.filter((s) => s.when.test(text) && !s.missing.test(text)).map((s) => s.label) : []),
  ];
  const q = text.match(/(\d{1,3})\s*(orang|relawan|org)/i);
  const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
  return { urgency, score, signals, risk_flags, quota: q ? Number(q[1]) : null, ms: Math.max(0.1, Math.round((t1 - t0) * 10) / 10) };
}
