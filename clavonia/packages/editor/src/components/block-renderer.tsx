import type { Block, BrandTheme } from '@clavonia/core';
import { BLOCK_LABELS } from '../labels';

export interface BlockRendererProps {
  block: Block;
  brand?: BrandTheme;
}

type Props = Record<string, unknown>;

// Colores por defecto cuando la página no tiene marca asignada.
const FALLBACK_BRAND: BrandTheme = {
  primary: '#40273B',
  secondary: '#F4EDE8',
  background: '#FFFFFF',
  text: '#1F1A1E',
  headingFont: 'Inter',
  bodyFont: 'Inter',
};

function text(props: Props, key: string, fallback = ''): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

function records(props: Props, key: string): Props[] {
  const value = props[key];
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Props => typeof item === 'object' && item !== null && !Array.isArray(item),
  );
}

function strings(props: Props, key: string): string[] {
  const value = props[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

// Solo se muestra <img> para URLs reales; los textos entre corchetes son marcadores de plantilla.
function isImageUrl(src: string): boolean {
  return /^(https?:\/\/|\/|data:image\/)/.test(src);
}

function assertNever(value: never): never {
  throw new Error(`Tipo de bloque no soportado: ${String(value)}`);
}

/** Renderiza un bloque con sus props reales y los colores de la marca. */
export function BlockRenderer({ block, brand = FALLBACK_BRAND }: BlockRendererProps) {
  const type = block.type;
  const props = block.props;
  const title = text(props, 'title', BLOCK_LABELS[type]);
  const headingStyle = { color: brand.primary, fontFamily: `"${brand.headingFont}", sans-serif` };
  const bodyStyle = { color: brand.text, fontFamily: `"${brand.bodyFont}", sans-serif` };
  const buttonStyle = { backgroundColor: brand.primary, color: brand.background };

  switch (type) {
    case 'hero':
      return (
        <section className="px-6 py-20 text-center" style={{ backgroundColor: brand.secondary }}>
          <h1 className="text-4xl font-bold" style={headingStyle}>
            {text(props, 'headline', BLOCK_LABELS.hero)}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg" style={bodyStyle}>
            {text(props, 'subheadline')}
          </p>
          {text(props, 'ctaLabel') && (
            <a
              href={text(props, 'ctaHref', '#')}
              className="mt-8 inline-block rounded-md px-6 py-3 font-medium"
              style={buttonStyle}
            >
              {text(props, 'ctaLabel')}
            </a>
          )}
        </section>
      );
    case 'about':
      return (
        <section className="px-6 py-14" style={bodyStyle}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed">{text(props, 'body')}</p>
        </section>
      );
    case 'services': {
      const items = records(props, 'items');
      return (
        <section className="px-6 py-14" style={bodyStyle}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {items.map((item, index) => (
              <article key={index} className="rounded-lg border p-5" style={{ borderColor: brand.secondary }}>
                <h3 className="font-semibold" style={headingStyle}>{text(item, 'name')}</h3>
                <p className="mt-2 text-sm">{text(item, 'description')}</p>
              </article>
            ))}
          </div>
        </section>
      );
    }
    case 'testimonials': {
      const items = records(props, 'items');
      return (
        <section className="px-6 py-14" style={{ ...bodyStyle, backgroundColor: brand.secondary }}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {items.map((item, index) => (
              <figure key={index} className="rounded-lg p-5" style={{ backgroundColor: brand.background }}>
                <blockquote className="italic">“{text(item, 'quote')}”</blockquote>
                <figcaption className="mt-3 text-sm font-medium">
                  {text(item, 'author')}
                  {text(item, 'role') && <span className="font-normal"> · {text(item, 'role')}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      );
    }
    case 'pricing': {
      const plans = records(props, 'plans');
      return (
        <section className="px-6 py-14" style={bodyStyle}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {plans.map((plan, index) => (
              <article key={index} className="rounded-lg border p-5" style={{ borderColor: brand.secondary }}>
                <h3 className="font-semibold" style={headingStyle}>{text(plan, 'name')}</h3>
                <p className="mt-2 text-2xl font-bold" style={headingStyle}>{text(plan, 'price')}</p>
                <ul className="mt-4 list-disc space-y-1 pl-5 text-sm">
                  {strings(plan, 'features').map((feature, featureIndex) => (
                    <li key={featureIndex}>{feature}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      );
    }
    case 'gallery': {
      const images = records(props, 'images');
      return (
        <section className="px-6 py-14" style={bodyStyle}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {images.map((image, index) => {
              const src = text(image, 'src');
              const alt = text(image, 'alt');
              return isImageUrl(src) ? (
                <img key={index} src={src} alt={alt} className="aspect-square w-full rounded-md object-cover" />
              ) : (
                <div
                  key={index}
                  role="img"
                  aria-label={alt}
                  className="flex aspect-square items-center justify-center rounded-md p-2 text-center text-xs"
                  style={{ backgroundColor: brand.secondary, color: brand.text }}
                >
                  {alt || 'Imagen pendiente'}
                </div>
              );
            })}
          </div>
        </section>
      );
    }
    case 'contact':
      return (
        <section className="px-6 py-14" style={bodyStyle}>
          <h2 className="text-2xl font-semibold" style={headingStyle}>{title}</h2>
          <ul className="mt-4 space-y-1">
            {['email', 'phone', 'address', 'hours']
              .map((key) => text(props, key))
              .filter((value) => value.length > 0)
              .map((value) => (
                <li key={value}>{value}</li>
              ))}
          </ul>
        </section>
      );
    case 'cta':
      return (
        <section className="px-6 py-16 text-center" style={{ backgroundColor: brand.primary, color: brand.background }}>
          <h2 className="text-3xl font-semibold" style={{ fontFamily: `"${brand.headingFont}", sans-serif` }}>
            {title}
          </h2>
          {text(props, 'description') && <p className="mx-auto mt-3 max-w-2xl">{text(props, 'description')}</p>}
          <a
            href={text(props, 'buttonHref', '#')}
            className="mt-6 inline-block rounded-md px-6 py-3 font-medium"
            style={{ backgroundColor: brand.background, color: brand.primary }}
          >
            {text(props, 'buttonLabel', 'Comenzar')}
          </a>
        </section>
      );
    case 'footer': {
      const lines = [text(props, 'businessName'), text(props, 'email'), text(props, 'phone'), text(props, 'address')]
        .filter((value) => value.length > 0);
      return (
        <footer className="border-t px-6 py-8 text-sm" style={{ ...bodyStyle, borderColor: brand.secondary }}>
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
          {text(props, 'copyright') && <p className="mt-2 opacity-70">{text(props, 'copyright')}</p>}
        </footer>
      );
    }
    case 'text':
      return (
        <section className="px-6 py-8" style={bodyStyle}>
          <p className="leading-relaxed">{text(props, 'body')}</p>
        </section>
      );
    case 'image': {
      const src = text(props, 'src');
      return (
        <section className="px-6 py-8">
          {isImageUrl(src) ? (
            <img src={src} alt={text(props, 'alt')} className="w-full rounded-md" />
          ) : (
            <div
              className="flex aspect-video items-center justify-center rounded-md"
              style={{ backgroundColor: brand.secondary, color: brand.text }}
            >
              {BLOCK_LABELS.image}
            </div>
          )}
        </section>
      );
    }
    default:
      return assertNever(type);
  }
}
