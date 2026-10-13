import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-16 sm:px-6">
      <section className="mx-auto w-full max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-widest text-secondary">
          Clavonia
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold leading-tight sm:text-5xl">
          Tu negocio, con una página que se ve profesional
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed opacity-80">
          Elige una plantilla o describe tu negocio, edita tu página en un editor
          de bloques y publícala cuando quieras.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/templates"
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-6 py-3 font-medium text-background shadow-sm transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            Elegir una plantilla
          </Link>
          <Link
            href="/projects/new"
            className="inline-flex w-full items-center justify-center rounded-md border border-primary px-6 py-3 font-medium text-primary transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            Describir mi negocio
          </Link>
        </div>
      </section>
    </main>
  );
}
