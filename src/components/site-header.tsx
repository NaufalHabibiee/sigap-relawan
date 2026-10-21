import Link from "next/link";
import { Suspense } from "react";
import { Search } from "lucide-react";
import { getViewer, homeFor } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { NotificationBell } from "./notification-bell";
import { ScrollHeader } from "./scroll-header";
import { UserMenu } from "./user-menu";
import { Logo } from "./ui";

export function SiteHeader() {
  return (
    <ScrollHeader>
      <div className="mx-auto grid h-16 w-full max-w-6xl grid-cols-[1fr_auto] items-center gap-6 px-4 sm:px-6 md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" aria-label="Sigap — beranda" className="justify-self-start">
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-ink-soft md:flex" aria-label="Utama">
          <Link href="/panggilan" className="rounded-full px-4 py-2 transition-colors hover:bg-ink/5 hover:text-ink">
            Jelajah panggilan
          </Link>
          <Link href="/#cara-kerja" className="rounded-full px-4 py-2 transition-colors hover:bg-ink/5 hover:text-ink">
            Cara kerja
          </Link>
          <Link href="/#penyelenggara" className="rounded-full px-4 py-2 transition-colors hover:bg-ink/5 hover:text-ink">
            Untuk penyelenggara
          </Link>
        </nav>
        <div className="flex items-center justify-self-end gap-2">
          <Link href="/panggilan" className="inline-flex size-9 items-center justify-center rounded-full hover:bg-ink/5 md:hidden" aria-label="Jelajah panggilan">
            <Search className="size-5" aria-hidden />
          </Link>
          <Suspense fallback={<div className="h-9 w-40" />}>
            <UserArea />
          </Suspense>
        </div>
      </div>
    </ScrollHeader>
  );
}

async function UserArea() {
  const viewer = await getViewer();
  if (!viewer) {
    return (
      <>
        <Link href="/masuk" className="btn btn-ghost btn-sm">
          Masuk
        </Link>
        <Link href="/daftar" className="btn btn-ink btn-sm">
          Daftar
        </Link>
      </>
    );
  }
  const supabase = await createServerSupabase();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", viewer.id)
    .is("read_at", null);
  return (
    <>
      <Link href={homeFor(viewer.role)} className="btn btn-ghost btn-sm hidden sm:inline-flex">
        Dasbor
      </Link>
      <NotificationBell userId={viewer.id} initialUnread={count ?? 0} />
      <UserMenu
        name={viewer.name}
        avatar={viewer.avatar}
        role={viewer.role}
        publicHref={viewer.slug ? (viewer.role === "volunteer" ? `/relawan/${viewer.slug}` : `/penyelenggara/${viewer.slug}`) : null}
      />
    </>
  );
}
