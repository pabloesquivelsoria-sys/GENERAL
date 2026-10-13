import { PrismaClient } from '@prisma/client';

// Singleton: en desarrollo se reutiliza la instancia entre recargas en caliente
// para no abrir conexiones nuevas en cada recarga.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
