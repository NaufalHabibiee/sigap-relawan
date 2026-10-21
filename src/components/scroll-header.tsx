"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Transparent at the top of the page, solid once the page is scrolled.
 * Toggles a data attribute directly instead of using state, so scrolling never re-renders the header.
 */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      el.dataset.scrolled = window.scrollY > 8 ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header
      ref={ref}
      data-scrolled="false"
      className="sticky top-0 z-40 border-b border-transparent bg-transparent transition-[background-color,border-color,box-shadow] duration-300 data-[scrolled=true]:border-line/80 data-[scrolled=true]:bg-paper/95 data-[scrolled=true]:shadow-[0_10px_30px_-24px_rgba(27,36,48,0.5)]"
    >
      {children}
    </header>
  );
}
