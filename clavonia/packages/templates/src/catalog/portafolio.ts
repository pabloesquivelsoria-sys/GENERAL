import type { TemplateDefinition } from '../types';
import { createBlock, createPage } from './helpers';

// Single-page portfolio for a freelancer to show work and get in touch.
export const portafolioTemplate: TemplateDefinition = {
  id: 'portafolio',
  name: 'Portafolio freelance',
  kind: 'website',
  category: 'freelance',
  description: 'Sitio personal para mostrar tus trabajos, tu perfil y cómo contactarte.',
  build() {
    return [
      createPage('inicio', 'Inicio', [
        createBlock('hero', {
          headline: '[tu nombre], [tu profesión]',
          subheadline: 'Creo [tipo de trabajo] para [tipo de cliente].',
          ctaLabel: 'Hablemos de tu proyecto',
          ctaHref: '#contacto',
        }),
        createBlock('gallery', {
          title: 'Trabajos seleccionados',
          images: [
            { src: '[imagen del proyecto 1]', alt: '[nombre del proyecto 1]' },
            { src: '[imagen del proyecto 2]', alt: '[nombre del proyecto 2]' },
            { src: '[imagen del proyecto 3]', alt: '[nombre del proyecto 3]' },
          ],
        }),
        createBlock('about', {
          title: 'Sobre mí',
          body: '[Experiencia, especialidad y forma de trabajar].',
        }),
        createBlock('contact', {
          title: 'Contacto',
          email: '[correo de contacto]',
          phone: '[teléfono]',
          hours: '[disponibilidad]',
        }),
      ]),
    ];
  },
};
