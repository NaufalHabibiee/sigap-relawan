import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BadgeCheck, Briefcase, CalendarDays, CheckCircle2, Heart, type LucideIcon, MapPin, MessageSquareQuote, ShieldCheck, Siren, Sparkles, Star, UserCheck, UserRound } from "lucide-react";
import { ReportButton } from "@/components/report-button";
import { ReviewsList } from "@/components/reviews-list";
import { Avatar, Container, PageSkeleton } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { getReviewsFor, getStats } from "@/lib/data";
import { formatDate, formatRating } from "@/lib/format";
import { getPublicVolunteer } from "@/lib/profile-data";

export async function generateMetadata(props: PageProps<"/relawan/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const v = await getPublicVolunteer(slug);
  return { title: v ? `${v.nickname} — relawan` : "Relawan tidak ditemukan", robots: { index: false } };
}

export default function VolunteerProfile(props: PageProps<"/relawan/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Profile params={props.params} />
    </Suspense>
  );
}

const LEVEL_COPY = [
  { title: "Profil belum lengkap", body: "Relawan ini belum menyelesaikan profilnya." },
  { title: "Profil lengkap", body: "Data diri dan nomor HP sudah terisi dan terverifikasi." },
  { title: "Identitas terverifikasi", body: "KTP dan selfie sudah diperiksa admin Sigap, kontak darurat tersedia." },
];

/** Every block on this page is a Card or a Tile: same radius, border and padding, so edges line up in the grid. */
function Card({ icon: Icon, title, meta, children }: { icon: LucideIcon; title: string; meta?: string; children: React.ReactNode }) {
  return (
    <section className="h-full rounded-3xl border border-line bg-surface p-6">
      <header className="flex items-center gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-paper text-ink-soft">
          <Icon className="size-5" aria-hidden />
        </span>
        <h2 className="h-section min-w-0 flex-1 text-lg">{title}</h2>
        {meta && <span className="shrink-0 rounded-full bg-paper px-2.5 py-1 text-xs font-semibold text-ink-soft">{meta}</span>}
      </header>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Tile({ icon: Icon, tint, value, label }: { icon: LucideIcon; tint: string; value: React.ReactNode; label: string }) {
  return (
    <li className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-6">
      <span className={`inline-flex size-12 shrink-0 items-center justify-center rounded-2xl ${tint}`}>
        <Icon className="size-6" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-display text-3xl leading-none font-bold">{value}</span>
        <span className="mt-1.5 block truncate text-sm text-ink-muted">{label}</span>
      </span>
    </li>
  );
}

/** Two cards side by side at 8/4 columns; if one is missing the other takes the full row instead of leaving a hole. */
function Row({ main, side }: { main?: React.ReactNode; side?: React.ReactNode }) {
  if (!main && !side) return null;
  const both = Boolean(main && side);
  return (
    <div className="grid gap-4 lg:grid-cols-12">
      {main && <div className={both ? "lg:col-span-8" : "lg:col-span-12"}>{main}</div>}
      {side && <div className={both ? "lg:col-span-4" : "lg:col-span-12"}>{side}</div>}
    </div>
  );
}

async function Profile({ params }: Pick<PageProps<"/relawan/[slug]">, "params">) {
  const { slug } = await params;
  const v = await getPublicVolunteer(slug);
  if (!v) notFound();
  const [stats, reviews] = await Promise.all([getStats(v.id), getReviewsFor(v.id)]);
  const skills = [...v.skills].filter((s) => s.skill?.name).sort((a, b) => b.level - a.level);
  const expert = skills.filter((s) => s.level === 2);
  const others = skills.filter((s) => s.level !== 2);
  const strengths = [...new Set(v.strengths)];
  const interests = v.interests.map((i) => i.category?.name).filter((n): n is string => Boolean(n));
  const attended = stats.completed + stats.no_show;
  const attendance = attended ? Math.round((stats.completed / attended) * 100) : null;
  const level = LEVEL_COPY[Math.min(2, v.verification_level)];
  const dist = [5, 4, 3, 2, 1].map((n) => ({ n, count: reviews.filter((r) => r.rating === n).length }));
  const maxDist = Math.max(1, ...dist.map((d) => d.count));

  return (
    <Container className="space-y-4 py-8">
      {/* Identity */}
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="relative h-32 bg-ink sm:h-40">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(30rem_16rem_at_85%_0%,rgba(232,98,44,0.4),transparent_70%),radial-gradient(22rem_14rem_at_5%_100%,rgba(31,111,92,0.45),transparent_70%),radial-gradient(circle_at_1px_1px,rgba(238,236,229,0.08)_1px,transparent_0)] [background-size:auto,auto,24px_24px]"
          />
        </div>
        <div className="relative z-10 px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex items-start gap-4 sm:-mt-14 sm:gap-5">
            <Avatar src={v.avatar_url} name={v.nickname ?? "?"} size={112} className="shrink-0 ring-4 ring-surface" />
            <div className="min-w-0 flex-1 pt-14 sm:pt-[4.25rem]">
              <h1 className="h-section truncate text-2xl sm:text-4xl">{v.nickname}</h1>
              <p className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                {v.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-4" aria-hidden /> {v.city.name}, {v.city.province}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="size-4" aria-hidden /> Bergabung {formatDate(v.created_at, { month: "long", year: "numeric" })}
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {v.verification_level >= 2 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-guyub-wash px-3 py-1 text-sm font-semibold text-guyub-deep">
                <BadgeCheck className="size-4" aria-hidden /> Identitas terverifikasi
              </span>
            ) : v.verification_level === 1 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e3e1d8] px-3 py-1 text-sm font-semibold">
                <UserCheck className="size-4" aria-hidden /> Profil lengkap
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-sigap-wash px-3 py-1 text-sm font-semibold text-sigap-ink">Profil belum lengkap</span>
            )}
            {v.emergency_standby && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sigap-wash px-3 py-1 text-sm font-semibold text-sigap-ink">
                <Siren className="size-4" aria-hidden /> Siaga darurat
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Track record */}
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={Star} tint="bg-ladang-wash text-[#6b5410]" value={stats.rating_count ? formatRating(stats.rating_avg) : "–"} label={stats.rating_count ? `Rating · ${stats.rating_count} ulasan` : "Belum ada ulasan"} />
        <Tile icon={CheckCircle2} tint="bg-guyub-wash text-guyub-deep" value={stats.completed} label="Kegiatan selesai" />
        <Tile icon={ShieldCheck} tint="bg-sigap-wash text-sigap-ink" value={attendance === null ? "–" : `${attendance}%`} label="Tingkat kehadiran" />
        <Tile icon={Sparkles} tint="bg-paper text-ink-soft" value={skills.length} label="Skill terdaftar" />
      </ul>

      <Row
        main={
          v.bio ? (
            <Card icon={UserRound} title="Tentang">
              <p className="max-w-[65ch] text-[1.05rem] leading-relaxed text-ink-soft">{v.bio}</p>
            </Card>
          ) : undefined
        }
        side={
          <Card icon={ShieldCheck} title="Verifikasi">
            <p className="font-semibold">{level.title}</p>
            <p className="mt-1.5 text-sm text-ink-soft">{level.body}</p>
          </Card>
        }
      />

      <Row
        main={
          skills.length > 0 || strengths.length > 0 ? (
            <Card icon={Sparkles} title="Kemampuan" meta={skills.length ? `${skills.length} skill` : undefined}>
              <div className="space-y-6">
                {expert.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Mahir</p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {expert.map((s, i) => (
                        <li key={i} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-1.5 text-sm font-medium text-paper">
                          <Star className="size-3.5 fill-ladang text-ladang" aria-hidden /> {s.skill?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {others.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{expert.length ? "Menguasai" : "Skill"}</p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {others.map((s, i) => (
                        <li key={i} className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-medium">
                          {s.skill?.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {strengths.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">Kelebihan</p>
                    <ul className="mt-2.5 flex flex-wrap gap-2">
                      {strengths.map((s) => (
                        <li key={s} className="inline-flex items-center gap-1.5 rounded-full bg-guyub-wash px-3.5 py-1.5 text-sm font-medium text-guyub-deep">
                          <CheckCircle2 className="size-4 shrink-0" aria-hidden /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </Card>
          ) : undefined
        }
        side={
          interests.length > 0 ? (
            <Card icon={Heart} title="Bidang minat" meta={`${interests.length}`}>
              <ul className="flex flex-wrap gap-2">
                {interests.map((n) => (
                  <li key={n} className="rounded-full bg-paper px-3.5 py-1.5 text-sm font-medium">
                    {n}
                  </li>
                ))}
              </ul>
            </Card>
          ) : undefined
        }
      />

      <Row
        main={
          v.experiences.length > 0 ? (
            <Card icon={Briefcase} title="Pengalaman" meta={`${v.experiences.length}`}>
              <ol className="space-y-5 border-l-2 border-line pl-6">
                {v.experiences.map((e, i) => (
                  <li key={i} className="relative">
                    <span className="absolute top-1.5 -left-[1.95rem] size-3 rounded-full border-2 border-surface bg-sigap" aria-hidden />
                    <p className="font-semibold">{e.title}</p>
                    <p className="mt-0.5 text-sm text-ink-muted">{[e.role, e.organizer, e.year].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ol>
            </Card>
          ) : undefined
        }
        side={
          reviews.length > 0 ? (
            <Card icon={Star} title="Sebaran rating" meta={`${reviews.length} ulasan`}>
              <ul className="space-y-2">
                {dist.map((d) => (
                  <li key={d.n} className="flex items-center gap-3 text-sm">
                    <span className="inline-flex w-7 items-center gap-0.5 font-medium">
                      {d.n}
                      <Star className="size-3 fill-ladang text-ladang" aria-hidden />
                    </span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-paper">
                      <span className="block h-full rounded-full bg-ladang" style={{ width: `${(d.count / maxDist) * 100}%` }} />
                    </span>
                    <span className="w-5 text-right text-xs text-ink-muted">{d.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : undefined
        }
      />

      <Card icon={MessageSquareQuote} title="Ulasan dari penyelenggara" meta={reviews.length ? `${reviews.length}` : undefined}>
        <ReviewsList reviews={reviews} ownerName={v.nickname ?? "relawan"} />
      </Card>

      <Suspense fallback={null}>
        <ReportArea id={v.id} />
      </Suspense>
    </Container>
  );
}

async function ReportArea({ id }: { id: string }) {
  const viewer = await getViewer();
  if (!viewer || viewer.id === id) return null;
  return (
    <div>
      <ReportButton targetType="user" targetId={id} label="Laporkan profil ini" />
    </div>
  );
}
