import { prisma } from '../src/client';

// Datos de demostración. Idempotente: se puede ejecutar varias veces.
async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: 'demo@clavonia.local' },
    update: {},
    create: { email: 'demo@clavonia.local', name: 'Usuario demo' },
  });

  const project = await prisma.project.upsert({
    where: { id: 'demo-landing' },
    update: {},
    create: {
      id: 'demo-landing',
      name: 'Proyecto demo',
      kind: 'landing',
      status: 'draft',
      ownerId: user.id,
      brand: {
        primary: '#40273B',
        secondary: '#A9785B',
        background: '#FFFFFF',
        text: '#1F1A1D',
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
    },
  });

  await prisma.page.upsert({
    where: { projectId_slug: { projectId: project.id, slug: 'inicio' } },
    update: {},
    create: {
      projectId: project.id,
      slug: 'inicio',
      title: 'Inicio',
      position: 0,
      document: {
        id: 'demo-page-inicio',
        slug: 'inicio',
        title: 'Inicio',
        blocks: [
          {
            id: 'demo-block-hero',
            type: 'hero',
            props: { headline: 'Bienvenido a tu nuevo sitio', subheadline: 'Creado con Clavonia' },
          },
        ],
      },
    },
  });

  console.log(`Seed completado: usuario ${user.email}, proyecto ${project.name}.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
