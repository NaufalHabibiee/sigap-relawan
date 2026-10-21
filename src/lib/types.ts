export type Role = "volunteer" | "seeker" | "admin";
export type Load = "ringan" | "promosi" | "sedang" | "berat" | "darurat";
export type WorkMode = "onsite" | "online" | "hybrid";
export type VolMode = "onsite" | "online" | "keduanya";
export type CallStatus = "draf" | "aktif" | "penuh" | "ditutup" | "selesai" | "dibatalkan";
export type AppStatus =
  | "applied"
  | "invited"
  | "reviewing"
  | "accepted"
  | "rejected"
  | "declined"
  | "expired"
  | "cancelled"
  | "completed"
  | "no_show";
export type SeekerType = "perusahaan" | "lembaga" | "komunitas" | "campaign" | "individu";
export type DaySlot = "pagi" | "siang" | "malam";
export type Gender = "L" | "P";

export type City = { id: number; name: string; province: string };
export type Category = { id: number; slug: string; name: string };
export type Skill = { id: number; slug: string; name: string; category_id: number | null };
export type Limitation = { id: number; slug: string; name: string; task_label: string };

export type MasterData = {
  cities: City[];
  categories: Category[];
  skills: Skill[];
  limitations: Limitation[];
};

export type SeekerMini = {
  id: string;
  slug: string;
  org_name: string;
  logo_url: string | null;
  verified: boolean;
  type: SeekerType;
};

export type CallCard = {
  id: string;
  slug: string;
  title: string;
  load: Load;
  mode: WorkMode;
  status: CallStatus;
  is_emergency: boolean;
  start_date: string;
  end_date: string;
  start_time: string | null;
  deadline: string;
  quota: number;
  benefits: string[];
  published_at: string | null;
  category: { name: string; slug: string } | null;
  city: { name: string; province: string } | null;
  seeker: SeekerMini | null;
};

export type CallDetail = CallCard & {
  description: string;
  address: string | null;
  end_time: string | null;
  min_level: number;
  age_min: number | null;
  age_max: number | null;
  gender: Gender | null;
  gender_reason: string | null;
  min_followers: number | null;
  allowance: number | null;
  commission_pct: number | null;
  need_cv: boolean;
  questions: string[];
  cover_url: string | null;
  category_id: number;
  city_id: number | null;
  seeker_id: string;
  cancel_reason: string | null;
  skills: { required: boolean; skill: { id: number; name: string } }[];
  involves: { limitation: { id: number; task_label: string } }[];
  accepted_count: number;
};

export type Stats = { rating_avg: number | null; rating_count: number; completed: number; no_show: number };

export type Review = {
  id: string;
  rating: number;
  body: string | null;
  reply: string | null;
  created_at: string;
  reviewer_name: string;
  call_title: string;
};

export type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export type ActionResult = { error?: string; ok?: boolean };
