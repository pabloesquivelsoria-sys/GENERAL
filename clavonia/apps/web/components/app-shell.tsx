"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/templates", label: "Plantillas" },
  { href: "/projects", label: "Mis proyectos" },
  { href: "/brand-kits", label: "Marcas" },
  { href: "/settings", label: "Configuración" },
];

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 md:flex-row">
      <aside className="border-b border-stone-200 bg-white md:w-60 md:border-b-0 md:border-r">
        <div className="px-4 py-4 text-lg font-semibold tracking-tight text-stone-900">
          Clavonia
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:pb-6">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm ${
                  active
                    ? "bg-stone-900 text-white"
                    : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
    </div>
  );
}
