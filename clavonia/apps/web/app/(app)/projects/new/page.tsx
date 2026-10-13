"use client";

import type { ProjectKind } from "@clavonia/core";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const GOALS = [
  { id: "contacts", label: "Captar contactos" },
  { id: "sales", label: "Vender productos o servicios" },
  { id: "brand", label: "Dar a conocer mi marca" },
];

const TONES = [
  { id: "calido", label: "Cálido y cercano" },
  { id: "sereno", label: "Sereno y delicado" },
  { id: "sobrio", label: "Profesional y sobrio" },
  { id: "vibrante", label: "Vibrante y divertido" },
];

interface WizardState {
  kind: ProjectKind;
  businessName: string;
  sector: string;
  goal: string;
  tone: string;
}

const INITIAL_STATE: WizardState = {
  kind: "landing",
  businessName: "",
  sector: "",
  goal: GOALS[0]?.id ?? "",
  tone: TONES[0]?.id ?? "",
};

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-500 focus:outline-none";

export default function NewProjectPage() {
  const router = useRouter();
  const [form, setForm] = useState<WizardState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof WizardState>(key: K, value: WizardState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: form.businessName,
          sector: form.sector,
          goal: form.goal,
          kind: form.kind,
          tone: form.tone,
        }),
      });
      const payload = (await response.json()) as {
        data?: { id: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        setError(payload.error?.message ?? "No se pudo crear el proyecto.");
        setSubmitting(false);
        return;
      }

      router.push(`/projects/${payload.data.id}/editor`);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-stone-900">Nuevo proyecto</h1>
        <p className="text-sm text-stone-600">
          Cuéntanos sobre tu negocio y crearemos un primer borrador para ti.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-stone-200 bg-white p-6">
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-stone-700">Tipo de proyecto</legend>
          <div className="flex flex-wrap gap-4 text-sm text-stone-700">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                value="landing"
                checked={form.kind === "landing"}
                onChange={() => update("kind", "landing")}
              />
              Landing page
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="kind"
                value="website"
                checked={form.kind === "website"}
                onChange={() => update("kind", "website")}
              />
              Sitio web
            </label>
          </div>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="businessName" className="block text-sm font-medium text-stone-700">
            Nombre del negocio
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            required
            maxLength={120}
            value={form.businessName}
            onChange={(event) => update("businessName", event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="sector" className="block text-sm font-medium text-stone-700">
            Sector
          </label>
          <input
            id="sector"
            name="sector"
            type="text"
            placeholder="Por ejemplo: cafetería, consultoría, moda"
            value={form.sector}
            onChange={(event) => update("sector", event.target.value)}
            className={inputClass}
          />
        </div>

        <div className="space-y-1">
          <label htmlFor="goal" className="block text-sm font-medium text-stone-700">
            Objetivo principal
          </label>
          <select
            id="goal"
            name="goal"
            value={form.goal}
            onChange={(event) => update("goal", event.target.value)}
            className={inputClass}
          >
            {GOALS.map((goal) => (
              <option key={goal.id} value={goal.id}>
                {goal.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="tone" className="block text-sm font-medium text-stone-700">
            Tono de comunicación
          </label>
          <select
            id="tone"
            name="tone"
            value={form.tone}
            onChange={(event) => update("tone", event.target.value)}
            className={inputClass}
          >
            {TONES.map((tone) => (
              <option key={tone.id} value={tone.id}>
                {tone.label}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
        >
          {submitting ? "Creando..." : "Crear proyecto"}
        </button>
      </form>
    </div>
  );
}
