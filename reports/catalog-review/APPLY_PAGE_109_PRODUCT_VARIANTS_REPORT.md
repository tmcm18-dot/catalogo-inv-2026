# Informe — Variantes de productos página 109

## Alcance

Corrección controlada de variantes para los productos comerciales **101** y **107** de la página 109 del catálogo INV 2026.

Rama: `agent/fix-page-109-product-variants`

No se modifican hotspots, imágenes, componentes, estilos, carrito, WhatsApp ni otros productos.

## Fuente de verdad

Se verificó la página 109 mediante:

1. capa de texto seleccionable de `public/assets/catalogo/pdf/inv-2026.pdf`;
2. inspección visual de la imagen de la página 109;
3. relación producto/hotspot documentada en el PR #21.

Texto documental relevante:

- Producto 101: `T: S, M, L y XL C: Blanco, Negro y Nude`
- Producto 107: `T: S al XXL C: Cásico (Blanco, Negro y Nude)`

Se conserva **“Cásico”** tal como aparece en la fuente. No se normaliza a “Clásico” porque eso sería una corrección editorial no confirmada.

## Identificador interno del producto 101

El producto comercial 101 continúa con el identificador interno `109`.

Esta relación fue confirmada en el PR #21 y se mantiene para no romper:

- `hotspot-109`;
- el fixture E2E de la página 109;
- la apertura del modal;
- la búsqueda y las relaciones cruzadas existentes.

## Cambios

| Producto | Campo | Antes | Después |
|---|---|---|---|
| 101 (id interno 109) | talles | S, M, L, XL | sin cambios |
| 101 (id interno 109) | colores | `Blanco, Negro`; `Nude LÍNEA PREMIUM CALCE PERFECTO SEAMLESS CON TAZA` | `Blanco`; `Negro`; `Nude` |
| 107 (id 107-p109) | talles | `S AL XXL` | `S`; `M`; `L`; `XL`; `XXL` |
| 107 (id 107-p109) | colores | `Cásico (Blanco, Negro`; `Nude) PACK X 3 PACK X` | `Cásico (Blanco, Negro y Nude)` |

## Prueba de regresión

Se amplía `tests/page-109-fixture.test.ts` para comprobar:

- la relación del producto comercial 101 con el id interno `109`;
- los talles y colores exactos de 101;
- los talles expandidos de 107;
- la combinación de color exacta de 107.

## Validación requerida por el PR

Los workflows deben ejecutar:

- `npm run validate:data`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run build`

El PR no debe fusionarse hasta que estas comprobaciones y la vista previa de Vercel estén aprobadas.

## Revalidación de infraestructura

El enlace GitHub–Vercel del proyecto `catalogo-inv-2026` fue restablecido el 2026-08-01.
Este commit documental vuelve a activar la Preview del PR #22 sin modificar datos, componentes, estilos, hotspots ni producción.
