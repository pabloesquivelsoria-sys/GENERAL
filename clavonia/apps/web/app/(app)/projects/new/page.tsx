"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import {
  DESIGN_TONES,
  WIZARD_STEP_FIELDS,
  generateProjectInputSchema,
  type DesignGoal,
  type DesignTone,
  type GenerateProjectInput,
} from "@clavonia/design-engine/input";

const STEP_TITLES = ["Tu negocio", "Tu objetivo", "Tu estilo"] as const;

const GOAL_OPTIONS: { id: DesignGoal; label: string }[] = [
  { id: "contacts", label: "Captar contactos" },
  { id: "sales", label: "Vender productos o servicios" },
  { id: "brand", label: "Dar a conocer mi marca" },
];

const TONE_LABELS: Record<DesignTone, string> = {
  calido: "Cálido y cercano",
  sereno: "Sereno y delicado",
  sobrio: "Profesional y sobrio",
  vibrante: "Vibrante y divertido",
};

const DEFAULT_VALUES: GenerateProjectInput = {
  kind: "landing",
  businessName: "",
  sector: "",
  goal: "contacts",
  tone: "calido",
};

const inputClass =
  "w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-500 focus:outline-none aria-[invalid=true]:border-red-600";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-red-600">
      {message}
    </p>
  );
}

export default function NewProjectPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isLastStep = step === STEP_TITLES.length - 1;

  const {
    register,
    trigger,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GenerateProjectInput>({
    resolver: zodResolver(generateProjectInputSchema),
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  // Al cambiar de paso, el foco va al título del paso para que lectores de pantalla anuncien el cambio.
  useEffect(() => {
    headingRef.current?.focus();
  }, [step]);

  async function goNext() {
    const valid = await trigger(WIZARD_STEP_FIELDS[step]);
    if (valid) setStep((current) => current + 1);
  }

  async function onSubmit(values: GenerateProjectInput) {
    try {
      const response = await fetch("/api/projects/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as {
        data?: { id: string };
        error?: { message: string };
      };

      if (!response.ok || !payload.data) {
        setError("root", { message: payload.error?.message ?? "No se pudo crear el proyecto." });
        return;
      }

      router.push(`/projects/${payload.data.id}/editor`);
    } catch {
      setError("root", { message: "Error de conexión. Inténtalo de nuevo." });
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

      <ol aria-label="Pasos del formulario" className="flex gap-2 text-sm">
        {STEP_TITLES.map((title, index) => (
          <li
            key={title}
            aria-current={index === step ? "step" : undefined}
            className={
              index === step
                ? "flex-1 rounded-md bg-stone-900 px-3 py-2 text-center font-medium text-white"
                : index < step
                  ? "flex-1 rounded-md bg-stone-200 px-3 py-2 text-center text-stone-800"
                  : "flex-1 rounded-md border border-stone-200 px-3 py-2 text-center text-stone-500"
            }
          >
            {index + 1}. {title}
          </li>
        ))}
      </ol>

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (!isLastStep) {
            void goNext();
            return;
          }
          void handleSubmit(onSubmit)(event);
        }}
        className="space-y-6 rounded-xl border border-stone-200 bg-white p-6"
      >
        <h2 ref={headingRef} tabIndex={-1} className="text-lg font-medium text-stone-900 focus:outline-none">
          {STEP_TITLES[step]}
        </h2>

        {step === 0 && (
          <>
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-stone-700">Tipo de proyecto</legend>
              <div className="flex flex-wrap gap-4 text-sm text-stone-700">
                <label className="flex items-center gap-2">
                  <input type="radio" value="landing" {...register("kind")} />
                  Landing page
                </label>
                <label className="flex items-center gap-2">
                  <input type="radio" value="website" {...register("kind")} />
                  Sitio web
                </label>
              </div>
              <FieldError id="kind-error" message={errors.kind?.message} />
            </fieldset>

            <div className="space-y-1">
              <label htmlFor="businessName" className="block text-sm font-medium text-stone-700">
                Nombre del negocio
              </label>
              <input
                id="businessName"
                type="text"
                autoComplete="organization"
                aria-invalid={errors.businessName ? "true" : "false"}
                aria-describedby={errors.businessName ? "businessName-error" : undefined}
                className={inputClass}
                {...register("businessName")}
              />
              <FieldError id="businessName-error" message={errors.businessName?.message} />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="space-y-1">
              <label htmlFor="sector" className="block text-sm font-medium text-stone-700">
                Sector
              </label>
              <input
                id="sector"
                type="text"
                placeholder="Por ejemplo: cafetería, consultoría, moda"
                aria-invalid={errors.sector ? "true" : "false"}
                aria-describedby={errors.sector ? "sector-error" : undefined}
                className={inputClass}
                {...register("sector")}
              />
              <FieldError id="sector-error" message={errors.sector?.message} />
            </div>

            <div className="space-y-1">
              <label htmlFor="goal" className="block text-sm font-medium text-stone-700">
                Objetivo principal
              </label>
              <select
                id="goal"
                aria-invalid={errors.goal ? "true" : "false"}
                aria-describedby={errors.goal ? "goal-error" : undefined}
                className={inputClass}
                {...register("goal")}
              >
                {GOAL_OPTIONS.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.label}
                  </option>
                ))}
              </select>
              <FieldError id="goal-error" message={errors.goal?.message} />
            </div>
          </>
        )}

        {step === 2 && (
          <div className="space-y-1">
            <label htmlFor="tone" className="block text-sm font-medium text-stone-700">
              Tono de comunicación
            </label>
            <select
              id="tone"
              aria-invalid={errors.tone ? "true" : "false"}
              aria-describedby={errors.tone ? "tone-error" : undefined}
              className={inputClass}
              {...register("tone")}
            >
              {DESIGN_TONES.map((tone) => (
                <option key={tone} value={tone}>
                  {TONE_LABELS[tone]}
                </option>
              ))}
            </select>
            <FieldError id="tone-error" message={errors.tone?.message} />
          </div>
        )}

        <FieldError id="root-error" message={errors.root?.message} />

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setStep((current) => Math.max(0, current - 1))}
            disabled={step === 0 || isSubmitting}
            className="rounded-md px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40"
          >
            Atrás
          </button>

          {isLastStep ? (
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-60"
            >
              {isSubmitting ? "Creando..." : "Crear proyecto"}
            </button>
          ) : (
            <button
              type="submit"
              className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
            >
              Siguiente
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
