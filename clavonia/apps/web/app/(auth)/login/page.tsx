import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../../../components/auth-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Clavonia",
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Iniciar sesión</h1>
        <p className="text-sm text-stone-600">Entra para seguir editando tus páginas.</p>
      </div>
      <AuthForm mode="login" />
      <p className="text-sm text-stone-600">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-medium text-stone-900 underline">
          Crear cuenta
        </Link>
      </p>
    </div>
  );
}
