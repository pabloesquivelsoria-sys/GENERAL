import type { TemplateDefinition } from '../types';
import { createBlock, createPage } from './helpers';

// Single-page landing that presents a service and captures leads.
export const landingServiciosTemplate: TemplateDefinition = {
  id: 'landing-servicios',
  name: 'Landing de servicios',
  kind: 'landing',
  category: 'servicios',
  description: 'Una página para presentar tus servicios y recibir solicitudes de cotización.',
  build() {
    return [
      createPage('inicio', 'Inicio', [
        createBlock('hero', {
          headline: '[nombre del negocio]: [propuesta de valor]',
          subheadline: 'Ayudamos a [público objetivo] a [resultado principal] sin complicaciones.',
          ctaLabel: 'Solicita una cotización',
          ctaHref: '#contacto',
        }),
        createBlock('services', {
          title: 'Nuestros servicios',
          items: [
            { name: '[nombre del servicio 1]', description: '[descripción breve del servicio 1]' },
            { name: '[nombre del servicio 2]', description: '[descripción breve del servicio 2]' },
            { name: '[nombre del servicio 3]', description: '[descripción breve del servicio 3]' },
          ],
        }),
        createBlock('testimonials', {
          title: 'Lo que dicen nuestros clientes',
          items: [
            {
              author: '[nombre del cliente]',
              role: '[cargo o ciudad]',
              quote: '[testimonio del cliente]',
            },
          ],
        }),
        createBlock('cta', {
          title: '¿Listo para empezar?',
          description: 'Cuéntanos tu necesidad y te responderemos en menos de 24 horas.',
          buttonLabel: 'Quiero mi cotización',
          buttonHref: '#contacto',
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
