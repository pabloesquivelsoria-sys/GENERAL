import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { Block, BrandTheme } from '@clavonia/core';
import { BlockRenderer } from '../components/block-renderer';

const brand: BrandTheme = {
  primary: '#40273B',
  secondary: '#F4EDE8',
  background: '#FFFFFF',
  text: '#1F1A1E',
  headingFont: 'Playfair Display',
  bodyFont: 'Lora',
};

function render(block: Block) {
  return renderToStaticMarkup(<BlockRenderer block={block} brand={brand} />);
}

describe('BlockRenderer', () => {
  it('muestra el titular y el botón de la plantilla con los colores de la marca', () => {
    const html = render({
      id: 'b1',
      type: 'hero',
      props: { headline: 'Dulce Methow', subheadline: 'Pan dulce', ctaLabel: 'Pide ya', ctaHref: '#pedidos' },
    });
    expect(html).toContain('Dulce Methow');
    expect(html).toContain('Pide ya');
    expect(html).toContain('#pedidos');
    expect(html).toContain('#40273B');
    expect(html).toContain('Playfair Display');
  });

  it('muestra marcadores de plantilla en vez de <img> cuando la imagen no es una URL', () => {
    const html = render({
      id: 'b2',
      type: 'gallery',
      props: { title: 'Galería', images: [{ src: '[imagen 1]', alt: 'Pan de muerto' }] },
    });
    expect(html).not.toContain('<img');
    expect(html).toContain('Pan de muerto');
  });

  it('muestra <img> para URLs reales', () => {
    const html = render({
      id: 'b3',
      type: 'gallery',
      props: { images: [{ src: 'https://example.com/pan.jpg', alt: 'Conchas' }] },
    });
    expect(html).toContain('<img');
    expect(html).toContain('https://example.com/pan.jpg');
  });
});
