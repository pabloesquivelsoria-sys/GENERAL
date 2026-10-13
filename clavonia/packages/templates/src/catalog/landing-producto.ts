import type { TemplateDefinition } from '../types';
import { createBlock, createPage } from './helpers';

// Single-page landing that sells one product with its price and a call to action.
export const landingProductoTemplate: TemplateDefinition = {
  id: 'landing-producto',
  name: 'Landing de producto',
  kind: 'landing',
  category: 'producto',
  description: 'Una página para vender un producto con galería, precio y botón de compra.',
  build() {
    return [
      createPage('inicio', 'Inicio', [
        createBlock('hero', {
          headline: '[nombre del producto]',
          subheadline: '[beneficio principal del producto] para [público objetivo].',
          ctaLabel: 'Comprar ahora',
          ctaHref: '#precio',
        }),
        createBlock('about', {
          title: 'Por qué [nombre del producto]',
          body: '[Describe el problema que resuelve y qué lo hace diferente de otras opciones].',
        }),
        createBlock('gallery', {
          title: 'Mira el producto',
          images: [
            { src: '[imagen del producto 1]', alt: '[descripción de la imagen 1]' },
            { src: '[imagen del producto 2]', alt: '[descripción de la imagen 2]' },
            { src: '[imagen del producto 3]', alt: '[descripción de la imagen 3]' },
          ],
        }),
        createBlock('pricing', {
          title: 'Precio',
          plans: [
            {
              name: '[nombre de la presentación]',
              price: '[precio]',
              features: ['[beneficio incluido 1]', '[beneficio incluido 2]', '[beneficio incluido 3]'],
            },
          ],
        }),
        createBlock('cta', {
          title: 'Lleva [nombre del producto] hoy',
          description: 'Envío a todo el país y garantía de [días] días.',
          buttonLabel: 'Comprar ahora',
          buttonHref: '#precio',
        }),
        createBlock('footer', {
          businessName: '[nombre del negocio]',
          email: '[correo de contacto]',
          copyright: '© [año] [nombre del negocio]. Todos los derechos reservados.',
        }),
      ]),
    ];
  },
};
