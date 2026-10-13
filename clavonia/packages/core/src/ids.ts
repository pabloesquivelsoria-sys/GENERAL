/** Returns a new unique identifier (RFC 4122 v4 UUID). */
export function newId(): string {
  return crypto.randomUUID();
}
