import { Suspense } from "react";
import { getViewer } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { DashFrame } from "./dash-nav";
import { NotificationBell } from "./notification-bell";
import { UserMenu } from "./user-menu";

type Role = "volunteer" | "seeker" | "admin";

/** Bell + user menu shown in the dashboard chrome, replacing the site header there. */
async function Account() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const supabase = await createServerSupabase();
  const { count } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", viewer.id).is("read_at", null);
  return (
    <>
      <NotificationBell userId={viewer.id} initialUnread={count ?? 0} />
      <UserMenu
        name={viewer.name}
        avatar={viewer.avatar}
        role={viewer.role}
        publicHref={viewer.slug ? (viewer.role === "volunteer" ? `/relawan/${viewer.slug}` : `/penyelenggara/${viewer.slug}`) : null}
        menuClassName="right-0 mt-2 lg:right-auto lg:bottom-full lg:left-0 lg:mt-0 lg:mb-2"
        labelClassName="hidden lg:inline"
      />
    </>
  );
}

/** Wraps dashboard pages with the sidebar chrome; pages keep their own inner Container/Suspense untouched. */
export function DashShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <DashFrame
      role={role}
      account={
        <Suspense fallback={<div className="h-9 w-24" />}>
          <Account />
        </Suspense>
      }
    >
      {children}
    </DashFrame>
  );
}
