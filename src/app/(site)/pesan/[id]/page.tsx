import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ChatThread, type ChatMessage } from "@/components/chat/chat-thread";
import { ThreadActions } from "@/components/chat/thread-actions";
import { ReviewForm } from "@/components/chat/review-form";
import { ReportButton } from "@/components/report-button";
import { BlockButton } from "@/components/chat/block-button";
import { PrivateFileLink } from "@/components/private-file-link";
import { AppStatusBadge, Avatar, Container, LevelBadge, PageSkeleton } from "@/components/ui";
import { requireViewer } from "@/lib/auth";
import { ageFrom, formatDate, formatDateRange, formatNumber, formatTime, isPast, timeLeft, whatsappLink } from "@/lib/format";
import { createServerSupabase } from "@/lib/supabase/server";
import type { AppStatus, CallStatus, Load } from "@/lib/types";

export const metadata: Metadata = { title: "Percakapan" };

export default function ThreadPage(props: PageProps<"/pesan/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Thread params={props.params} />
    </Suspense>
  );
}

type App = {
  id: string;
  status: AppStatus;
  source: string;
  message: string | null;
  answers: string[];
  cv_path: string | null;
  expires_at: string | null;
  attended_at: string | null;
  volunteer_id: string;
  volunteer: { nickname: string | null; avatar_url: string | null; slug: string; verification_level: number } | null;
  call: {
    id: string;
    slug: string;
    title: string;
    load: Load;
    status: CallStatus;
    start_date: string;
    end_date: string;
    start_time: string | null;
    mode: string;
    address: string | null;
    questions: string[];
    seeker_id: string;
    city: { name: string } | null;
    seeker: { org_name: string; logo_url: string | null; slug: string; verified: boolean } | null;
  } | null;
};

async function Thread({ params }: Pick<PageProps<"/pesan/[id]">, "params">) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const viewer = await requireViewer();
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("applications")
    .select(
      "id, status, source, message, answers, cv_path, expires_at, attended_at, volunteer_id, volunteer:volunteers(nickname, avatar_url, slug, verification_level), call:calls(id, slug, title, load, status, start_date, end_date, start_time, mode, address, questions, seeker_id, city:cities(name), seeker:seekers(org_name, logo_url, slug, verified))",
    )
    .eq("id", id)
    .maybeSingle();
  const app = data as unknown as App | null;
  if (!app || !app.call) notFound();
  const isVol = viewer.id === app.volunteer_id;
  const isSeeker = viewer.id === app.call.seeker_id;
  if (!isVol && !isSeeker) notFound();

  const otherId = isVol ? app.call.seeker_id : app.volunteer_id;
  const [{ data: msgs }, { data: contacts }, { data: reviews }, { data: blocks }, priv] = await Promise.all([
    supabase.from("messages").select("id, sender_id, kind, body, attachment_path, attachment_name, created_at").eq("application_id", id).order("created_at").limit(500),
    supabase.rpc("get_contacts", { p_app: id }),
    supabase.from("reviews").select("reviewer_id, rating, body, visible_at").eq("application_id", id),
    supabase.from("user_blocks").select("blocked_id").eq("blocker_id", viewer.id).eq("blocked_id", otherId),
    isSeeker ? loadApplicant(supabase, app.volunteer_id) : Promise.resolve(null),
  ]);
  await supabase.rpc("mark_thread_read", { p_app: id });

  const myReview = (reviews ?? []).find((r) => r.reviewer_id === viewer.id);
  const theirReview = (reviews ?? []).find((r) => r.reviewer_id !== viewer.id && isPast(r.visible_at));
  const reviewOpen = app.status === "completed" && !myReview && app.attended_at && !isPast(app.attended_at, 14);
  const locked = isPast(`${app.call.end_date}T23:59:59+07:00`, 30);
  const otherName = isVol ? (app.call.seeker?.org_name ?? "Penyelenggara") : (app.volunteer?.nickname ?? "Relawan");
  const otherAvatar = isVol ? app.call.seeker?.logo_url : app.volunteer?.avatar_url;
  const contact = contacts as { phone: string | null; name: string | null; emergency?: Record<string, string | null> | null } | null;
  const wa = whatsappLink(contact?.phone);

  return (
    <Container className="py-6">
      <Link href="/pesan" className="text-sm text-ink-muted hover:underline">
        ← Semua pesan
      </Link>
      <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_20rem]">
        <section className="panel flex min-h-[70vh] flex-col overflow-hidden">
          <header className="flex items-center gap-3 border-b border-line px-4 py-3">
            <Avatar src={otherAvatar} name={otherName} size={40} square={isVol} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{otherName}</p>
              <Link href={`/panggilan/${app.call.slug}`} className="block truncate text-sm text-ink-muted hover:underline">
                {app.call.title}
              </Link>
            </div>
            <AppStatusBadge status={app.status} />
          </header>
          <ChatThread
            appId={id}
            viewerId={viewer.id}
            initial={(msgs ?? []) as ChatMessage[]}
            otherName={otherName}
            disabledReason={locked ? "Percakapan dikunci 30 hari setelah kegiatan selesai." : blocks?.length ? "Kamu memblokir pengguna ini." : null}
          />
        </section>

        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="text-sm font-semibold">Kegiatan</p>
            <p className="mt-1 text-sm text-ink-soft">
              {formatDateRange(app.call.start_date, app.call.end_date)}
              {app.call.start_time && ` · ${formatTime(app.call.start_time)} WIB`}
              <br />
              {app.call.mode === "online" ? "Online" : app.call.city?.name}
              {contact && app.call.address && (
                <>
                  <br />
                  {app.call.address}
                </>
              )}
            </p>
            {app.status === "invited" && app.expires_at && <p className="mt-2 text-sm font-semibold text-sigap-ink">Undangan berakhir {timeLeft(app.expires_at)}</p>}
            {(app.status === "accepted" || app.status === "completed") && (
              <a href={`/pesan/${id}/kalender`} download className="mt-3 inline-flex text-sm font-semibold text-guyub hover:underline">
                Tambah ke kalender
              </a>
            )}
            <ThreadActions appId={id} role={isVol ? "volunteer" : "seeker"} status={app.status} callStatus={app.call.status} startDate={app.call.start_date} />
          </div>

          {contact && (
            <div className="panel p-4">
              <p className="text-sm font-semibold">Kontak {isVol ? "penyelenggara" : "relawan"}</p>
              <p className="mt-1 text-sm">{contact.name}</p>
              {contact.phone && (
                <p className="text-sm">
                  {contact.phone}
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold text-guyub hover:underline">
                      WhatsApp
                    </a>
                  )}
                </p>
              )}
              {contact.emergency && (
                <div className="mt-3 rounded-lg bg-sigap-wash/60 p-3 text-sm">
                  <p className="font-semibold">Kontak darurat</p>
                  <p>
                    {contact.emergency.contact_name} ({contact.emergency.relation}) · {contact.emergency.contact_phone}
                  </p>
                  {contact.emergency.blood_type && <p>Golongan darah: {contact.emergency.blood_type}</p>}
                  {contact.emergency.health_notes && <p>Kesehatan: {contact.emergency.health_notes}</p>}
                </div>
              )}
            </div>
          )}

          {isSeeker && priv && (
            <div className="panel p-4 text-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">Tentang pelamar</p>
                <Link href={`/relawan/${app.volunteer?.slug}`} className="text-xs font-semibold text-sigap-ink hover:underline">
                  Profil publik
                </Link>
              </div>
              <div className="mt-2">
                <LevelBadge level={app.volunteer?.verification_level ?? 0} />
              </div>
              <dl className="mt-3 space-y-2">
                <Info label="Nama lengkap" value={priv.full_name} />
                <Info label="Usia" value={ageFrom(priv.birth_date) != null ? `${ageFrom(priv.birth_date)} tahun` : null} />
                <Info label="Jenis kelamin" value={priv.gender === "P" ? "Perempuan" : priv.gender === "L" ? "Laki-laki" : null} />
                <Info label="Keterbatasan" value={[...priv.limitations, priv.limitation_note].filter(Boolean).join(", ") || "Tidak ada"} />
                {priv.socials.length > 0 && <Info label="Media sosial" value={priv.socials.map((s) => `${s.platform} @${s.handle} (${formatNumber(s.followers)})`).join(", ")} />}
              </dl>
              {app.message && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-ink-muted">Pesan lamaran</p>
                  <p className="mt-0.5 whitespace-pre-line">{app.message}</p>
                </div>
              )}
              {app.call.questions.map((q, i) => (
                <div key={i} className="mt-3">
                  <p className="text-xs font-semibold text-ink-muted">{q}</p>
                  <p className="mt-0.5 whitespace-pre-line">{app.answers[i] ?? "—"}</p>
                </div>
              ))}
              {(app.cv_path ?? priv.cv_path) && (
                <div className="mt-3">
                  <PrivateFileLink path={(app.cv_path ?? priv.cv_path)!} label="Buka CV" />
                </div>
              )}
            </div>
          )}

          {(reviewOpen || myReview || theirReview) && (
            <div className="panel p-4">
              <p className="text-sm font-semibold">Ulasan</p>
              {reviewOpen && <ReviewForm appId={id} role={isVol ? "volunteer" : "seeker"} otherName={otherName} />}
              {myReview && <p className="mt-2 text-sm text-ink-soft">Ulasanmu: {"★".repeat(myReview.rating)} {myReview.body}</p>}
              {myReview && !theirReview && <p className="mt-1 text-xs text-ink-muted">Ulasan dari {otherName} terlihat setelah mereka mengisi atau setelah 14 hari.</p>}
              {theirReview && (
                <p className="mt-2 text-sm">
                  Dari {otherName}: {"★".repeat(theirReview.rating)} {theirReview.body}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col items-start gap-3 px-1">
            <ReportButton targetType="user" targetId={otherId} label={`Laporkan ${otherName}`} />
            <BlockButton userId={otherId} blocked={Boolean(blocks?.length)} />
            <p className="text-xs text-ink-muted">Sigap tidak pernah meminta biaya. Jangan transfer uang ke siapa pun di sini.</p>
            {app.attended_at && <p className="text-xs text-ink-muted">Kehadiran dicatat {formatDate(app.attended_at)}.</p>}
          </div>
        </aside>
      </div>
    </Container>
  );
}

async function loadApplicant(supabase: Awaited<ReturnType<typeof createServerSupabase>>, volunteerId: string) {
  const [p, l, s] = await Promise.all([
    supabase.from("volunteer_private").select("full_name, birth_date, gender, limitation_note, cv_path").eq("id", volunteerId).maybeSingle(),
    supabase.from("volunteer_limitations").select("limitation:limitations(name)").eq("volunteer_id", volunteerId),
    supabase.from("volunteer_socials").select("platform, handle, followers").eq("volunteer_id", volunteerId),
  ]);
  if (!p.data) return null;
  return {
    ...p.data,
    limitations: ((l.data ?? []) as unknown as { limitation: { name: string } | null }[]).map((r) => r.limitation?.name).filter(Boolean) as string[],
    socials: s.data ?? [],
  };
}

function Info({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-semibold text-ink-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
