# Catálogo INV 2026 — proyecto para Vercel

Web app responsive de catálogo digital interactivo para lencería y corsetería.

## Incluye
- Next.js + React + TypeScript.
- PDF real `INV 2026` incluido en `public/assets/catalogo/pdf/inv-2026.pdf`.
- Renderizado de las 218 páginas con PDF.js en el navegador.
- Navegación anterior/siguiente, swipe táctil y zoom.
- Productos extraídos desde el PDF: **743 productos**.
- Hotspots aproximados: **727 hotspots**.
- Selector de talle, color y cantidad.
- Carrito con combinación por producto + talle + color.
- Pedido por WhatsApp.
- Lightbox con fondo oscuro y zoom.

## Ejecutar localmente
```bash
npm install
npm run dev
```
Abrir `http://localhost:3000`.

## Desplegar en Vercel
1. Subir esta carpeta a GitHub.
2. En Vercel, importar el repositorio.
3. Framework: Next.js.
4. Build command: `npm run build`.
5. Deploy.

## Archivos clave
```text
public/assets/catalogo/pdf/inv-2026.pdf
src/data/products.json
src/data/catalog-pages.json
src/data/hotspots.json
src/components/CatalogApp.tsx
src/lib/cart.ts
```

## Nota
Los hotspots se generaron automáticamente por cantidad de productos por página. Para producción, deben ajustarse con un editor visual de coordenadas.
