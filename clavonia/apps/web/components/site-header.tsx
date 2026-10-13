import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-stone-900">
          Clavonia
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm text-stone-600">
          <Link href="/pricing" className="hover:text-stone-900">
            Precios
          </Link>
          <Link href="/login" className="hover:text-stone-900">
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-stone-900 px-3 py-2 text-white hover:bg-stone-700"
          >
            Crear cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
