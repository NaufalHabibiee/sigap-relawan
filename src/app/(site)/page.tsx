import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Bell,
  Building2,
  ClipboardList,
  Filter,
  HandHeart,
  LifeBuoy,
  type LucideIcon,
  MapPin,
  MessagesSquare,
  Plus,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  UserRoundPen,
  Users,
} from "lucide-react";
import { CategoryCarousel } from "@/components/category-carousel";
import { HeroVisual } from "@/components/hero-visual";
import { Avatar, Container } from "@/components/ui";
import { formatDate, formatDateRange } from "@/lib/format";
import { getAcceptedCounts, getAnnouncements, getCategoryCounts, getEmergencyCalls, getFeed, getHeroPeople, getMasterData } from "@/lib/data";

export default function HomePage() {
  return (
    <>
      <Hero />
      <div id="lanjut" className="scroll-mt-24" />
      <EmergencyStrip />
      <HowItWorks />
      <TwoPaths />
      <Categories />
      <Faq />
    </>
  );
}

async function Hero() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", "profiles");
  const people = await getHeroPeople();

  return (
    <div className="relative z-10 -mt-16 bg-white">
      <div aria-hidden className="absolute inset-x-0 top-0 -bottom-3 rounded-b-[3rem] bg-[#e4e1d8] sm:rounded-b-[4rem]" />
    <section className="relative isolate overflow-hidden rounded-b-[3rem] bg-paper shadow-[0_30px_60px_-45px_rgba(27,36,48,0.55)] sm:rounded-b-[4rem]">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Signal burst: rays fan out from behind the device and fade into the paper; one ring marks the device halo. */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_74%_42%,transparent_0_219px,rgba(232,98,44,0.3)_219px_220px,transparent_220px),radial-gradient(38rem_30rem_at_74%_42%,rgba(240,168,128,0.6),transparent_68%),radial-gradient(40rem_28rem_at_55%_0%,rgba(246,220,207,0.9),transparent_70%),radial-gradient(30rem_26rem_at_0%_60%,rgba(216,230,224,0.8),transparent_70%),radial-gradient(circle_at_74%_42%,transparent_0,transparent_8rem,var(--paper)_44rem),repeating-conic-gradient(from_6deg_at_74%_42%,rgba(232,98,44,0.13)_0deg_4deg,transparent_4deg_12deg)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(27,36,48,0.07)_1px,transparent_0)] [background-size:28px_28px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      </div>

      <Container className="grid grid-cols-[minmax(0,1fr)] items-start gap-14 pt-20 pb-20 sm:pt-20 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-10 lg:pt-20 lg:pb-28">
        <div className="lg:pt-8">
          <h1 className="h-display text-[3rem] sm:text-[4rem] lg:text-[4.25rem]">
            Ada yang butuh
            <br />
            tanganmu
            <br />
            <span className="text-sigap-ink">hari ini.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Isi profil sekali: kemampuan, keterbatasan, dan waktu luangmu. Sigap mengabari saat ada panggilan relawan yang cocok, dari dapur umum
            banjir sampai kelas membaca di teras rumah.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <Link
              href="/daftar?peran=relawan"
              className="btn btn-primary rounded-xl px-7 py-3.5 text-base shadow-[0_14px_30px_-12px_rgba(196,80,30,0.65)]"
            >
              Jadi relawan <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/daftar?peran=penyelenggara" className="group inline-flex items-center gap-3 font-semibold text-ink">
              <span className="inline-flex size-12 items-center justify-center rounded-full bg-white shadow-[0_10px_25px_-12px_rgba(27,36,48,0.5)] transition-transform group-hover:scale-105">
                <Building2 className="size-5 text-sigap-ink" aria-hidden />
              </span>
              Cari relawan
            </Link>
          </div>

          <div className="mt-12 border-t border-line/80 pt-6">
            <p className="text-sm text-ink-muted">Dipercaya {people.verifiedSeekers}+ penyelenggara terverifikasi</p>
            <ul className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
              {people.seekers.slice(0, 2).map((s) => (
                <li key={s.slug}>
                  <Link href={`/penyelenggara/${s.slug}`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft opacity-80 grayscale transition hover:opacity-100 hover:grayscale-0">
                    <Avatar src={s.logo_url} name={s.org_name} size={24} square />
                    {s.org_name}
                  </Link>
                </li>
              ))}
              {people.verifiedSeekers > 2 && <li className="text-sm font-medium text-ink-muted">+{people.verifiedSeekers - 2} lainnya</li>}
            </ul>
          </div>
        </div>

        <HeroVisual />
      </Container>
    </section>
      <HeroNotch />
    </div>
  );
}

/** Tab under the hero panel, like a sheet you can pull down; holds the scroll cue. */
function HeroNotch() {
  const front = "M0 0C30 0 38 7 47 22C57 42 73 54 100 54H160C187 54 203 42 213 22C222 7 230 0 260 0Z";
  return (
    <div className="absolute top-full left-1/2 -mt-px -translate-x-1/2" aria-hidden={false}>
      <svg width="260" height="70" viewBox="0 0 260 70" className="block" aria-hidden>
        <path d={front} transform="translate(0 12)" fill="#e4e1d8" />
        <path d={front} fill="var(--paper)" />
      </svg>
      <a
        href="#lanjut"
        aria-label="Gulir ke bawah"
        className="absolute top-2 left-1/2 inline-flex size-10 -translate-x-1/2 items-center justify-center rounded-full bg-white text-ink shadow-[0_8px_20px_-10px_rgba(27,36,48,0.6)] transition-colors hover:bg-ink hover:text-paper"
      >
        <ChevronDown className="notch-bounce size-5" aria-hidden />
      </a>
    </div>
  );
}

/** Progress ring for "joined of needed". Empty at zero, so the quota number alone carries the meaning. */
function QuotaRing({ joined, quota, size = 64 }: { joined: number; quota: number; size?: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, joined / Math.max(1, quota));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${joined} dari ${quota} relawan`}>
      <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden>
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" className="stroke-sigap/20" />
        <circle cx="22" cy="22" r={r} fill="none" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} className="stroke-sigap" />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="font-display text-xl font-bold text-ink">{quota}</span>
        <span className="mt-0.5 text-[0.6rem] font-medium text-ink-muted">relawan</span>
      </span>
    </div>
  );
}

async function EmergencyStrip() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", "announcements");
  const [calls, announcements] = await Promise.all([getEmergencyCalls(), getAnnouncements()]);
  const disaster = announcements.find((a) => a.is_disaster);
  if (calls.length === 0 && !disaster) return null;

  const shown = calls.slice(0, 4);
  const accepted = await getAcceptedCounts(shown.map((c) => c.id));
  const volunteersNeeded = calls.reduce((n, c) => n + c.quota, 0);
  const cities = new Set(calls.map((c) => c.city?.name).filter(Boolean)).size;

  return (
    <section className="relative overflow-hidden bg-white">
      <Siren aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 size-96 -rotate-12 text-sigap/[0.07]" />
      <Container className="relative pt-28 pb-28">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.25fr)] lg:items-start lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-sigap-wash px-3.5 py-1.5 text-sm font-semibold text-sigap-ink">
              <span className="live-dot inline-block size-2 rounded-full bg-sigap" aria-hidden />
              Siaga sekarang
            </p>
            <h2 className="h-section mt-5 text-3xl sm:text-5xl">{disaster?.title ?? "Bantuan dibutuhkan sekarang"}</h2>
            <p className="mt-4 max-w-md text-lg text-ink-soft">
              {disaster?.body ?? "Relawan yang cocok dikabari otomatis. Daftar sebelum kuota penuh."}
            </p>

            <div className="mt-10 flex items-end gap-4">
              <span className="font-display text-[5.5rem] leading-[0.85] font-extrabold tracking-tight text-sigap-ink sm:text-[7rem]">{volunteersNeeded}</span>
              <span className="pb-2 text-ink-soft">
                relawan dibutuhkan
                <br />
                di {cities} kota
              </span>
            </div>

            <Link href="/panggilan?darurat=1" className="btn btn-primary mt-10 rounded-xl px-6 py-3.5">
              Semua {calls.length} panggilan darurat <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <ol className="space-y-4">
            {shown.map((c, i) => {
              const lead = i === 0;
              return (
                <li key={c.id} className={i % 2 === 1 ? "lg:ml-10" : undefined}>
                  <Link
                    href={`/panggilan/${c.slug}`}
                    className={`group relative flex items-center gap-4 rounded-3xl border bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_22px_40px_-26px_rgba(27,36,48,0.55)] sm:gap-5 sm:p-6 ${
                      lead ? "border-sigap/50 shadow-[0_22px_40px_-28px_rgba(196,80,30,0.6)]" : "border-line"
                    }`}
                  >
                    <span className="hidden w-12 shrink-0 font-display text-5xl leading-none font-extrabold text-ink/[0.12] sm:block" aria-hidden>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                        <span className="inline-flex items-center gap-1 rounded-md bg-sigap-ink px-2 py-0.5 text-white">
                          <Siren className="size-3.5" aria-hidden /> {lead ? "Paling mendesak" : "Darurat"}
                        </span>
                        {c.category && <span className="rounded-md bg-paper px-2 py-0.5 font-semibold text-ink-soft">{c.category.name}</span>}
                      </div>
                      <h3 className={`mt-2 leading-snug font-semibold group-hover:underline ${lead ? "text-xl sm:text-2xl" : "text-lg"}`}>{c.title}</h3>
                      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
                        <li className="inline-flex items-center gap-1.5">
                          <MapPin className="size-4 text-ink-muted" aria-hidden /> {c.mode === "online" ? "Online" : c.city?.name}
                        </li>
                        <li className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-4 text-ink-muted" aria-hidden /> {formatDateRange(c.start_date, c.end_date)}
                        </li>
                        {lead && (
                          <li className="inline-flex items-center gap-1.5 font-semibold text-sigap-ink">
                            Daftar sampai {formatDate(c.deadline, { day: "numeric", month: "short" })}
                          </li>
                        )}
                      </ul>
                    </div>
                    <QuotaRing joined={accepted[c.id] ?? 0} quota={c.quota} size={lead ? 76 : 64} />
                    <span className="hidden size-11 shrink-0 items-center justify-center rounded-full bg-ink text-paper transition-transform group-hover:translate-x-1 sm:inline-flex">
                      <ArrowRight className="size-5" aria-hidden />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </Container>
    </section>
  );
}

async function TwoPaths() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", "profiles");
  const [feed, people] = await Promise.all([getFeed(), getHeroPeople()]);
  const sample = feed.slice(0, 3);
  const scores = [94, 88, 81];
  const recos = people.volunteers.slice(0, 3);

  return (
    <section id="penyelenggara" className="sheet z-[3] scroll-mt-20 bg-white">
      <Container className="pt-20 pb-28 lg:pt-24 lg:pb-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-paper px-3 py-1 text-sm font-semibold text-sigap-ink">Dua sisi, satu tujuan</p>
          <h2 className="h-section mt-4 text-3xl sm:text-4xl">Kamu mau membantu, atau butuh bantuan?</h2>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <PathCard
            tone="guyub"
            icon={HandHeart}
            label="Untuk relawan"
            title="Bantu sesuai kemampuanmu, bukan sekadar semangat."
            points={[
              [Filter, "Panggilan sudah disaring sesuai skill, lokasi, dan jadwalmu."],
              [ShieldCheck, "Keterbatasanmu dihormati: tugas yang tidak sesuai tidak ditawarkan."],
              [Star, "Rekam jejak dan ulasan membuatmu dipercaya di panggilan berikutnya."],
            ]}
            cta={{ href: "/daftar?peran=relawan", label: "Buat profil relawan" }}
            visual={
              <div className="rounded-2xl bg-white p-4 shadow-[0_20px_45px_-25px_rgba(23,89,74,0.55)]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Bell className="size-4 text-guyub" aria-hidden /> {sample.length} panggilan cocok untukmu
                </p>
                <ul className="mt-3 space-y-2">
                  {sample.map((c, i) => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl bg-paper/70 px-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{c.title}</span>
                        <span className="block text-xs text-ink-muted">{c.mode === "online" ? "Online" : c.city?.name}</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 font-display text-xs font-bold ${i === 0 ? "bg-sigap-ink text-white" : "bg-guyub-wash text-guyub-deep"}`}>
                        {scores[i]}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
          <PathCard
            tone="sigap"
            icon={Building2}
            label="Untuk perusahaan, lembaga, komunitas"
            title="Tulis kebutuhanmu, relawan yang cocok langsung dikabari."
            points={[
              [Sparkles, "Tentukan kriteria wajib dan preferensi; sistem menghitung kecocokan tiap relawan."],
              [MessagesSquare, "Undang relawan rekomendasi, seleksi pelamar, dan koordinasi lewat chat."],
              [Siren, "Penyelenggara terverifikasi bisa membuka panggilan darurat untuk bencana."],
            ]}
            cta={{ href: "/daftar?peran=penyelenggara", label: "Buat panggilan relawan" }}
            visual={
              <div className="rounded-2xl bg-white p-4 shadow-[0_20px_45px_-25px_rgba(196,80,30,0.55)]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="size-4 text-sigap-ink" aria-hidden /> Rekomendasi relawan
                </p>
                <ul className="mt-3 space-y-2">
                  {recos.map((v, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl bg-paper/70 px-3 py-2">
                      <Avatar src={v.avatar_url} name={v.nickname ?? "?"} size={32} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{v.nickname}</span>
                        <span className="block text-xs text-guyub-deep">Cocok {scores[i]}%</span>
                      </span>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${i === 0 ? "bg-guyub text-white" : "bg-sigap-ink text-white"}`}>
                        {i === 0 ? "Diterima" : "Undang"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            }
          />
        </div>
      </Container>
    </section>
  );
}

function PathCard({
  tone,
  icon: Icon,
  label,
  title,
  points,
  cta,
  visual,
}: {
  tone: "guyub" | "sigap";
  icon: LucideIcon;
  label: string;
  title: string;
  points: [LucideIcon, string][];
  cta: { href: string; label: string };
  visual: React.ReactNode;
}) {
  const t =
    tone === "guyub"
      ? { card: "bg-guyub-wash/60", blob: "bg-guyub/20", chip: "bg-guyub text-white", dot: "bg-white text-guyub", btn: "btn-guyub", text: "text-guyub-deep" }
      : { card: "bg-sigap-wash/60", blob: "bg-sigap/25", chip: "bg-sigap-ink text-white", dot: "bg-white text-sigap-ink", btn: "btn-primary", text: "text-sigap-ink" };
  return (
    <article className={`relative flex flex-col overflow-hidden rounded-[2rem] p-6 sm:p-9 ${t.card}`}>
      <div aria-hidden className={`absolute -top-20 -right-20 size-64 rounded-full blur-3xl ${t.blob}`} />
      <div className="relative">
        <p className={`inline-flex items-center gap-2 text-sm font-semibold ${t.text}`}>
          <span className={`inline-flex size-9 items-center justify-center rounded-xl ${t.chip}`}>
            <Icon className="size-5" aria-hidden />
          </span>
          {label}
        </p>
        <h3 className="h-section mt-5 text-2xl sm:text-[1.75rem]">{title}</h3>
        <ul className="mt-6 space-y-3">
          {points.map(([P, text]) => (
            <li key={text} className="flex gap-3 text-ink-soft">
              <span className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm ${t.dot}`}>
                <P className="size-3.5" aria-hidden />
              </span>
              {text}
            </li>
          ))}
        </ul>
        <Link href={cta.href} className={`btn ${t.btn} mt-7 rounded-xl px-6 py-3`}>
          {cta.label} <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="relative mt-8 sm:mt-auto sm:pt-8">{visual}</div>
    </article>
  );
}

const STEPS = [
  {
    icon: UserRoundPen,
    tone: "bg-guyub text-white",
    who: "Relawan",
    title: "Isi profil sekali",
    body: "Data diri, kelebihan, keterbatasan, waktu luang, dan CV kalau ada.",
  },
  {
    icon: ClipboardList,
    tone: "bg-ink text-paper",
    who: "Penyelenggara",
    title: "Buat panggilan",
    body: "Tulis tugas, tingkat beban, lokasi, jadwal, dan kriteria relawan.",
  },
  {
    icon: Sparkles,
    tone: "bg-sigap-ink text-white",
    who: "Sistem",
    title: "Dicocokkan otomatis",
    body: "Relawan dengan kecocokan tinggi dikabari, lengkap dengan alasannya.",
  },
  {
    icon: MessagesSquare,
    tone: "bg-ladang text-ink",
    who: "Keduanya",
    title: "Ngobrol & turun ke lapangan",
    body: "Lamar atau terima undangan, koordinasi di chat, lalu saling beri ulasan.",
  },
];

/** Pale surface and accent per step, matched to the step's icon colour so each column reads as one unit. */
const STEP_TINT = ["bg-guyub-wash/70", "bg-ink/[0.06]", "bg-sigap-wash/80", "bg-ladang-wash/80"];
const STEP_BAR = ["bg-guyub", "bg-ink", "bg-sigap", "bg-ladang"];

/** Small product moment under each step. Every panel has the same minimum height so the four columns end on one line. */
function StepVisual({ i }: { i: number }) {
  const shell = `flex min-h-[10.5rem] flex-col justify-center rounded-2xl p-4 ${STEP_TINT[i]}`;
  if (i === 0)
    return (
      <div className={shell}>
        <div className="flex items-center gap-3">
          <span className="inline-flex size-10 items-center justify-center rounded-full bg-guyub font-display text-sm font-bold text-white">AS</span>
          <div className="min-w-0">
            <p className="text-sm leading-tight font-semibold">Andi Santoso</p>
            <p className="text-xs text-ink-muted">Bekasi · siap akhir pekan</p>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs font-semibold">
          <span>Kelengkapan profil</span>
          <span className="text-guyub-deep">82%</span>
        </div>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
          <div className="h-full w-[82%] rounded-full bg-guyub" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["P3K", "Logistik", "Mengajar"].map((t) => (
            <span key={t} className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold">
              {t}
            </span>
          ))}
        </div>
      </div>
    );
  if (i === 1)
    return (
      <div className={shell}>
        <p className="text-sm font-semibold">Dapur umum banjir Demak</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-md bg-sigap-ink px-2 py-0.5 text-[11px] font-bold text-white">Darurat</span>
          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold">Demak</span>
          <span className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold">12–18 Okt</span>
        </div>
        <div className="mt-3 flex items-center justify-between rounded-xl bg-white px-3 py-2 text-xs">
          <span className="font-semibold">Kuota relawan</span>
          <span className="font-display text-base font-bold">30</span>
        </div>
        <p className="mt-2 text-[11px] text-ink-muted">Wajib Level 2 · skill logistik</p>
      </div>
    );
  if (i === 2)
    return (
      <div className={shell}>
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0">
            <svg viewBox="0 0 44 44" className="size-full -rotate-90" aria-hidden>
              <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" className="stroke-white" />
              <circle cx="22" cy="22" r="18" fill="none" strokeWidth="5" strokeLinecap="round" strokeDasharray="113.1" strokeDashoffset="9" className="stroke-sigap" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold">92%</span>
          </div>
          <p className="text-sm leading-tight font-semibold">Kecocokan tinggi</p>
        </div>
        <ul className="mt-3 space-y-1 text-xs font-medium text-guyub-deep">
          <li>✓ 3 skill cocok</li>
          <li>✓ 12 km dari lokasi</li>
          <li>✓ Waktu luang sesuai</li>
        </ul>
      </div>
    );
  return (
    <div className={`${shell} gap-1.5 text-xs`}>
      <p className="w-fit rounded-2xl rounded-bl-sm bg-white px-3 py-2">Bisa datang jam 7 pagi?</p>
      <p className="ml-auto w-fit rounded-2xl rounded-br-sm bg-ink px-3 py-2 text-paper">Siap, saya bawa P3K!</p>
      <p className="flex items-center justify-between pt-1 text-[11px] font-semibold text-ink-soft">
        <span>Kegiatan selesai</span>
        <span className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <Star key={n} className="size-3.5 fill-ladang text-ladang" aria-hidden />
          ))}
        </span>
      </p>
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="cara-kerja" className="sheet z-[2] scroll-mt-20 bg-paper">
      <Container className="pt-20 pb-28 lg:pt-24 lg:pb-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-sigap-ink">Cara kerja</p>
          <h2 className="h-section mt-4 text-3xl sm:text-4xl">Dari profil sampai turun ke lapangan</h2>
          <p className="mt-3 text-ink-soft">Empat langkah, tanpa broadcast acak di grup WhatsApp.</p>
        </div>

        {/* Timeline: numbered nodes on one line, aligned over the four columns. */}
        <div className="relative mt-14 hidden lg:grid lg:grid-cols-4 lg:gap-5" aria-hidden>
          <span className="absolute inset-x-[12.5%] top-1/2 border-t-2 border-dashed border-line-strong" />
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative flex justify-center">
              <span className={`inline-flex size-14 items-center justify-center rounded-full font-display text-2xl font-bold ring-[10px] ring-paper ${s.tone}`}>{i + 1}</span>
            </div>
          ))}
        </div>

        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:mt-6 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="group relative flex flex-col overflow-hidden rounded-3xl border border-line/70 bg-white shadow-[0_22px_44px_-30px_rgba(27,36,48,0.5)] transition-transform duration-300 hover:-translate-y-1.5"
            >
              <span className={`h-1.5 w-full ${STEP_BAR[i]}`} aria-hidden />
              <div className="flex flex-1 flex-col p-6">
                <div className="flex items-center justify-between">
                  <span className={`inline-flex size-12 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105 ${s.tone}`}>
                    <s.icon className="size-6" aria-hidden />
                  </span>
                  <span className="rounded-full bg-paper px-3 py-1 text-xs font-bold text-ink-soft">
                    <span className="lg:hidden">Langkah {i + 1} · </span>
                    {s.who}
                  </span>
                </div>
                <h3 className="mt-5 text-xl leading-snug font-semibold">{s.title}</h3>
                <p className="mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{s.body}</p>
                <div className="mt-auto pt-6">
                  <StepVisual i={i} />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  );
}

async function Categories() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", "master");
  const [{ categories }, counts] = await Promise.all([getMasterData(), getCategoryCounts()]);
  return (
    <section className="sheet z-[4] bg-paper">
      <Container className="pt-20 pb-28 lg:pt-24 lg:pb-32">
        <div>
          <div className="mx-auto max-w-xl text-center">
            <p className="inline-flex rounded-full bg-white px-3 py-1 text-sm font-semibold text-guyub-deep">Bidang</p>
            <h2 className="h-section mt-4 text-3xl sm:text-4xl">Bidang yang bisa kamu bantu</h2>
            <p className="mt-3 text-ink-soft">Dari tugas berat di lokasi bencana sampai pekerjaan ringan yang bisa dikerjakan dari rumah.</p>
          </div>
        </div>

        <div className="mt-10">
          <CategoryCarousel items={categories.map((c) => ({ slug: c.slug, name: c.name, count: counts[c.slug] ?? 0 }))} />
        </div>
        <div className="mt-8 text-center">
          <Link href="/panggilan" className="btn btn-outline">
            Jelajah semua panggilan <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </section>
  );
}

const FAQ = [
  ["Apakah saya harus punya CV?", "Tidak. CV opsional. Banyak panggilan, terutama tanggap bencana, hanya butuh profil yang lengkap dan identitas terverifikasi."],
  [
    "Kenapa ada level verifikasi?",
    "Tugas ringan dan promosi cukup dengan profil lengkap dan nomor HP terverifikasi. Tugas berat dan darurat butuh verifikasi identitas (KTP) dan kontak darurat demi keselamatan semua pihak.",
  ],
  [
    "Siapa yang bisa melihat data pribadi saya?",
    "Publik hanya melihat nama panggilan, kota, skill, dan ulasan. Nama lengkap, keterbatasan, dan CV terlihat oleh penyelenggara setelah kamu melamar. Nomor HP dan kontak darurat baru dibuka setelah kamu diterima.",
  ],
  ["Apakah relawan dibayar?", "Tergantung panggilan. Setiap panggilan mencantumkan yang didapat relawan: konsumsi, transport, uang saku, komisi affiliate, atau tidak ada."],
  ["Bagaimana jika ada yang meminta transfer uang?", "Jangan transfer. Sigap tidak pernah memungut biaya. Laporkan percakapan itu lewat tombol Laporkan di chat."],
];

function Faq() {
  return (
    <section className="sheet sheet-end z-[5] bg-white">
      <Container className="pt-20 pb-28 lg:pt-24 lg:pb-32">
        <div className="max-w-2xl">
          <p className="inline-flex rounded-full bg-paper px-3 py-1 text-sm font-semibold text-sigap-ink">FAQ</p>
          <h2 className="h-section mt-4 text-3xl sm:text-4xl">Pertanyaan yang sering muncul</h2>
          <p className="mt-3 text-ink-soft">Belum menemukan jawabannya? Kami bantu lewat halaman Bantuan.</p>
        </div>
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.6fr] lg:items-stretch lg:gap-14">
          <div className="relative min-h-80 lg:min-h-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-[#edece8] lg:aspect-auto lg:h-full">
              <Image
                src="/illustrations/faq-tanya.png"
                alt="Ilustrasi relawan berhoodie oranye mengangkat tangan ingin bertanya"
                fill
                sizes="(min-width: 1024px) 420px, 90vw"
                className="object-cover"
              />
            </div>
            <Link
              href="/bantuan"
              className="group absolute right-4 bottom-4 left-4 flex items-center gap-3 rounded-2xl bg-white/90 p-3 pr-4 shadow-[0_18px_40px_-24px_rgba(27,36,48,0.6)] backdrop-blur transition-colors hover:bg-white"
            >
              <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-guyub text-white">
                <LifeBuoy className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold">Masih ragu mau mulai?</span>
                <span className="block text-xs text-ink-muted">Buka panduan relawan & penyelenggara</span>
              </span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
          <div className="space-y-3">
            {FAQ.map(([q, a], i) => (
              <details
                key={q}
                open={i === 0}
                className="group rounded-2xl border border-line/60 bg-paper/50 px-5 transition-colors open:bg-white open:shadow-[0_18px_40px_-26px_rgba(27,36,48,0.6)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {q}
                  <span
                    className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-ink transition-all duration-200 group-open:rotate-45 group-open:bg-sigap-ink group-open:text-white"
                    aria-hidden
                  >
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-5 text-ink-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
