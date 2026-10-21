export type LegalPageType = 'terminos' | 'privacidad' | 'entregas' | 'alcohol';

export interface LegalPageContent {
  title: string;
  sections: [string, string][];
}

export const LEGAL_PAGES: Record<LegalPageType, LegalPageContent> = {
  terminos: {
    title: 'Términos y condiciones',
    sections: [
      [
        'Alcance',
        'Dulces Maxi ofrece un catálogo digital y permite registrar solicitudes de pedido. Abrir WhatsApp no confirma la venta, disponibilidad, entrega ni pago. Elegir Mercado Pago deriva al entorno de ese proveedor y el cobro solo se registra cuando su API lo verifica.',
      ],
      [
        'Pedidos',
        'El negocio revisará stock, precio, zona de entrega y restricciones antes de confirmar cada pedido. Un pago aprobado no reemplaza la confirmación operativa del pedido.',
      ],
      [
        'Pagos y reembolsos',
        'Mercado Pago procesa los medios de pago en su propio entorno. Cancelar un pedido dentro del panel de Dulces Maxi no genera por sí solo un reembolso; el procedimiento definitivo debe ser revisado antes del lanzamiento.',
      ],
      [
        'Productos',
        'Las fotografías, ingredientes, alérgenos, lotes y vencimientos deben ser verificados por el responsable antes de publicar.',
      ],
      [
        'Arrepentimiento y cambios',
        'La política definitiva deberá contemplar las reglas aplicables a ventas a distancia y productos alimenticios o perecederos.',
      ],
    ],
  },
  privacidad: {
    title: 'Política de privacidad',
    sections: [
      [
        'Datos utilizados',
        'Se solicitan los datos mínimos para gestionar pedidos. La analítica opcional registra eventos sin incluir datos personales en sus propiedades. Dulces Maxi guarda referencias y estados de Mercado Pago, pero no almacena los datos completos de la tarjeta.',
      ],
      [
        'Finalidades',
        'Gestión del pedido y del pago, seguridad, mejora de la tienda y, únicamente con autorización, comunicaciones comerciales.',
      ],
      [
        'Derechos',
        'La persona podrá solicitar acceso, corrección o eliminación cuando corresponda. Algunos registros podrían conservarse por obligaciones fiscales o de seguridad.',
      ],
      [
        'Contacto',
        'Canal provisorio: WhatsApp 387 610-6268. Debe definirse un correo formal para solicitudes de privacidad.',
      ],
    ],
  },
  entregas: {
    title: 'Entregas, retiros y cambios',
    sections: [
      [
        'Cobertura',
        'Retiro o envío a coordinar en Salta. Zonas, costos y horarios todavía deben ser configurados por el negocio.',
      ],
      [
        'Confirmación',
        'Ninguna entrega queda acordada hasta que Dulces Maxi confirme el pedido por un canal autorizado.',
      ],
      ['Productos con alcohol', 'La entrega requiere una persona mayor de 18 años y verificación de edad.'],
      [
        'Incidencias',
        'Roturas, faltantes o productos en mal estado deben informarse con el número de pedido y evidencia razonable.',
      ],
    ],
  },
  alcohol: {
    title: 'Consumo responsable',
    sections: [
      [
        'Mayores de edad',
        'La venta y entrega de bebidas alcohólicas está reservada exclusivamente a mayores de 18 años.',
      ],
      [
        'Verificación',
        'La declaración digital no reemplaza la verificación al entregar. No se almacena una copia completa del documento.',
      ],
      [
        'Comunicación',
        'La publicidad no debe dirigirse a menores ni asociar el alcohol con salud, rendimiento, sexualidad o violencia.',
      ],
      [
        'Revisión local',
        'Habilitaciones, horarios, zonas de venta y textos obligatorios deben ser confirmados por el responsable del negocio.',
      ],
    ],
  },
};
