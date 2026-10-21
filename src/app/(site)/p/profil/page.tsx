import type { Metadata } from "next";
import { Suspense } from "react";
import { ChangePassword } from "@/components/account/change-password";
import { EmailPrefCard } from "@/components/account/email-pref-card";
import { SeekerProfileForm } from "@/components/seeker/profile-form";
import { Container, PageHeader, PageSkeleton } from "@/components/ui";
import { PhoneOtp } from "@/components/verify/phone-otp";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profil organisasi" };

export default function SeekerProfilePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Profile />
      </Suspense>
  );
}

async function Profile() {
  const viewer = await requireViewer("seeker");
  const supabase = await createServerSupabase();
  const [{ data: seeker }, master, { data: prefs }] = await Promise.all([
    supabase.from("seekers").select("*").eq("id", viewer.id).single(),
    getMasterData(),
    supabase.from("profiles").select("email_notifications").eq("id", viewer.id).single(),
  ]);
  return (
    <Container className="max-w-3xl py-8">
      <PageHeader title="Profil organisasi" description="Tampil di halaman publik dan setiap panggilanmu." />
      <section className="panel mb-6 p-5">
        <h2 className="font-semibold">Nomor HP penanggung jawab</h2>
        <p className="mb-3 text-sm text-ink-soft">Wajib terverifikasi sebelum mempublikasikan panggilan. Dibagikan ke relawan setelah diterima.</p>
        <PhoneOtp phone={viewer.phone} verified={viewer.phoneVerified} />
      </section>
      <SeekerProfileForm seeker={seeker} cities={master.cities} userId={viewer.id} />
      <div className="mt-6 space-y-6">
        <EmailPrefCard initial={prefs?.email_notifications ?? true} email={viewer.email} />
        <ChangePassword />
      </div>
    </Container>
  );
}
