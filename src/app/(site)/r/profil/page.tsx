import type { Metadata } from "next";
import { Suspense } from "react";
import { Container, PageSkeleton } from "@/components/ui";
import { ProfileWizard } from "@/components/volunteer/profile-wizard";
import { requireViewer } from "@/lib/auth";
import { getMasterData } from "@/lib/data";
import { completeness, getMyVolunteer, missingForLevel1 } from "@/lib/volunteer-data";

export const metadata: Metadata = { title: "Profil relawan" };

export default function ProfilePage(props: PageProps<"/r/profil">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
        <Profile searchParams={props.searchParams} />
      </Suspense>
  );
}

async function Profile({ searchParams }: Pick<PageProps<"/r/profil">, "searchParams">) {
  const viewer = await requireViewer("volunteer");
  const [sp, me, master] = await Promise.all([searchParams, getMyVolunteer(viewer.id), getMasterData()]);
  const step = Number(sp.langkah);
  return (
    <Container className="py-8">
      <ProfileWizard
        me={me}
        master={master}
        initialStep={step >= 1 && step <= 4 ? step : 1}
        pct={completeness(me)}
        missing={missingForLevel1(me)}
        level={viewer.level}
      />
    </Container>
  );
}
