"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";

export type Step = { who: string; title: string; body: string; shot: string; alt: string; ai?: boolean };

/**
 * Sticky scroll: steps scroll on the left, a phone on the right swaps to the real
 * screen for the step in view. On small screens each step shows its own screen inline.
 */
export function HowItWorksSteps({ steps }: { steps: Step[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="mt-14 grid gap-12 lg:grid-cols-[1fr_minmax(0,22rem)] lg:gap-20">
      <ol className="relative">
        <span aria-hidden className="absolute top-2 bottom-2 left-[1.1rem] hidden w-px bg-ink/15 lg:block" />
        {steps.map((s, i) => (
          <li
            key={s.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            className="relative pb-14 lg:flex lg:min-h-[62vh] lg:items-center lg:pb-0"
          >
            <div className="lg:pl-16">
              <span
                aria-hidden
                className={`absolute top-0 left-0 hidden size-9 items-center justify-center rounded-full font-mono text-sm transition-colors duration-300 lg:top-1/2 lg:inline-flex lg:-translate-y-[5.5rem] ${
                  active === i ? "bg-sigap text-white" : "bg-paper text-ink-muted ring-1 ring-ink/15"
                }`}
              >
                {i + 1}
              </span>
              <p className="font-mono-ui flex items-center gap-3 text-[0.7rem] text-ink-muted">
                <span className="text-ink lg:hidden">{String(i + 1).padStart(2, "0")}</span>
                {s.who}
                {s.ai && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sigap-wash px-2 py-0.5 text-sigap-ink">
                    <Sparkles className="size-3" aria-hidden /> AI
                  </span>
                )}
              </p>
              <h3 className={`h-section mt-3 text-[1.9rem] transition-colors duration-300 sm:text-[2.3rem] ${active === i ? "text-ink" : "lg:text-ink/35"}`}>{s.title}</h3>
              <p className={`mt-3 max-w-md text-[1.02rem] leading-relaxed transition-colors duration-300 ${active === i ? "text-ink-soft" : "text-ink-soft lg:text-ink-soft/50"}`}>{s.body}</p>
              {/* Inline screen on phones and tablets */}
              <div className="mt-8 lg:hidden">
                <Phone src={s.shot} alt={s.alt} />
              </div>
            </div>
          </li>
        ))}
      </ol>

      {/* Sticky phone on desktop */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <div className="relative">
            {steps.map((s, i) => (
              <div key={s.shot} className={`transition-opacity duration-500 ${i === 0 ? "relative" : "absolute inset-0"} ${active === i ? "opacity-100" : "opacity-0"}`} aria-hidden={active !== i}>
                <Phone src={s.shot} alt={s.alt} priority={i === 0} />
              </div>
            ))}
          </div>
          <p className="font-mono-ui mt-4 text-center text-[0.65rem] text-ink-muted">Tampilan asli Sigap · data demo</p>
        </div>
      </div>
    </div>
  );
}

function Phone({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="mx-auto w-full max-w-[20rem] rounded-[2.6rem] bg-ink p-2.5 shadow-[0_40px_80px_-40px_rgba(27,36,48,0.7)]">
      <div className="relative aspect-[390/844] overflow-hidden rounded-[2.1rem] bg-paper">
        <Image src={src} alt={alt} fill sizes="320px" priority={priority} className="object-cover object-top" />
      </div>
    </div>
  );
}
