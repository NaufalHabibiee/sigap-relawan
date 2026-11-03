"use client";

import { Children, useEffect, useRef, type ReactNode } from "react";

const CARD = 176; // 11rem
const GAP = 18;

/**
 * Cards drift left to right along a concave curve: the ones near the edges turn toward
 * the centre and come closer, like a ring seen from inside. Pauses on hover/focus.
 */
export function CurvedMarquee({ children }: { children: ReactNode }) {
  const items = Children.toArray(children);
  const wrap = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const paused = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let offset = 0; // radians
    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      const dt = Math.min(64, now - last);
      last = now;
      const width = wrap.current?.clientWidth ?? 1200;
      // Cylinder seen from inside: radius follows the viewport so ~7 cards fit across.
      const R = Math.max(420, width * 0.44);
      const stepA = (CARD + GAP) / R;
      const totalA = items.length * stepA;
      if (!paused.current && !reduce) offset = (offset + dt * 0.00009) % totalA;
      const maxA = Math.min(1.35, totalA / 2);
      refs.current.forEach((el, i) => {
        if (!el) return;
        let t = (i * stepA + offset) % totalA;
        if (t > totalA / 2) t -= totalA;
        const x = R * Math.sin(t);
        const z = R * (1 - Math.cos(t)) * 0.3; // edges come toward the viewer
        const deg = (-t * 180) / Math.PI; // face the centre
        const a = Math.abs(t) / maxA;
        el.style.transform = `translate3d(${x - CARD / 2}px, 0, ${z}px) rotateY(${deg}deg)`;
        el.style.opacity = String(a > 0.88 ? Math.max(0, 1 - (a - 0.88) * 8) : 1);
        el.style.zIndex = String(100 - Math.round(a * 50));
      });
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [items.length]);

  return (
    <div
      ref={wrap}
      className="relative h-[16rem] w-full [perspective:1300px] [perspective-origin:50%_40%]"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
      onFocus={() => (paused.current = true)}
      onBlur={() => (paused.current = false)}
    >
      {items.map((child, i) => (
        <div
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className="absolute top-6 left-1/2 w-[11rem] will-change-transform [transform-style:preserve-3d]"
        >
          {child}
        </div>
      ))}
    </div>
  );
}
