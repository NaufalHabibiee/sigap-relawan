import { DashShell } from "@/components/dash-shell";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <DashShell role="admin">{children}</DashShell>;
}
