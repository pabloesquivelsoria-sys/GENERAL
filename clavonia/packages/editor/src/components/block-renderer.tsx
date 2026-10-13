import type { Block } from '@clavonia/core';
import { Button, Card, Container, Section } from '@clavonia/ui';
import { BLOCK_LABELS } from '../labels';

export interface BlockRendererProps {
  block: Block;
}

function assertNever(value: never): never {
  throw new Error(`Tipo de bloque no soportado: ${String(value)}`);
}

/** Renderiza un bloque como sección placeholder según su tipo. */
export function BlockRenderer({ block }: BlockRendererProps) {
  const type = block.type;
  const str = (key: string, fallback = ''): string => {
    const value = block.props[key];
    return typeof value === 'string' ? value : fallback;
  };
  const title = str('title', BLOCK_LABELS[type]);

  switch (type) {
    case 'hero':
      return (
        <Section className="bg-neutral-100 py-20">
          <Container>
            <h1 className="text-4xl font-bold">{title}</h1>
            <p className="mt-4 text-lg text-neutral-600">{str('subtitle')}</p>
          </Container>
        </Section>
      );
    case 'about':
      return (
        <Section>
          <Container>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-4 text-neutral-600">{str('body')}</p>
          </Container>
        </Section>
      );
    case 'services':
    case 'pricing':
    case 'testimonials':
      return (
        <Section>
          <Container>
            <h2 className="text-2xl font-semibold">{title}</h2>
            {/* TODO: renderizar los elementos reales de {BLOCK_LABELS[type]}. */}
            <Card className="mt-6 border-dashed text-neutral-500">
              Contenido de {BLOCK_LABELS[type].toLowerCase()} pendiente
            </Card>
          </Container>
        </Section>
      );
    case 'gallery':
      return (
        <Section>
          <Container>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <div className="mt-6 grid grid-cols-3 gap-4">
              {[0, 1, 2].map((slot) => (
                <div key={slot} className="aspect-square rounded-md bg-neutral-200" />
              ))}
            </div>
          </Container>
        </Section>
      );
    case 'contact':
      return (
        <Section>
          <Container>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="mt-4 text-neutral-600">{str('email')}</p>
          </Container>
        </Section>
      );
    case 'cta':
      return (
        <Section className="bg-neutral-900 py-16 text-white">
          <Container className="flex flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-semibold">{title}</h2>
            <Button>{str('buttonLabel', 'Comenzar')}</Button>
          </Container>
        </Section>
      );
    case 'footer':
      return (
        <footer className="border-t border-neutral-200 py-8">
          <Container className="text-sm text-neutral-500">{str('copyright')}</Container>
        </footer>
      );
    case 'text':
      return (
        <Section className="py-8">
          <Container>
            <p className="text-neutral-700">{str('body')}</p>
          </Container>
        </Section>
      );
    case 'image': {
      const src = str('src');
      return (
        <Section className="py-8">
          <Container>
            {src ? (
              <img src={src} alt={str('alt')} className="w-full rounded-md" />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-md bg-neutral-200 text-neutral-500">
                {BLOCK_LABELS.image}
              </div>
            )}
          </Container>
        </Section>
      );
    }
    default:
      return assertNever(type);
  }
}
