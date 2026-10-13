# @clavonia/db

Esquema Prisma 5 y cliente para PostgreSQL.

## Requisitos

- Node 20+ y pnpm
- Docker (para PostgreSQL local)

## 1. Levantar PostgreSQL

Desde la raíz de `clavonia/`:

```bash
docker compose -f infra/docker-compose.yml up -d
```

## 2. Configurar la conexión

Crea `packages/db/.env` (no se versiona) con la URL de la base de datos definida en el compose:

```bash
DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@localhost:5432/clavonia"
```

## 3. Scripts

Desde la raíz de `clavonia/`:

```bash
pnpm --filter @clavonia/db generate   # genera el cliente Prisma
pnpm --filter @clavonia/db migrate    # crea y aplica migraciones en desarrollo
pnpm --filter @clavonia/db seed       # carga el usuario y proyecto de demostración
pnpm --filter @clavonia/db typecheck  # verifica tipos
pnpm --filter @clavonia/db test       # tests del esquema
```

Ejecuta `generate` antes de `typecheck` la primera vez, o tras cambiar `prisma/schema.prisma`.
