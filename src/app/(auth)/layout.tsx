import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui";

/** Fixed to the viewport: the page itself never scrolls; only the form pane scrolls as a last resort on very short screens. */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid h-dvh overflow-hidden lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden overflow-hidden bg-ink p-10 text-paper lg:flex lg:flex-col xl:p-14">
        {/* Background: flat ink, the brand chevron repeated like reflective tape, and a fine grid that fades out. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(238,236,229,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(238,236,229,0.05)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(70%_60%_at_50%_45%,black,transparent)]"
        />
        <svg aria-hidden viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full">
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              d={`M-60 ${200 + i * 78} L300 ${420 + i * 78} L660 ${200 + i * 78}`}
              fill="none"
              stroke="#e8622c"
              strokeWidth={i === 0 ? 40 : 34}
              strokeLinejoin="round"
              opacity={[1, 0.5, 0.26, 0.13, 0.06][i]}
            />
          ))}
          <path d="M-60 160 L300 380 L660 160" fill="none" stroke="#eeece5" strokeOpacity=".16" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M-60 590 L300 810 L660 590" fill="none" stroke="#eeece5" strokeOpacity=".08" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>

        <Link href="/" aria-label="Sigap — beranda" className="relative text-paper">
          <Logo />
        </Link>

      </aside>

      <main className="flex min-h-0 flex-col overflow-y-auto px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Sigap — beranda" className="lg:hidden">
            <Logo />
          </Link>
          <Link href="/" className="ml-auto inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink lg:ml-0">
            <ArrowLeft className="size-4" aria-hidden /> Kembali ke beranda
          </Link>
        </div>
        <div className="auth-scope mx-auto my-auto w-full max-w-md py-4">{children}</div>
      </main>
    </div>
  );
}
