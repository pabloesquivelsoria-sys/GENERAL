import type { TemplateDefinition } from '../types';
import { createBlock, createPage } from './helpers';

// Multi-page website for a local shop: a home page and a menu page.
export const sitioNegocioLocalTemplate: TemplateDefinition = {
  id: 'sitio-negocio-local',
  name: 'Sitio de negocio local',
  kind: 'website',
  category: 'negocio local',
  description: 'Sitio con inicio, menú de servicios y precios, y datos de contacto para tu tienda.',
  build() {
    const footer = () =>
      createBlock('footer', {
        businessName: '[nombre del negocio]',
        address: '[dirección]',
        phone: '[teléfono]',
        copyright: '© [año] [nombre del negocio]. Todos los derechos reservados.',
      });

    return [
      createPage('inicio', 'Inicio', [
        createBlock('hero', {
          headline: '[nombre del negocio] en [ciudad]',
          subheadline: '[slogan o descripción corta de tu negocio].',
          ctaLabel: 'Ver menú',
          ctaHref: '/menu',
        }),
        createBlock('about', {
          title: 'Sobre nosotros',
          body: '[Historia del negocio, años de experiencia y lo que nos distingue].',
        }),
        createBlock('services', {
          title: 'Lo que ofrecemos',
          items: [
            { name: '[servicio o producto 1]', description: '[descripción breve]' },
            { name: '[servicio o producto 2]', description: '[descripción breve]' },
            { name: '[servicio o producto 3]', description: '[descripción breve]' },
          ],
        }),
        createBlock('contact', {
          title: 'Visítanos',
          address: '[dirección]',
          phone: '[teléfono]',
          email: '[correo de contacto]',
          hours: '[horario de atención]',
        }),
        footer(),
      ]),
      createPage('menu', 'Menú', [
        createBlock('services', {
          title: 'Nuestro menú',
          items: [
            { name: '[nombre del servicio o producto 1]', description: '[descripción breve]' },
            { name: '[nombre del servicio o producto 2]', description: '[descripción breve]' },
            { name: '[nombre del servicio o producto 3]', description: '[descripción breve]' },
          ],
        }),
        createBlock('pricing', {
          title: 'Precios',
          plans: [
            {
              name: '[nombre de la opción]',
              price: '[precio]',
              features: ['[detalle incluido 1]', '[detalle incluido 2]'],
            },
          ],
        }),
        footer(),
      ]),
    ];
  },
};
