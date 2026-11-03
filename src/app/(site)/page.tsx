import Image from "next/image";
import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  Bell,
  Building2,
  Filter,
  HandHeart,
  type LucideIcon,
  MapPin,
  MessagesSquare,
  Plus,
  ShieldCheck,
  Siren,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { CategoryCarousel } from "@/components/category-carousel";
import { HeroArc } from "@/components/hero-arc";
import { Avatar, Container } from "@/components/ui";
import { formatDate, formatDateRange } from "@/lib/format";
import { getAcceptedCounts, getAnnouncements, getCategoryCounts, getEmergencyCalls, getFeed, getHeroPeople, getMasterData, getPlatformStats } from "@/lib/data";

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
  const [feed, emergency, stats] = await Promise.all([getFeed(), getEmergencyCalls(), getPlatformStats()]);
  const heroCalls = [...emergency, ...feed.filter((f) => !emergency.some((e) => e.id === f.id))];

  return (
    <div className="relative z-10 -mt-16 bg-white">
    <section className="relative isolate overflow-hidden bg-paper">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {/* Real volunteer work as the backdrop (FEMA photo, public domain), washed in Sigap's paper tone so the headline stays readable. */}
        <Image src="/hero/relawan-karung-pasir.jpg" alt="" fill priority sizes="100vw" className="object-cover object-[50%_30%]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(238,236,229,0.97)_0%,rgba(238,236,229,0.94)_38%,rgba(238,236,229,0.6)_52%,rgba(238,236,229,0.12)_68%,rgba(27,36,48,0.05)_100%)]" />
      </div>

      <Container className="pt-24 pb-24 text-center sm:pt-28 lg:pb-28">
        <h1 className="font-jakarta mx-auto max-w-4xl text-[2.6rem] leading-[1.08] font-light tracking-[-0.035em] text-ink sm:text-[3.6rem] lg:text-[4.2rem]">
          Ada yang butuh tanganmu
          <br />
          <span className="text-sigap-ink">hari ini.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-ink-soft sm:text-lg">
          Isi profil sekali. Sigap mengabari saat ada panggilan relawan yang cocok, dari dapur umum banjir sampai kelas membaca di teras rumah.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/daftar?peran=penyelenggara"
            className="font-mono-ui inline-flex h-12 items-center rounded-full bg-ink/10 px-6 text-[0.8rem] text-ink ring-1 ring-ink/15 backdrop-blur transition-colors hover:bg-ink/15"
          >
            Butuh relawan
          </Link>
          <Link
            href="/daftar?peran=relawan"
            className="font-mono-ui group inline-flex h-12 items-center gap-3 rounded-full bg-sigap pr-1.5 pl-6 text-[0.8rem] text-white shadow-[0_14px_30px_-12px_rgba(196,80,30,0.7)] transition-colors hover:bg-sigap-ink"
          >
            Jadi relawan
            <span className="inline-flex size-9 items-center justify-center rounded-full bg-ink text-paper transition-transform group-hover:rotate-45">
              <ArrowUpRight className="size-4" aria-hidden />
            </span>
          </Link>
        </div>

        <div className="mt-14 text-left sm:mt-16">
          <HeroArc feed={heroCalls} stats={stats} />
        </div>

        <p className="font-mono-ui mx-auto mt-8 w-fit rounded-full bg-paper/85 px-4 py-2 text-[0.7rem] text-ink/80 backdrop-blur">Gratis untuk relawan dan penyelenggara · tanpa biaya pendaftaran</p>
        <p className="absolute right-4 bottom-3 rounded-md bg-ink/55 px-2 py-1 text-[0.62rem] text-paper/90 backdrop-blur">Foto: relawan mengisi karung pasir saat banjir · FEMA, domain publik</p>
      </Container>
    </section>
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
  { who: "Relawan", title: "Isi profil sekali", body: "Kemampuan, keterbatasan, waktu luang, dan lokasi. Cukup sekali, dipakai untuk semua panggilan." },
  { who: "Penyelenggara", title: "Buat panggilan", body: "Ketik atau ucapkan kebutuhan. AI menyusun panggilan, menilai urgensi, dan memeriksa tanda penipuan." },
  { who: "Sistem", title: "Dicocokkan", body: "Relawan yang memenuhi syarat dikabari. AI memilih yang paling sesuai, lengkap dengan alasannya." },
  { who: "Keduanya", title: "Turun ke lapangan", body: "Koordinasi lewat chat, hadir di lokasi, lalu saling memberi ulasan setelah kegiatan." },
];

function HowItWorks() {
  return (
    <section id="cara-kerja" className="sheet z-[2] scroll-mt-20 bg-paper">
      <Container className="pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
          <div>
            <p className="font-mono-ui text-[0.72rem] text-sigap-ink">Cara kerja</p>
            <h2 className="font-jakarta mt-4 text-[2.2rem] leading-[1.1] font-light tracking-[-0.03em] text-ink sm:text-[2.8rem]">Dari profil sampai turun ke lapangan.</h2>
          </div>
          <p className="max-w-md text-ink-soft lg:justify-self-end">Empat langkah, tanpa siaran acak di grup WhatsApp.</p>
        </div>

        <ol className="mt-14 grid border-t border-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="border-b border-ink/15 py-8 sm:pr-8 lg:border-b-0 lg:border-l lg:px-8 lg:py-10 lg:first:border-l-0 lg:first:pl-0">
              <p className="font-mono-ui flex items-baseline justify-between text-[0.7rem] text-ink-muted">
                <span className="text-ink">{String(i + 1).padStart(2, "0")}</span>
                {s.who}
              </p>
              <h3 className="font-jakarta mt-10 text-[1.45rem] leading-snug font-normal tracking-[-0.01em] text-ink">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{s.body}</p>
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

const FAQ: [string, string][] = [
  ["Apakah Sigap gratis?", "Ya. Sigap gratis untuk relawan dan penyelenggara, dan tidak pernah memungut biaya pendaftaran."],
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
  [
    "Bagaimana Sigap memilih relawan?",
    "Sistem menyaring syarat wajib lebih dulu: skill, lokasi, jadwal, usia, keterbatasan, dan level verifikasi. Dari yang lolos, AI memilih yang paling sesuai dan menuliskan alasannya agar penyelenggara bisa memeriksa.",
  ],
  [
    "Apa yang dilakukan AI di Sigap?",
    "AI membantu menyusun panggilan dari satu kalimat atau suara, menilai urgensi, menandai tanda penipuan dan risiko keselamatan, serta merapikan bio relawan. Keputusan akhir tetap di tangan manusia.",
  ],
  ["Bagaimana jika ada yang meminta transfer uang?", "Jangan transfer. Sigap tidak pernah memungut biaya. Laporkan percakapan itu lewat tombol Laporkan di chat."],
  [
    "Bagaimana jika saya batal hadir?",
    "Kabari penyelenggara lewat chat secepatnya agar mereka bisa mencari pengganti. Ketidakhadiran tanpa kabar tercatat di riwayat kegiatan dan bisa memengaruhi ulasanmu.",
  ],
  [
    "Siapa saja yang bisa membuat panggilan?",
    "Komunitas, yayasan, RT/RW, kampus, perusahaan, maupun perorangan. Panggilan tingkat Berat dan Darurat hanya bisa dibuat oleh penyelenggara yang sudah terverifikasi.",
  ],
];

function Faq() {
  const half = Math.ceil(FAQ.length / 2);
  const columns = [FAQ.slice(0, half), FAQ.slice(half)];
  return (
    <section className="sheet sheet-end z-[5] bg-white">
      <Container className="pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono-ui text-[0.72rem] text-sigap-ink">FAQ</p>
          <h2 className="font-jakarta mt-4 text-[2.2rem] leading-[1.1] font-light tracking-[-0.03em] text-ink sm:text-[2.8rem]">Pertanyaan yang sering muncul</h2>
          <p className="mt-4 text-ink-soft">Belum menemukan jawabannya? Kami bantu lewat halaman Bantuan.</p>
        </div>

        <div className="mt-14 grid gap-x-12 border-t border-ink/15 md:grid-cols-2">
          {columns.map((col, c) => (
            <div key={c}>
              {col.map(([q, a]) => (
                <details key={q} className="group border-b border-ink/15">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-5 text-[1.02rem] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {q}
                    <Plus className="mt-1 size-4 shrink-0 text-ink-muted transition-transform duration-200 group-open:rotate-45 group-open:text-sigap-ink" aria-hidden />
                  </summary>
                  <p className="pr-10 pb-6 leading-relaxed text-ink-soft">{a}</p>
                </details>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/bantuan" className="font-mono-ui inline-flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-[0.75rem] text-paper transition-colors hover:bg-ink/85">
            Buka halaman Bantuan <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </Container>
    </section>
  );
}
