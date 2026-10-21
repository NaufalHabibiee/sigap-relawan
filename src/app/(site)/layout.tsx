import { SiteFooter } from "@/components/site-footer";
import { HideOnDashboard, SiteMain } from "@/components/site-chrome";
import { SiteHeader } from "@/components/site-header";

export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <HideOnDashboard>
        <SiteHeader />
      </HideOnDashboard>
      <SiteMain>{children}</SiteMain>
      <HideOnDashboard>
        <SiteFooter />
      </HideOnDashboard>
    </>
  );
}
