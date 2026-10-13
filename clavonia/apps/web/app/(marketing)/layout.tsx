import type { ReactNode } from "react";
import { SiteHeader } from "../../components/site-header";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-12">{children}</main>
    </>
  );
}
