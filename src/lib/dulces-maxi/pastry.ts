import { WHATSAPP_NUMBER } from './products';

export type PastryCategory = 'torta' | 'tarta' | 'mesa_dulce';

export const PASTRY_PRODUCTS: Record<PastryCategory, string[]> = {
  torta: ['Torta de manteca por encargo', 'Torta personalizada'],
  tarta: [
    'Lemon pie · molde Nº 22',
    'Orange pie · molde Nº 22',
    'Tarta de frutilla · molde Nº 22',
    'Cabsha · molde Nº 22',
    'Crumble de manzana · molde Nº 22',
    'Cheesecake · molde Nº 22',
  ],
  mesa_dulce: ['Cupcakes temáticos con crema de manteca', 'Mesa dulce personalizada'],
};

export const PASTRY_CATEGORY_LABELS: Record<PastryCategory, string> = {
  torta: 'Tortas',
  tarta: 'Tartas',
  mesa_dulce: 'Mesas dulces',
};

export const COVER_OPTIONS: [string, string][] = [
  ['merengue_italiano', 'Merengue italiano'],
  ['chocolate_cobertura', 'Chocolate cobertura'],
  ['crema_manteca_frutas', 'Crema de manteca y frutas de estación'],
  ['otra', 'Otra cobertura (detallar en la descripción)'],
];

export const PRESENTATION_OPTIONS: [string, string][] = [
  ['individual', 'Individual'],
  ['mini_porcion', 'Mini porción'],
  ['vasito', 'Vasito'],
  ['bandeja', 'Bandeja'],
  ['mesa_armada', 'Mesa armada'],
  ['otro', 'Otra presentación'],
];

export interface TartPhoto {
  src: string;
  alt: string;
  position?: string;
}

export const TART_OPTIONS: [string, string, TartPhoto[]?][] = [
  [
    'Lemon pie · molde Nº 22',
    'Crema de limón y terminación de merengue.',
    [
      {
        src: '/assets/dulces-maxi/pasteleria/lemon-pie-completo.webp',
        alt: 'Lemon pie artesanal completo con abundante merengue italiano',
      },
      {
        src: '/assets/dulces-maxi/pasteleria/lemon-pie-corte.webp',
        alt: 'Corte de lemon pie con crema de limón y merengue italiano',
      },
    ],
  ],
  ['Orange pie · molde Nº 22', 'Versión cítrica de naranja en molde Nº 22.'],
  [
    'Tarta de frutilla · molde Nº 22',
    'Frutillas de estación sobre una base artesanal.',
    [
      {
        src: '/assets/dulces-maxi/pasteleria/tarta-frutilla.webp',
        alt: 'Tarta artesanal con crema y frutillas frescas en mitades',
        position: 'center 42%',
      },
    ],
  ],
  ['Cabsha · molde Nº 22', 'Dulce de leche repostero y chocolate semiamargo.'],
  ['Crumble de manzana · molde Nº 22', 'Manzanas y cubierta crocante artesanal.'],
  ['Cheesecake · molde Nº 22', 'Tarta cremosa de queso en molde Nº 22.'],
];

export interface DessertItem {
  dessert_name: string;
  quantity: string;
  presentation_mode: string;
}

export const emptyDessert = (): DessertItem => ({
  dessert_name: '',
  quantity: '12',
  presentation_mode: 'individual',
});

export interface PastryForm {
  catalog_product_id: string;
  category: PastryCategory;
  product_name: string;
  cake_name: string;
  desired_kg: string;
  servings: string;
  event_date: string;
  cover: string;
  dessert_items: DessertItem[];
  budget_amount: string;
  description: string;
  customer_name: string;
  phone: string;
  email: string;
  consent_terms: boolean;
  website: string;
}

export const INITIAL_PASTRY_FORM: PastryForm = {
  catalog_product_id: '',
  category: 'torta',
  product_name: PASTRY_PRODUCTS.torta[0],
  cake_name: '',
  desired_kg: '1',
  servings: '',
  event_date: '',
  cover: 'merengue_italiano',
  dessert_items: [emptyDessert()],
  budget_amount: '',
  description: '',
  customer_name: '',
  phone: '',
  email: '',
  consent_terms: false,
  website: '',
};

export function isPastryCategory(value: string): value is PastryCategory {
  return value === 'torta' || value === 'tarta' || value === 'mesa_dulce';
}

export function isCustomDessertTable(form: Pick<PastryForm, 'category' | 'product_name'>): boolean {
  return form.category === 'mesa_dulce' && form.product_name === 'Mesa dulce personalizada';
}

/** Devuelve un mensaje de error o `null` si el formulario es válido. */
export function validatePastryForm(form: PastryForm, photoCount = 0): string | null {
  if (isCustomDessertTable(form)) {
    const invalid = form.dessert_items.find(
      (item) =>
        item.dessert_name.trim().length < 2 ||
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) < 1 ||
        Number(item.quantity) > 1000,
    );
    if (invalid) return 'Completá el nombre y una cantidad válida para cada postre.';
    if (!Number.isFinite(Number(form.budget_amount)) || Number(form.budget_amount) <= 0) {
      return 'Indicá cuánto tenés pensado gastar.';
    }
  }
  if (form.product_name === 'Torta personalizada' && form.cake_name.trim().length < 2) {
    return 'Indicá el nombre o estilo de la torta.';
  }
  if (form.category === 'torta') {
    const kg = Number(form.desired_kg);
    if (!Number.isFinite(kg) || kg < 0.5 || kg > 30) return 'Indicá una cantidad de kilos entre 0,5 y 30.';
  }
  if (form.description.trim().length < 10) {
    return 'Describí el encargo con al menos 10 caracteres.';
  }
  if (form.customer_name.trim().length < 2) return 'Ingresá tu nombre y apellido.';
  if (form.phone.trim().length < 6) return 'Ingresá un teléfono de contacto válido.';
  if (!form.consent_terms) return 'Para continuar, aceptá el uso de tus datos para responder el presupuesto.';
  if (photoCount > 5) return 'Podés adjuntar hasta 5 fotos.';
  return null;
}

const COVER_LABEL = Object.fromEntries(COVER_OPTIONS);
const PRESENTATION_LABEL = Object.fromEntries(PRESENTATION_OPTIONS);

export function buildPastryMessage(form: PastryForm, requestNumber: string, photoCount = 0): string {
  const lines: (string | null)[] = [
    '¡Hola! Quiero solicitar un presupuesto de pastelería en Dulces Maxi:',
    '',
    `Solicitud: ${requestNumber}`,
    `Tipo: ${PASTRY_CATEGORY_LABELS[form.category]}`,
    `Producto: ${form.product_name}`,
    form.product_name === 'Torta personalizada' && form.cake_name ? `Torta: ${form.cake_name}` : null,
    form.category === 'torta' ? `Kilos: ${form.desired_kg}` : null,
    form.category === 'torta' && form.cover !== 'no_aplica'
      ? `Cobertura: ${COVER_LABEL[form.cover] || form.cover}`
      : null,
    form.servings ? `Porciones estimadas: ${form.servings}` : null,
    form.event_date ? `Fecha del evento: ${form.event_date}` : null,
  ];
  if (isCustomDessertTable(form)) {
    lines.push('', 'Postres:');
    form.dessert_items.forEach((item) => {
      lines.push(
        `• ${item.quantity} x ${item.dessert_name} (${PRESENTATION_LABEL[item.presentation_mode] || item.presentation_mode})`,
      );
    });
    lines.push(`Presupuesto disponible: ${form.budget_amount} ARS`);
  }
  lines.push(
    '',
    `Descripción: ${form.description.trim()}`,
    photoCount > 0 ? `Adjunto ${photoCount} foto${photoCount === 1 ? '' : 's'} de referencia por este chat.` : null,
    '',
    `Nombre: ${form.customer_name.trim()}`,
    `Teléfono: ${form.phone.trim()}`,
    form.email.trim() ? `Email: ${form.email.trim()}` : null,
    '',
    'Quedo a la espera del presupuesto. ¡Gracias!',
  );
  return lines.filter((line): line is string => line !== null).join('\n');
}

export function buildPastryWhatsAppUrl(form: PastryForm, requestNumber: string, photoCount = 0): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(buildPastryMessage(form, requestNumber, photoCount))}`;
}
