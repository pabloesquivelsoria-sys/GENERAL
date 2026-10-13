import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-medium text-stone-500">Error 404</p>
      <h1 className="text-2xl font-semibold text-stone-900">Página no encontrada</h1>
      <p className="text-sm text-stone-600">
        La página que buscas no existe o ya no está disponible.
      </p>
      <Link
        href="/"
        className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
