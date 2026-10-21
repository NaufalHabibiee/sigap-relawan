import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { Container, LevelBadge, PageHeader, PageSkeleton } from "@/components/ui";
import { EmergencyForm } from "@/components/verify/emergency-form";
import { IdentityUpload } from "@/components/verify/identity-upload";
import { PhoneOtp } from "@/components/verify/phone-otp";
import { requireViewer } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getMyVolunteer, missingForLevel1 } from "@/lib/volunteer-data";

export const metadata: Metadata = { title: "Verifikasi relawan" };

export default function VerifyPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Verify />
      </Suspense>
  );
}

async function Verify() {
  const viewer = await requireViewer("volunteer");
  const me = await getMyVolunteer(viewer.id);
  const missing = missingForLevel1(me).filter((m) => m.step !== 0);
  const v = me.verification;

  return (
    <Container className="max-w-3xl py-8">
      <PageHeader
        title="Verifikasi"
        description="Level menentukan panggilan yang bisa kamu lamar. Ringan, Promosi, dan Sedang cukup Level 1. Berat dan Darurat butuh Level 2."
        actions={<LevelBadge level={me.verification_level} />}
      />
      <div className="space-y-6">
        <Step done={me.phone_verified} title="Nomor HP" body="Dipakai penyelenggara menghubungimu setelah kamu diterima.">
          <PhoneOtp phone={me.phone} verified={me.phone_verified} />
        </Step>
        <Step
          done={missing.length === 0}
          title="Profil lengkap"
          body={missing.length ? `Masih kurang: ${missing.map((m) => m.label.toLowerCase()).join(", ")}.` : "Data diri, skill, minat, dan waktu luang sudah terisi."}
        />
        <Step done={Boolean(me.emergency)} title="Kontak darurat" body="Wajib untuk Level 2.">
          <EmergencyForm initial={me.emergency} />
        </Step>
        <Step done={v?.status === "approved"} title="Identitas (KTP)" body="Wajib untuk Level 2. Ditinjau admin maksimal 1×24 jam.">
          {v?.status === "approved" ? (
            <p className="text-sm text-guyub-deep">Disetujui {formatDate(v.created_at)}.</p>
          ) : v?.status === "pending" ? (
            <p className="rounded-lg bg-ladang-wash px-3 py-2 text-sm">Sedang ditinjau sejak {formatDate(v.created_at)}.</p>
          ) : (
            <>
              {v?.status === "rejected" && <p className="mb-3 rounded-lg bg-danger-wash px-3 py-2 text-sm text-danger">Pengajuan sebelumnya ditolak: {v.reason}</p>}
              <IdentityUpload
                userId={viewer.id}
                askNik
                disabledReason={!me.emergency ? "Isi kontak darurat terlebih dahulu." : undefined}
                slots={[
                  { key: "ktp", label: "Foto KTP", hint: "Pastikan tulisan terbaca jelas.", folder: "ktp" },
                  { key: "selfie", label: "Selfie memegang KTP", hint: "Wajah dan KTP terlihat dalam satu foto.", folder: "ktp" },
                ]}
              />
            </>
          )}
        </Step>
      </div>
    </Container>
  );
}

function Step({ done, title, body, children }: { done: boolean; title: string; body: string; children?: ReactNode }) {
  return (
    <section className="panel p-5 sm:p-6">
      <div className="flex gap-3">
        {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-guyub" aria-label="Selesai" /> : <Circle className="mt-0.5 size-5 shrink-0 text-ink-muted" aria-label="Belum" />}
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{title}</h2>
          <p className="text-sm text-ink-soft">{body}</p>
          {children && <div className="mt-4">{children}</div>}
        </div>
      </div>
    </section>
  );
}
