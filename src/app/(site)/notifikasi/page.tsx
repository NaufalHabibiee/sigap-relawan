import type { Metadata } from "next";
import { Suspense } from "react";
import { Bell, CheckCheck, MessageSquare, ShieldCheck, Siren, Sparkles, Star, UserPlus } from "lucide-react";
import { MarkAllRead } from "@/components/mark-all-read";
import { Container, EmptyState, PageHeader, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { timeAgo } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { Notification } from "@/lib/types";

export const metadata: Metadata = { title: "Notifikasi" };

const ICONS: Record<string, React.ReactNode> = {
  match: <Sparkles className="size-5 text-sigap-ink" />,
  invite: <UserPlus className="size-5 text-sigap-ink" />,
  message: <MessageSquare className="size-5" />,
  announcement: <Siren className="size-5 text-sigap-ink" />,
  review: <Star className="size-5 text-ladang" />,
  review_request: <Star className="size-5 text-ladang" />,
  verification: <ShieldCheck className="size-5 text-guyub" />,
  app_accepted: <CheckCheck className="size-5 text-guyub" />,
  invite_accepted: <CheckCheck className="size-5 text-guyub" />,
};

export default function NotificationsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Notifications />
    </Suspense>
  );
}

async function Notifications() {
  const viewer = await requireViewer();
  const supabase = await createServerSupabase();
  const { data } = await supabase.from("notifications").select("*").eq("user_id", viewer.id).order("created_at", { ascending: false }).limit(100);
  const items = (data ?? []) as Notification[];
  const unread = items.filter((n) => !n.read_at).length;
  return (
    <Container className="max-w-3xl py-8">
      <PageHeader title="Notifikasi" description={unread ? `${unread} belum dibaca` : "Semua sudah dibaca"} actions={unread > 0 ? <MarkAllRead /> : undefined} />
        {items.length === 0 ? (
          <EmptyState icon={Bell} title="Belum ada notifikasi" body="Notifikasi kecocokan, undangan, dan pesan akan muncul di sini." />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
            {items.map((n) => (
              <li key={n.id}>
                <a href={`/notifikasi/buka/${n.id}`} className={`flex gap-3 px-4 py-3.5 hover:bg-ink/[0.03] sm:px-5 ${n.read_at ? "" : "bg-sigap-wash/30"}`}>
                  <span className="mt-0.5 shrink-0" aria-hidden>
                    {ICONS[n.type] ?? <Bell className="size-5 text-ink-muted" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${n.read_at ? "font-medium" : "font-bold"}`}>{n.title}</span>
                    {n.body && <span className="block text-sm text-ink-soft">{n.body}</span>}
                    <span className="mt-0.5 block text-xs text-ink-muted">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="mt-2 size-2 shrink-0 rounded-full bg-sigap" aria-label="Belum dibaca" />}
                </a>
              </li>
            ))}
          </ul>
        )}
    </Container>
  );
}
