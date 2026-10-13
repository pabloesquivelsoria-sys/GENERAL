import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "../../../components/auth-form";

export const metadata: Metadata = {
  title: "Crear cuenta | Clavonia",
};

export default function SignupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold text-stone-900">Crear cuenta</h1>
        <p className="text-sm text-stone-600">Crea tu página en minutos y publícala cuando quieras.</p>
      </div>
      <AuthForm mode="signup" />
      <p className="text-sm text-stone-600">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-stone-900 underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  );
}
