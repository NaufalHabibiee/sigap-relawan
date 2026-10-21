import { DashShell } from "@/components/dash-shell";

export default function VolunteerLayout({ children }: { children: React.ReactNode }) {
  return <DashShell role="volunteer">{children}</DashShell>;
}
