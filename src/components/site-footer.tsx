import Link from "next/link";
import { cacheLife, cacheTag } from "next/cache";
import { ArrowRight, Building2, HandHeart, Mail, MapPin, ShieldCheck } from "lucide-react";
import { getPlatformStats } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import { Logo } from "./ui";

const COLS: { title: string; links: [string, string][] }[] = [
  {
    title: "Relawan",
    links: [
      ["/panggilan", "Jelajah panggilan"],
      ["/panggilan?darurat=1", "Panggilan darurat"],
      ["/daftar?peran=relawan", "Daftar jadi relawan"],
      ["/masuk", "Masuk"],
    ],
  },
  {
    title: "Penyelenggara",
    links: [
      ["/daftar?peran=penyelenggara", "Cari relawan"],
      ["/#cara-kerja", "Cara kerja"],
      ["/p/verifikasi", "Verifikasi organisasi"],
    ],
  },
  {
    title: "Sigap",
    links: [
      ["/tentang", "Tentang"],
      ["/bantuan", "Bantuan"],
      ["/kebijakan-privasi", "Kebijakan privasi"],
      ["/syarat", "Syarat penggunaan"],
    ],
  },
];

export async function SiteFooter() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls");
  const stats = await getPlatformStats();

  return (
    <footer className="relative z-10 overflow-hidden rounded-t-[2.75rem] bg-[linear-gradient(180deg,#3a2117_0%,#2a1811_55%,#1f120d_100%)] text-paper sm:rounded-t-[3.5rem]">
      {/* Warm espresso tone from the Sigap orange family, with one soft ember glow behind the call to action. */}
      <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 h-[26rem] w-[60rem] -translate-x-1/2 rounded-full bg-sigap/15 blur-3xl" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pt-16 sm:px-6">
        {/* Closing call to action */}
        <div className="grid gap-8 rounded-[2rem] border border-paper/10 bg-paper/[0.04] p-6 backdrop-blur sm:p-10 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-paper/10 px-3 py-1 text-sm text-paper/80">
              <span className="live-dot inline-block size-2 rounded-full bg-sigap" aria-hidden />
              {formatNumber(stats.active_calls)} panggilan aktif · {formatNumber(stats.volunteers)} relawan siap
            </p>
            <h2 className="h-section mt-4 text-3xl sm:text-4xl">
              Siap bergerak <span className="text-sigap">hari ini?</span>
            </h2>
            <p className="mt-3 max-w-md text-paper/70">Satu profil untuk semua panggilan. Gratis, tanpa biaya pendaftaran.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <Link href="/daftar?peran=relawan" className="group flex items-center gap-4 rounded-2xl bg-sigap-ink p-4 transition-colors hover:bg-[#a8421a]">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
                <HandHeart className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Jadi relawan</span>
                <span className="block text-sm text-white/75">Buat profil dalam 10 menit</span>
              </span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link href="/daftar?peran=penyelenggara" className="group flex items-center gap-4 rounded-2xl bg-paper p-4 text-ink transition-colors hover:bg-white">
              <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-ink text-paper">
                <Building2 className="size-5" aria-hidden />
              </span>
              <span className="flex-1">
                <span className="block font-semibold">Cari relawan</span>
                <span className="block text-sm text-ink-muted">Untuk lembaga, komunitas, perusahaan</span>
              </span>
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Links */}
        <div className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-paper/70">
              Mempertemukan orang yang ingin membantu dengan mereka yang membutuhkan bantuan, di seluruh Indonesia.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-paper/70">
              <li className="flex items-center gap-2">
                <MapPin className="size-4 text-sigap" aria-hidden /> Indonesia
              </li>
              <li className="flex items-center gap-2">
                <Mail className="size-4 text-sigap" aria-hidden /> halo@sigap.id
              </li>
            </ul>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <p className="text-sm font-semibold">{col.title}</p>
              <ul className="mt-4 space-y-2.5 text-sm text-paper/65">
                {col.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="inline-block transition-transform duration-200 hover:translate-x-1 hover:text-paper">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-4 border-t border-paper/10 py-6 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-2 rounded-full bg-paper/5 px-3 py-1.5 text-paper/70">
            <ShieldCheck className="size-4 text-guyub-wash" aria-hidden />
            Sigap tidak pernah meminta biaya. Laporkan permintaan transfer uang.
          </p>
          <p>© 2026 Sigap (nama kerja) · Data demo ditandai “Contoh”.</p>
        </div>
      </div>
    </footer>
  );
}
