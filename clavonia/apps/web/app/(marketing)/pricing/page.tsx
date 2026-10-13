import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Precios | Clavonia",
};

// TODO: los precios y los beneficios son placeholders hasta definir el modelo comercial.
const PLANS = [
  {
    name: "Gratis",
    price: "[precio]",
    description: "Para probar Clavonia con tu primera página.",
    features: ["Plantillas incluidas", "Editor de bloques", "Publicación básica"],
  },
  {
    name: "Emprendedor",
    price: "[precio]",
    description: "Para emprendedores que necesitan varias páginas de marca.",
    features: ["Más proyectos", "Marcas personalizadas", "Dominio propio"],
  },
  {
    name: "Negocio",
    price: "[precio]",
    description: "Para negocios con equipo y necesidades avanzadas.",
    features: ["Colaboración en equipo", "Soporte prioritario", "Estadísticas avanzadas"],
  },
];

export default function PricingPage() {
  return (
    <div className="space-y-10">
      <header className="max-w-2xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Precios</h1>
        <p className="text-stone-600">
          Elige el plan que mejor se adapte a la etapa de tu negocio. Puedes cambiarlo cuando
          quieras.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-3">
        {PLANS.map((plan) => (
          <section
            key={plan.name}
            className="flex flex-col rounded-xl border border-stone-200 bg-white p-6"
          >
            <h2 className="text-lg font-semibold text-stone-900">{plan.name}</h2>
            <p className="mt-1 text-sm text-stone-500">{plan.description}</p>
            <p className="mt-6 text-3xl font-semibold text-stone-900">{plan.price}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-stone-700">
              {plan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
            <a
              href="/signup"
              className="mt-8 rounded-md bg-stone-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-stone-700"
            >
              Empezar con {plan.name}
            </a>
          </section>
        ))}
      </div>
    </div>
  );
}
