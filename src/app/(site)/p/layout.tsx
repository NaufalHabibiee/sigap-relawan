import { DashShell } from "@/components/dash-shell";

export default function SeekerLayout({ children }: { children: React.ReactNode }) {
  return <DashShell role="seeker">{children}</DashShell>;
}
