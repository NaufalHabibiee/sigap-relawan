import { cacheLife, cacheTag } from "next/cache";
import { BadgeCheck, CheckCircle2, MapPin, Sparkles } from "lucide-react";
import { getEmergencyCalls, getFeed, getHeroPeople, getPlatformStats } from "@/lib/data";
import { LiveFeed } from "./live-feed";
import { Avatar } from "./ui";

const CARD = "rounded-2xl border border-white bg-white shadow-[0_22px_45px_-22px_rgba(27,36,48,0.5)]";

/**
 * The live feed shown as a tilted device, with product moments floating in front of it.
 * Everything here avoids blur filters: they repaint on every animation frame and made the hero sluggish.
 */
export async function HeroVisual() {
  "use cache";
  cacheLife("minutes");
  cacheTag("calls", "profiles");
  const [feed, emergency, people, stats] = await Promise.all([getFeed(), getEmergencyCalls(), getHeroPeople(), getPlatformStats()]);
  const spotlight = emergency[0] ?? feed[0];
  const others = Math.max(0, stats.volunteers - people.volunteers.length);

  return (
    <div className="relative mx-auto w-full max-w-[34rem] pt-4 pb-24 lg:mr-0 lg:[perspective:1800px]">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-16 -z-10 bg-[radial-gradient(closest-side_at_70%_25%,rgba(232,98,44,0.22),transparent),radial-gradient(closest-side_at_20%_80%,rgba(31,111,92,0.18),transparent)]"
      />

      {/* Device frame: a light bezel around the dark feed, angled like a tablet on a desk */}
      <div className="rounded-[30px] border border-white bg-white/80 p-2.5 shadow-[0_50px_80px_-40px_rgba(27,36,48,0.6),0_18px_30px_-20px_rgba(27,36,48,0.35)] lg:[transform:rotateY(-18deg)_rotateX(8deg)_rotateZ(1.5deg)]">
        <LiveFeed />
      </div>

      {spotlight && (
        <div className={`hero-float absolute top-2 -left-1 w-64 p-4 sm:-left-4 ${CARD}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-sigap-ink">
              <Sparkles className="size-3.5" aria-hidden /> Kecocokan baru
            </span>
            <span className="rounded-full bg-sigap-ink px-2 py-0.5 font-display text-xs font-bold text-white">92%</span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-snug font-semibold text-ink">{spotlight.title}</p>
          <p className="mt-1 inline-flex items-center gap-1 text-xs text-guyub-deep">
            <MapPin className="size-3" aria-hidden /> 3 skill cocok · 12 km · sesuai minat
          </p>
        </div>
      )}

      <div className={`hero-float absolute top-1/2 -right-4 hidden items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-guyub-deep [animation-delay:-2s] sm:inline-flex ${CARD}`}>
        <BadgeCheck className="size-4" aria-hidden /> Identitas terverifikasi
      </div>

      <div className={`hero-float-slow absolute right-6 bottom-6 flex items-center gap-3 py-3 pr-4 pl-3 sm:right-10 ${CARD}`}>
        <div className="flex -space-x-2.5">
          {people.volunteers.slice(0, 4).map((v, i) => (
            <Avatar key={i} src={v.avatar_url} name={v.nickname ?? "?"} size={34} className="ring-2 ring-white" />
          ))}
        </div>
        <div>
          <p className="flex items-center gap-1 text-sm font-semibold text-ink">
            <CheckCircle2 className="size-4 text-guyub" aria-hidden /> Undangan diterima
          </p>
          <p className="text-xs text-ink-muted">+{others} relawan siap bergerak</p>
        </div>
      </div>
    </div>
  );
}
