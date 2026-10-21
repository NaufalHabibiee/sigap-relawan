import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangePassword } from "@/components/account/change-password";
import { EmailPrefCard } from "@/components/account/email-pref-card";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { SettingsForm } from "@/components/volunteer/settings-form";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";
import { todayJakarta } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyVolunteer } from "@/lib/volunteer-data";

export const metadata: Metadata = { title: "Pengaturan" };

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Settings />
      </Suspense>
  );
}

async function Settings() {
  const viewer = await requireViewer("volunteer");
  const supabase = await createServerSupabase();
  const [me, master, { data: prefs }] = await Promise.all([
    getMyVolunteer(viewer.id),
    getMasterData(),
    supabase.from("profiles").select("email_notifications").eq("id", viewer.id).single(),
  ]);
  const paused = me.paused_until && me.paused_until >= todayJakarta() ? me.paused_until : null;
  return (
    <Container className="max-w-3xl py-8">
      <PageHeader title="Pengaturan notifikasi" description="Atur kapan dan untuk bidang apa kamu ingin dikabari." />
      <div className="space-y-6">
        <EmailPrefCard initial={prefs?.email_notifications ?? true} email={viewer.email} />
        <SettingsForm categories={master.categories} muted={me.muted_categories} pausedUntil={paused} standby={me.emergency_standby} email={viewer.email} />
        <ChangePassword />
      </div>
    </Container>
  );
}
