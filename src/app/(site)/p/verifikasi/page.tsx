import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageHeader, PageSkeleton, VerifiedMark } from "@/components/ui";
import { IdentityUpload } from "@/components/verify/identity-upload";
import { PhoneOtp } from "@/components/verify/phone-otp";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Verifikasi penyelenggara" };

export default function SeekerVerifyPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Verify />
      </Suspense>
  );
}

async function Verify() {
  const viewer = await requireViewer("seeker");
  const supabase = await createServerSupabase();
  const { data: v } = await supabase
    .from("verification_requests")
    .select("status, reason, created_at")
    .eq("user_id", viewer.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (
    <Container className="max-w-3xl py-8">
      <PageHeader
        title="Verifikasi penyelenggara"
        description="Penyelenggara terverifikasi mendapat badge dan bisa membuka panggilan Berat serta Darurat."
        actions={viewer.verified ? <VerifiedMark /> : undefined}
      />
      <div className="space-y-6">
        <section className="panel p-5">
          <h2 className="font-semibold">Nomor HP</h2>
          <div className="mt-3">
            <PhoneOtp phone={viewer.phone} verified={viewer.phoneVerified} />
          </div>
        </section>
        <section className="panel p-5">
          <h2 className="font-semibold">Dokumen legalitas</h2>
          <p className="text-sm text-ink-soft">
            Perusahaan: NIB atau akta. Lembaga: SK/akta yayasan. Komunitas: surat keterangan dari kelurahan/RT. Individu dan campaign: KTP penanggung jawab.
          </p>
          <div className="mt-4">
            {viewer.verified ? (
              <p className="text-sm text-guyub-deep">Organisasimu sudah terverifikasi.</p>
            ) : v?.status === "pending" ? (
              <p className="rounded-lg bg-ladang-wash px-3 py-2 text-sm">Sedang ditinjau sejak {formatDate(v.created_at)}.</p>
            ) : (
              <>
                {v?.status === "rejected" && <p className="mb-3 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">Ditolak: {v.reason}</p>}
                <IdentityUpload
                  userId={viewer.id}
                  askNik={false}
                  slots={[
                    { key: "doc", label: "Dokumen legalitas", hint: "PDF atau foto, maks 5 MB.", folder: "legal" },
                    { key: "pic", label: "KTP penanggung jawab", hint: "Foto KTP PIC.", folder: "legal" },
                  ]}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </Container>
  );
}
