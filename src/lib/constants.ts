import type { AppStatus, CallStatus, DaySlot, Load, SeekerType, WorkMode } from "./types";

export const LOADS: { value: Load; label: string; hint: string; level: 1 | 2 }[] = [
  { value: "ringan", label: "Ringan", hint: "Entri data, desain, admin medsos, survei", level: 1 },
  { value: "promosi", label: "Promosi", hint: "Konten affiliate, review produk, sebar kampanye", level: 1 },
  { value: "sedang", label: "Sedang", hint: "Panitia acara sosial, mengajar, bersih-bersih", level: 1 },
  { value: "berat", label: "Berat", hint: "Bongkar muat, pembangunan, kerja fisik lapangan", level: 2 },
  { value: "darurat", label: "Darurat", hint: "Evakuasi, dapur umum, posko bencana", level: 2 },
];

export const LOAD_LABEL: Record<Load, string> = Object.fromEntries(LOADS.map((l) => [l.value, l.label])) as Record<
  Load,
  string
>;

/** Colour encodes the weight of the task, not decoration. */
export const LOAD_STYLE: Record<Load, string> = {
  ringan: "bg-guyub-wash text-guyub-deep",
  promosi: "bg-ladang-wash text-[#6b5410]",
  sedang: "bg-[#e3e1d8] text-ink",
  berat: "bg-ink text-paper",
  darurat: "bg-sigap-ink text-white",
};

export const MODE_LABEL: Record<WorkMode, string> = { onsite: "Di lokasi", online: "Online", hybrid: "Hybrid" };

export const CALL_STATUS: Record<CallStatus, { label: string; style: string }> = {
  draf: { label: "Draf", style: "bg-[#e3e1d8] text-ink-soft" },
  aktif: { label: "Menerima relawan", style: "bg-guyub-wash text-guyub-deep" },
  penuh: { label: "Kuota penuh", style: "bg-ladang-wash text-[#6b5410]" },
  ditutup: { label: "Ditutup", style: "bg-[#e3e1d8] text-ink-soft" },
  selesai: { label: "Selesai", style: "bg-ink text-paper" },
  dibatalkan: { label: "Dibatalkan", style: "bg-danger-wash text-danger" },
};

export const APP_STATUS: Record<AppStatus, { label: string; style: string }> = {
  applied: { label: "Dilamar", style: "bg-[#e3e1d8] text-ink" },
  invited: { label: "Diundang", style: "bg-sigap-wash text-sigap-ink" },
  reviewing: { label: "Ditinjau", style: "bg-ladang-wash text-[#6b5410]" },
  accepted: { label: "Diterima", style: "bg-guyub text-white" },
  rejected: { label: "Tidak diterima", style: "bg-[#e3e1d8] text-ink-soft" },
  declined: { label: "Undangan ditolak", style: "bg-[#e3e1d8] text-ink-soft" },
  expired: { label: "Kedaluwarsa", style: "bg-[#e3e1d8] text-ink-soft" },
  cancelled: { label: "Dibatalkan", style: "bg-danger-wash text-danger" },
  completed: { label: "Selesai", style: "bg-ink text-paper" },
  no_show: { label: "Tidak hadir", style: "bg-danger-wash text-danger" },
};

export const ACTIVE_APP: AppStatus[] = ["applied", "invited", "reviewing", "accepted"];

export const SEEKER_TYPES: { value: SeekerType; label: string }[] = [
  { value: "perusahaan", label: "Perusahaan" },
  { value: "lembaga", label: "Lembaga / NGO" },
  { value: "komunitas", label: "Komunitas" },
  { value: "campaign", label: "Campaign" },
  { value: "individu", label: "Individu" },
];
export const SEEKER_TYPE_LABEL = Object.fromEntries(SEEKER_TYPES.map((t) => [t.value, t.label])) as Record<
  SeekerType,
  string
>;

export const WEEKDAYS = [
  { value: 1, label: "Sen" },
  { value: 2, label: "Sel" },
  { value: 3, label: "Rab" },
  { value: 4, label: "Kam" },
  { value: 5, label: "Jum" },
  { value: 6, label: "Sab" },
  { value: 7, label: "Min" },
];

export const SLOTS: { value: DaySlot; label: string; hint: string }[] = [
  { value: "pagi", label: "Pagi", hint: "sebelum 11.00" },
  { value: "siang", label: "Siang", hint: "11.00–17.00" },
  { value: "malam", label: "Malam", hint: "setelah 17.00" },
];

export const BENEFITS = [
  { value: "konsumsi", label: "Konsumsi" },
  { value: "transport", label: "Transport" },
  { value: "akomodasi", label: "Akomodasi" },
  { value: "uang saku", label: "Uang saku" },
  { value: "komisi", label: "Komisi affiliate" },
  { value: "produk gratis", label: "Produk gratis" },
  { value: "kaos", label: "Kaos kegiatan" },
  { value: "sertifikat", label: "Sertifikat" },
];

export const SOCIAL_PLATFORMS = [
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
] as const;

export const BLOOD_TYPES = ["A", "B", "AB", "O", "tidak tahu"];

export const SCAM_PATTERN = /(transfer|rekening|biaya pendaftaran|bayar dulu|deposit|top ?up|kirim uang|no\.? rek)/i;
