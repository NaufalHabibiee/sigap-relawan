import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { AtSign, CalendarDays, CheckCircle2, Globe, Megaphone, MapPin, MessageSquareQuote, Star, UserRound } from "lucide-react";
import { Card, Row, Tile, TileGrid } from "@/components/cards";
import { CallRow } from "@/components/call-row";
import { ReportButton } from "@/components/report-button";
import { ReviewsList } from "@/components/reviews-list";
import { Avatar, Container, PageSkeleton, VerifiedMark } from "@/components/ui";
import { getViewer } from "@/lib/auth";
import { SEEKER_TYPE_LABEL } from "@/lib/constants";
import { getReviewsFor, getStats } from "@/lib/data";
import { formatDate, formatRating, safeExternalUrl } from "@/lib/format";
import { getPublicSeeker } from "@/lib/profile-data";

export async function generateMetadata(props: PageProps<"/penyelenggara/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const res = await getPublicSeeker(slug);
  return res ? { title: res.seeker.org_name, description: res.seeker.description?.slice(0, 160) } : { title: "Penyelenggara tidak ditemukan" };
}

export default function SeekerProfile(props: PageProps<"/penyelenggara/[slug]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Profile params={props.params} />
    </Suspense>
  );
}

async function Profile({ params }: Pick<PageProps<"/penyelenggara/[slug]">, "params">) {
  const { slug } = await params;
  const res = await getPublicSeeker(slug);
  if (!res) notFound();
  const { seeker: s, calls } = res;
  const [stats, reviews] = await Promise.all([getStats(s.id), getReviewsFor(s.id)]);
  const open = calls.filter((c) => c.status === "aktif" || c.status === "penuh");
  const past = calls.filter((c) => !(c.status === "aktif" || c.status === "penuh"));
  const website = safeExternalUrl(s.website);

  return (
    <Container className="space-y-4 py-8">
      <section className="overflow-hidden rounded-3xl border border-line bg-surface">
        <div className="relative h-28 bg-ink sm:h-36">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(30rem_16rem_at_85%_0%,rgba(232,98,44,0.4),transparent_70%),radial-gradient(22rem_14rem_at_5%_100%,rgba(31,111,92,0.45),transparent_70%),radial-gradient(circle_at_1px_1px,rgba(238,236,229,0.08)_1px,transparent_0)] [background-size:auto,auto,24px_24px]"
          />
        </div>
        <div className="relative z-10 px-6 pb-6 sm:px-8">
          <div className="-mt-12 flex items-start gap-4 sm:-mt-14 sm:gap-5">
            <Avatar src={s.logo_url} name={s.org_name} size={112} square className="shrink-0 ring-4 ring-surface" />
            <div className="min-w-0 flex-1 pt-14 sm:pt-[4.25rem]">
              <p className="text-sm text-ink-muted">{SEEKER_TYPE_LABEL[s.type]}</p>
              <h1 className="h-section text-2xl sm:text-4xl">{s.org_name}</h1>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            {s.verified && <VerifiedMark label="Penyelenggara terverifikasi" />}
            {s.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden /> {s.city.name}
              </span>
            )}
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:text-ink hover:underline">
                <Globe className="size-4" aria-hidden /> {s.website}
              </a>
            )}
            {s.instagram && (
              <a href={`https://instagram.com/${encodeURIComponent(s.instagram)}`} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 hover:text-ink hover:underline">
                <AtSign className="size-4" aria-hidden /> {s.instagram}
              </a>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-4" aria-hidden /> Sejak {formatDate(s.created_at, { month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
      </section>

      <TileGrid>
        <Tile icon={Star} tint="bg-ladang-wash text-[#6b5410]" value={stats.rating_count ? formatRating(stats.rating_avg) : "–"} label={stats.rating_count ? `Rating · ${stats.rating_count} ulasan` : "Belum ada ulasan"} />
        <Tile icon={CheckCircle2} tint="bg-guyub-wash text-guyub-deep" value={stats.completed} label="Kegiatan selesai" />
        <Tile icon={Megaphone} tint="bg-sigap-wash text-sigap-ink" value={open.length} label="Panggilan terbuka" />
        <Tile icon={UserRound} value={calls.length} label="Total panggilan" />
      </TileGrid>

      <Row
        main={
          s.description ? (
            <Card icon={UserRound} title="Tentang">
              <p className="max-w-[70ch] leading-relaxed whitespace-pre-line text-ink-soft">{s.description}</p>
            </Card>
          ) : undefined
        }
      />

      <Card icon={Megaphone} title="Panggilan terbuka" meta={open.length ? String(open.length) : undefined}>
        <div className="space-y-4">{open.length ? open.map((c) => <CallRow key={c.id} call={c} />) : <p className="text-ink-muted">Tidak ada panggilan terbuka saat ini.</p>}</div>
      </Card>

      {past.length > 0 && (
        <Card icon={CalendarDays} title="Kegiatan sebelumnya" meta={String(past.length)}>
          <ul className="divide-y divide-line">
            {past.map((c) => (
              <li key={c.id} className="flex justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="font-medium">{c.title}</span>
                <span className="shrink-0 text-sm text-ink-muted">{formatDate(c.start_date)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card icon={MessageSquareQuote} title="Ulasan dari relawan" meta={reviews.length ? String(reviews.length) : undefined}>
        <ReviewsList reviews={reviews} ownerName={s.org_name} />
      </Card>

      <Suspense fallback={null}>
        <ReportArea id={s.id} />
      </Suspense>
    </Container>
  );
}

async function ReportArea({ id }: { id: string }) {
  const viewer = await getViewer();
  if (!viewer || viewer.id === id) return null;
  return (
    <div>
      <ReportButton targetType="user" targetId={id} label="Laporkan penyelenggara ini" />
    </div>
  );
}
