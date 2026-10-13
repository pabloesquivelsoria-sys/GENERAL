import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marcas | Clavonia",
};

export default function BrandKitsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Marcas</h1>
        <p className="text-sm text-stone-600">
          Colores y tipografías que se aplican a tus páginas.
        </p>
      </header>
      {/* TODO: listar los brand kits del usuario y permitir crearlos a partir de BrandTheme. */}
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
        Próximamente podrás guardar tus marcas aquí.
      </div>
    </div>
  );
}
