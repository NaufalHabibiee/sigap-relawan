"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";

export function NotificationBell({ userId, initialUnread }: { userId: string; initialUnread: number }) {
  const [unread, setUnread] = useState(initialUnread);
  const [seen, setSeen] = useState(initialUnread);
  if (seen !== initialUnread) {
    setSeen(initialUnread);
    setUnread(initialUnread);
  }

  useEffect(() => {
    let cancelled = false;
    let stop = () => {};
    // supabase-js is loaded only when a signed-in user actually renders the bell.
    import("@/lib/supabase/browser").then(({ createBrowserSupabase }) => {
      if (cancelled) return;
      const supabase = createBrowserSupabase();
      const channel = supabase
      .channel(`notif:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as { title: string; body: string | null; link: string | null; type: string };
          setUnread((c) => c + 1);
          // Chat pings are shown inside the open thread; don't double-toast them there.
          if (n.type === "message" && n.link && window.location.pathname === n.link) return;
          toast(n.title, {
            description: n.body ?? undefined,
            action: n.link ? { label: "Buka", onClick: () => (window.location.href = n.link!) } : undefined,
          });
        },
      )
      .subscribe();
      stop = () => void supabase.removeChannel(channel);
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [userId]);

  return (
    <Link
      href="/notifikasi"
      className="relative inline-flex size-9 items-center justify-center rounded-full hover:bg-ink/5"
      aria-label={unread > 0 ? `Notifikasi, ${unread} belum dibaca` : "Notifikasi"}
    >
      <Bell className="size-5" aria-hidden />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 inline-flex min-w-5 items-center justify-center rounded-full bg-sigap-ink px-1 text-[11px] leading-5 font-bold text-white">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
