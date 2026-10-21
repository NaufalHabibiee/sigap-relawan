import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { CalendarClock, CalendarDays, Clock, Gift, MapPin, ShieldCheck, Users, Wifi } from "lucide-react";
import { ApplyPanel } from "@/components/call/apply-panel";
import { ReportButton } from "@/components/report-button";
import { SaveButton } from "@/components/call/save-button";
import { ShareButton } from "@/components/call/share-button";
import { AppStatusBadge, Avatar, CallStatusBadge, Container, LoadTag, ScoreBadge, Skeleton, VerifiedMark } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { BENEFITS, MODE_LABEL, SEEKER_TYPE_LABEL } from "@/lib/constants";
import { getCallBySlug } from "@/lib/data";
import { daysUntil, formatDate, formatDateRange, formatNumber, formatRupiah, formatTime, todayJakarta } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppStatus, CallDetail } from "@/lib/types";

export async function generateMetadata(props: PageProps<"/panggilan/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const call = await getCallBySlug(slug);
  if (!call) return { title: "Panggilan tidak ditemukan" };
  const where = call.mode === "online" ? "Online" : call.city?.name;
  return {
    title: call.title,
    description: `${call.seeker?.org_name} butuh ${call.quota} relawan · ${where} · ${formatDateRange(call.start_date, call.end_date)}`,
    openGraph: { title: call.title, description: call.description.slice(0, 160) },
  };
}

export default function CallPage(props: PageProps<"/panggilan/[slug]">) {
  return (
    <Suspense fallback={<CallSkeleton />}>
      <CallView params={props.params} />
    </Suspense>
  );
}

async function CallView({ params }: Pick<PageProps<"/panggilan/[slug]">, "params">) {
  const { slug } = await params;
  // Days-left uses the current time, so this view renders per request rather than being prerendered.
  await connection();
  const call = await getCallBySlug(slug);
  if (!call) notFound();

  const where = call.mode === "online" ? MODE_LABEL.online : [call.city?.name, call.city?.province].filter(Boolean).join(", ");
  const required = call.skills.filter((s) => s.required);
  const preferred = call.skills.filter((s) => !s.required);
  const benefitLabels = call.benefits.map((b) => BENEFITS.find((x) => x.value === b)?.label ?? b);
  const days = daysUntil(call.deadline);

  return (
    <Container className="py-8 lg:py-12">
      <nav className="mb-5 text-sm text-ink-muted" aria-label="Remah roti">
        <Link href="/panggilan" className="hover:underline">
          Jelajah panggilan
        </Link>
        {call.category && (
          <>
            {" / "}
            <Link href={`/panggilan?kategori=${call.category.slug}`} className="hover:underline">
              {call.category.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1fr_22rem]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <LoadTag load={call.load} />
            <CallStatusBadge status={call.status} />
            {call.is_emergency && <span className="text-sm font-semibold text-sigap-ink">Panggilan darurat</span>}
          </div>
          <h1 className="h-section mt-3 text-3xl sm:text-[2.6rem]">{call.title}</h1>
          {call.seeker && (
            <Link href={`/penyelenggara/${call.seeker.slug}`} className="mt-4 inline-flex items-center gap-3 rounded-full pr-3 hover:bg-ink/5">
              <Avatar src={call.seeker.logo_url} name={call.seeker.org_name} size={40} square />
              <span>
                <span className="flex items-center gap-1.5 font-semibold">
                  {call.seeker.org_name}
                  {call.seeker.verified && <VerifiedMark label="Penyelenggara terverifikasi" compact />}
                </span>
                <span className="block text-sm text-ink-muted">{SEEKER_TYPE_LABEL[call.seeker.type]}</span>
              </span>
            </Link>
          )}

          <div className="mt-5">
            <ShareButton title={call.title} text={`${call.seeker?.org_name ?? "Sigap"} butuh ${call.quota} relawan · ${where}`} />
          </div>

          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            <Fact icon={<CalendarDays />} label="Tanggal" value={formatDateRange(call.start_date, call.end_date)} />
            <Fact
              icon={<Clock />}
              label="Waktu"
              value={call.start_time ? `${formatTime(call.start_time)}${call.end_time ? `–${formatTime(call.end_time)}` : ""} WIB` : "Fleksibel"}
            />
            <Fact icon={call.mode === "online" ? <Wifi /> : <MapPin />} label="Lokasi" value={where} sub={call.mode !== "online" ? (call.address ?? undefined) : undefined} />
            <Fact icon={<Users />} label="Relawan" value={`${call.accepted_count} dari ${call.quota} sudah bergabung`} />
            <Fact
              icon={<CalendarClock />}
              label="Batas daftar"
              value={formatDate(call.deadline, { weekday: "long", day: "numeric", month: "long" })}
              sub={days >= 0 ? (days === 0 ? "Hari ini" : `${days} hari lagi`) : "Sudah lewat"}
            />
            <Fact
              icon={<Gift />}
              label="Yang didapat relawan"
              value={benefitLabels.length ? benefitLabels.join(", ") : "Tidak ada kompensasi"}
              sub={[
                call.allowance ? `Uang saku ${formatRupiah(call.allowance)}` : null,
                call.commission_pct ? `Komisi ${String(call.commission_pct).replace(".", ",")}%` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            />
          </dl>

          <section className="mt-10">
            <h2 className="h-section text-xl">Tugas relawan</h2>
            <div className="mt-3 max-w-[70ch] whitespace-pre-line text-ink-soft">{call.description}</div>
          </section>

          <section className="mt-10">
            <h2 className="h-section text-xl">Siapa yang dicari</h2>
            <div className="mt-4 space-y-5">
              <Requirement label="Level verifikasi">
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-guyub" aria-hidden />
                  {call.min_level >= 2 ? "Level 2 — identitas (KTP) terverifikasi dan kontak darurat terisi" : "Level 1 — profil lengkap dan nomor HP terverifikasi"}
                </span>
              </Requirement>
              {required.length > 0 && (
                <Requirement label="Skill wajib">
                  <Chips items={required.map((s) => s.skill.name)} strong />
                </Requirement>
              )}
              {preferred.length > 0 && (
                <Requirement label="Skill yang diutamakan">
                  <Chips items={preferred.map((s) => s.skill.name)} />
                </Requirement>
              )}
              {call.involves.length > 0 && (
                <Requirement label="Tugas ini melibatkan">
                  <Chips items={call.involves.map((i) => i.limitation.task_label)} />
                  <p className="hint">Relawan yang menandai keterbatasan terkait tidak akan dicocokkan, demi keselamatan.</p>
                </Requirement>
              )}
              {(call.age_min || call.age_max) && (
                <Requirement label="Usia">
                  {call.age_min && call.age_max ? `${call.age_min}–${call.age_max} tahun` : call.age_min ? `Minimal ${call.age_min} tahun` : `Maksimal ${call.age_max} tahun`}
                </Requirement>
              )}
              {call.gender && (
                <Requirement label="Jenis kelamin">
                  {call.gender === "P" ? "Perempuan" : "Laki-laki"} — <span className="text-ink-muted">{call.gender_reason}</span>
                </Requirement>
              )}
              {call.min_followers != null && <Requirement label="Pengikut media sosial">Minimal {formatNumber(call.min_followers)} pengikut</Requirement>}
              {call.need_cv && <Requirement label="Dokumen">Wajib melampirkan CV</Requirement>}
            </div>
          </section>

          {call.status === "dibatalkan" && call.cancel_reason && (
            <p className="mt-8 rounded-xl bg-danger-wash px-4 py-3 text-sm text-danger">Panggilan dibatalkan: {call.cancel_reason}</p>
          )}

          <div className="mt-10">
            <Suspense fallback={null}>
              <ReportArea callId={call.id} />
            </Suspense>
          </div>
        </article>

        <aside>
          <Suspense fallback={<Skeleton className="h-64" />}>
            <ViewerPanel call={call} />
          </Suspense>
        </aside>
      </div>
    </Container>
  );
}

async function ReportArea({ callId }: { callId: string }) {
  const viewer = await getViewer();
  if (!viewer) return null;
  return <ReportButton targetType="call" targetId={callId} label="Laporkan panggilan ini" />;
}

async function ViewerPanel({ call }: { call: CallDetail }) {
  const viewer = await getViewer();
  const open = call.status === "aktif" && call.deadline >= todayJakarta();

  if (!viewer) {
    return (
      <div className="panel p-5">
        <p className="font-semibold">Tertarik ikut?</p>
        <p className="mt-1 text-sm text-ink-soft">Buat profil relawan untuk melamar dan melihat seberapa cocok panggilan ini denganmu.</p>
        <Link href={`/daftar?peran=relawan`} className="btn btn-primary mt-4 w-full">
          Daftar jadi relawan
        </Link>
        <Link href={`/masuk?next=/panggilan/${call.slug}`} className="btn btn-ghost mt-2 w-full">
          Sudah punya akun? Masuk
        </Link>
      </div>
    );
  }

  if (viewer.role === "seeker") {
    if (viewer.id === call.seeker_id)
      return (
        <div className="panel p-5">
          <p className="font-semibold">Ini panggilanmu</p>
          <Link href={`/p/panggilan/${call.id}`} className="btn btn-ink mt-4 w-full">
            Kelola pelamar & rekomendasi
          </Link>
        </div>
      );
    return (
      <div className="panel p-5 text-sm text-ink-soft">Kamu masuk sebagai penyelenggara. Hanya akun relawan yang bisa melamar.</div>
    );
  }
  if (viewer.role !== "volunteer") return null;

  const supabase = await createServerSupabase();
  const [{ data: match }, { data: app }, { data: saved }, { data: priv }] = await Promise.all([
    supabase.from("matches").select("score, reasons").eq("call_id", call.id).eq("volunteer_id", viewer.id).maybeSingle(),
    supabase.from("applications").select("id, status, expires_at").eq("call_id", call.id).eq("volunteer_id", viewer.id).maybeSingle(),
    supabase.from("saved_calls").select("call_id").eq("call_id", call.id).eq("volunteer_id", viewer.id).maybeSingle(),
    supabase.from("volunteer_private").select("cv_path").eq("id", viewer.id).maybeSingle(),
  ]);

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line p-5">
        {match ? (
          <>
            <ScoreBadge score={match.score} animate />
            <ul className="mt-3 space-y-1 text-sm text-guyub-deep">
              {match.reasons.map((r: string) => (
                <li key={r}>✓ {r}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-sm text-ink-soft">
            {viewer.level === 0
              ? "Lengkapi profil untuk melihat kecocokanmu."
              : "Panggilan ini belum cocok dengan profilmu (lokasi, jadwal, skill wajib, atau keterbatasan). Kamu tetap bisa melamar jika memenuhi syarat."}
          </p>
        )}
      </div>
      <div className="p-5">
        {app ? (
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-ink-soft">Status kamu</span>
              <AppStatusBadge status={app.status as AppStatus} />
            </div>
            <Link href={`/pesan/${app.id}`} className="btn btn-ink mt-4 w-full">
              {app.status === "invited" ? "Lihat undangan" : "Buka percakapan"}
            </Link>
          </div>
        ) : (
          <ApplyPanel
            callId={call.id}
            open={open}
            levelOk={viewer.level >= call.min_level}
            minLevel={call.min_level}
            level={viewer.level}
            needCv={call.need_cv}
            questions={call.questions}
            profileCv={priv?.cv_path ?? null}
            userId={viewer.id}
          />
        )}
        <SaveButton callId={call.id} saved={Boolean(saved)} />
      </div>
    </div>
  );
}

function Fact({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="flex gap-3 rounded-3xl border border-line bg-surface p-5">
      <span className="mt-0.5 text-ink-muted [&>svg]:size-5" aria-hidden>
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
        <dd className="mt-0.5 font-medium">{value}</dd>
        {sub && <dd className="text-sm text-ink-muted">{sub}</dd>}
      </div>
    </div>
  );
}

function Requirement({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[11rem_1fr] sm:gap-4">
      <p className="text-sm font-semibold text-ink-muted">{label}</p>
      <div>{children}</div>
    </div>
  );
}

function Chips({ items, strong }: { items: string[]; strong?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <li key={i} className={`rounded-full px-3 py-1 text-sm ${strong ? "bg-ink text-paper" : "border border-line bg-surface"}`}>
          {i}
        </li>
      ))}
    </ul>
  );
}

function CallSkeleton() {
  return (
    <Container className="py-12">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-12 w-3/4" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <Skeleton className="h-72" />
        <Skeleton className="h-64" />
      </div>
    </Container>
  );
}
