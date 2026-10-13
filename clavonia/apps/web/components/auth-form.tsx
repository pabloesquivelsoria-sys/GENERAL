"use client";

import type { FormEvent } from "react";

interface AuthFormProps {
  mode: "login" | "signup";
}

interface FieldProps {
  id: string;
  label: string;
  type: string;
  autoComplete?: string;
}

function Field({ id, label, type, autoComplete }: FieldProps) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        autoComplete={autoComplete}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 focus:border-stone-500 focus:outline-none"
      />
    </div>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const isSignup = mode === "signup";

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // TODO: conectar con el proveedor de autenticación real y redirigir a /dashboard.
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isSignup && <Field id="name" label="Nombre" type="text" autoComplete="name" />}
      <Field id="email" label="Correo electrónico" type="email" autoComplete="email" />
      <Field
        id="password"
        label="Contraseña"
        type="password"
        autoComplete={isSignup ? "new-password" : "current-password"}
      />
      <button
        type="submit"
        className="w-full rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700"
      >
        {isSignup ? "Crear cuenta" : "Iniciar sesión"}
      </button>
    </form>
  );
}
