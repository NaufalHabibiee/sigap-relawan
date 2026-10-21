"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  HandHeart,
  HeartPulse,
  Landmark,
  Laptop,
  Leaf,
  type LucideIcon,
  Megaphone,
  Palette,
  PawPrint,
  Siren,
  Sparkles,
} from "lucide-react";

const INTERVAL_MS = 2000;
const SCALES = [1, 0.82, 0.68, 0.6];
const GAP = 18;

const ICONS: Record<string, LucideIcon> = {
  kebencanaan: Siren,
  pendidikan: GraduationCap,
  kesehatan: HeartPulse,
  lingkungan: Leaf,
  sosial: HandHeart,
  acara: CalendarDays,
  kreatif: Palette,
  digital: Laptop,
  promosi: Megaphone,
  keagamaan: Landmark,
  hewan: PawPrint,
  lainnya: Sparkles,
};

const TONES = ["bg-sigap-ink", "bg-ink", "bg-guyub", "bg-ink"];

type Item = { slug: string; name: string; count: number };

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = matchMedia(REDUCED);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export function CategoryCarousel({ items }: { items: Item[] }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);
  const [cardW, setCardW] = useState(256);
  const reduced = useSyncExternalStore(subscribeReducedMotion, () => matchMedia(REDUCED).matches, () => false);
  const ref = useRef<HTMLDivElement>(null);
  const n = items.length;

  const go = useCallback((delta: number) => setActive((a) => (a + delta + n) % n), [n]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setCardW(e.contentRect.width < 640 ? 240 : 256));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Only tick while the carousel is actually on screen and the tab is in the foreground.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.15 });
    io.observe(el);
    const onVis = () => setTabVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  useEffect(() => {
    if (paused || reduced || n < 2 || !onScreen || !tabVisible) return;
    const t = setInterval(() => go(1), INTERVAL_MS);
    return () => clearInterval(t);
  }, [paused, reduced, go, n, onScreen, tabVisible]);

  // Shortest circular distance, so cards wrap around instead of sliding across the whole row.
  const offsetOf = (i: number) => {
    let d = i - active;
    if (d > n / 2) d -= n;
    if (d < -n / 2) d += n;
    return d;
  };

  // Centre-to-centre distance so that scaled neighbours keep an even gap.
  const xOf = (d: number) => {
    const sign = Math.sign(d);
    let x = 0;
    for (let k = 0; k < Math.abs(d); k++) x += (cardW * SCALES[Math.min(k, 3)] + cardW * SCALES[Math.min(k + 1, 3)]) / 2 + GAP;
    return sign * x;
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Bidang relawan"
    >
      <div ref={ref} className="relative h-[24rem] overflow-x-clip sm:h-[26rem]">
        {items.map((item, i) => {
          const d = offsetOf(i);
          const abs = Math.abs(d);
          const visible = abs <= 2;
          const Icon = ICONS[item.slug] ?? Sparkles;
          const scale = SCALES[Math.min(abs, 3)];
          const center = d === 0;
          return (
            <div
              key={item.slug}
              className="absolute top-1/2 left-1/2 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [will-change:transform,opacity]"
              style={{
                transform: `translate(-50%, -50%) translateX(${xOf(d)}px) scale(${scale})`,
                zIndex: 10 - abs,
                opacity: visible ? 1 : 0,
                pointerEvents: visible ? "auto" : "none",
              }}
              aria-hidden={!visible || undefined}
            >
              <Link
                href={`/panggilan?kategori=${item.slug}`}
                tabIndex={visible ? undefined : -1}
                onClick={(e) => {
                  if (!center) {
                    e.preventDefault();
                    setActive(i);
                  }
                }}
                className={`group relative flex h-[21rem] w-[15rem] flex-col justify-between overflow-hidden rounded-[2rem] p-6 text-white shadow-[0_30px_60px_-30px_rgba(27,36,48,0.7)] sm:h-[23rem] sm:w-[16rem] ${TONES[i % TONES.length]}`}
              >
                <Icon aria-hidden className="absolute -top-6 -right-10 size-40 text-white/[0.07] transition-transform duration-700 group-hover:rotate-6" />
                <div aria-hidden className="absolute -top-14 -left-10 size-40 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.16),transparent)]" />
                <span className="relative inline-flex size-14 items-center justify-center rounded-2xl bg-white/15">
                  <Icon className="size-7" aria-hidden />
                </span>
                <div className="relative">
                  <p className="text-sm text-white/70">{item.count ? `${item.count} panggilan terbuka` : "Belum ada panggilan"}</p>
                  <p className="mt-1 font-display text-2xl leading-tight font-bold">{item.name}</p>
                  <span
                    className={`mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition-opacity duration-500 ${center ? "opacity-100" : "opacity-0"}`}
                  >
                    Lihat panggilan <ArrowRight className="size-4" aria-hidden />
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(-1)} className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-ink hover:text-paper" aria-label="Sebelumnya">
          <ChevronLeft className="size-5" />
        </button>
        <div className="flex items-center gap-2.5">
          {items.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              onClick={() => setActive(i)}
              aria-label={item.name}
              aria-current={i === active || undefined}
              className={`h-2 w-2 rounded-full transition-[transform,background-color] duration-500 ${i === active ? "scale-x-[2.4] bg-sigap-ink" : "bg-line-strong hover:bg-ink-muted"}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => go(1)} className="inline-flex size-10 items-center justify-center rounded-full bg-white shadow-sm hover:bg-ink hover:text-paper" aria-label="Berikutnya">
          <ChevronRight className="size-5" />
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {items[active]?.name}
      </p>
    </div>
  );
}
