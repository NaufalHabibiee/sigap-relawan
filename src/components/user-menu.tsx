"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@/lib/types";
import { Avatar } from "./ui";

export function UserMenu({
  name,
  avatar,
  role,
  publicHref,
  menuClassName = "right-0 mt-2",
  labelClassName = "hidden sm:inline",
}: {
  name: string;
  avatar: string | null;
  role: Role;
  publicHref: string | null;
  menuClassName?: string;
  labelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    const { createBrowserSupabase } = await import("@/lib/supabase/browser");
    await createBrowserSupabase().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const links: { href: string; label: string }[] =
    role === "volunteer"
      ? [
          { href: "/r", label: "Dasbor relawan" },
          { href: "/r/lamaran", label: "Kegiatanku" },
          { href: "/pesan", label: "Pesan" },
          { href: "/r/profil", label: "Ubah profil" },
          { href: "/r/verifikasi", label: "Verifikasi" },
          { href: "/r/tersimpan", label: "Tersimpan" },
          { href: "/r/pengaturan", label: "Pengaturan" },
        ]
      : role === "seeker"
        ? [
            { href: "/p", label: "Dasbor penyelenggara" },
            { href: "/p/panggilan/baru", label: "Buat panggilan" },
            { href: "/pesan", label: "Pesan" },
            { href: "/p/profil", label: "Profil organisasi" },
          ]
        : [
            { href: "/admin", label: "Panel admin" },
            { href: "/admin/master", label: "Master data" },
            { href: "/admin/pengumuman", label: "Pengumuman" },
          ];
  if (publicHref) links.push({ href: publicHref, label: "Lihat profil publik" });

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2 rounded-full p-0.5 pr-0.5 hover:bg-ink/5 sm:pr-3"
      >
        <Avatar src={avatar} name={name} size={32} square={role === "seeker"} />
        <span className={`max-w-32 truncate text-sm font-medium ${labelClassName}`}>{name}</span>
      </button>
      {open && (
        <div role="menu" className={`absolute ${menuClassName} w-56 rounded-xl border border-line bg-surface p-1.5 shadow-[0_16px_40px_-20px_rgba(27,36,48,0.45)]`}>
          {links.map((l) => (
            <Link key={l.href} href={l.href} role="menuitem" onClick={() => setOpen(false)} className="block rounded-lg px-3 py-2 text-sm hover:bg-ink/5">
              {l.label}
            </Link>
          ))}
          <hr className="my-1 border-line" />
          <button type="button" role="menuitem" onClick={signOut} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger-wash">
            Keluar
          </button>
        </div>
      )}
    </div>
  );
}
