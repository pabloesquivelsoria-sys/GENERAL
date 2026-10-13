// TODO: sustituir por la sesión real cuando exista autenticación
// (leer el usuario autenticado de cookies o del proveedor de auth).
const DEMO_USER_ID = "demo-user";

export function getCurrentUserId(): string {
  return DEMO_USER_ID;
}
