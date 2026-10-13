import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configuración | Clavonia",
};

export default function SettingsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Configuración</h1>
        <p className="text-sm text-stone-600">Datos de tu cuenta y preferencias.</p>
      </header>
      {/* TODO: formulario de perfil y preferencias cuando exista autenticación. */}
      <div className="rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center text-sm text-stone-600">
        La configuración estará disponible en una próxima versión.
      </div>
    </div>
  );
}
