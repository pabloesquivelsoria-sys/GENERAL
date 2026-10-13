import type { ReactNode } from "react";
import { SiteHeader } from "../../components/site-header";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-sm flex-col px-4 py-12">{children}</main>
    </>
  );
}
