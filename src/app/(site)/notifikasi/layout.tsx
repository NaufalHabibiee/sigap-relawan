import { Suspense } from "react";
import { DashShell } from "@/components/dash-shell";
import { getViewer } from "@/lib/auth";

export default function NotifikasiLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={children}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}

async function Shell({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) return <>{children}</>;
  return <DashShell role={viewer.role}>{children}</DashShell>;
}
