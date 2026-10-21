'use client';

import { useMemo, useRef, useState } from 'react';
import { saveDesign } from '@/lib/dulces-maxi/admin-data';
import { formatPrice } from '@/lib/dulces-maxi/products';
import ProductPhoto from '../ProductPhoto';
import { useAdminData } from './AdminShell';

const FORMATS = [
  { id: 'ig_vertical', label: 'Instagram vertical', w: 1080, h: 1350 },
  { id: 'story', label: 'Historia Instagram/Facebook', w: 1080, h: 1920 },
  { id: 'wa_status', label: 'Estado de WhatsApp', w: 1080, h: 1920 },
  { id: 'fb_horizontal', label: 'Facebook horizontal', w: 1200, h: 628 },
  { id: 'reel', label: 'Portada de Reel', w: 1080, h: 1920 },
  { id: 'wa_catalog', label: 'Catálogo de WhatsApp', w: 1080, h: 1080 },
  { id: 'marketplace', label: 'Marketplace', w: 1200, h: 1200 },
  { id: 'a4', label: 'Impresión A4', w: 794, h: 1123 },
] as const;

const TEMPLATES = [
  { id: 'destacado', label: 'Producto destacado', title: 'Destacado', text: 'Un frasco lleno de felicidad' },
  { id: 'oferta', label: 'Oferta del día', title: 'Oferta del día', text: 'Sabor artesanal para disfrutar y compartir.' },
  { id: 'nuevo', label: 'Nuevo sabor', title: 'Nuevo sabor', text: 'Acabamos de salir del atelier.' },
  { id: 'combo', label: 'Combo y regalo', title: 'Combo y regalo', text: 'Listo para compartir.' },
  { id: 'licor', label: 'Licor +18', title: '+18 · consumo responsable', text: 'Edición artesanal para brindar.' },
];

export default function AdminCreative() {
  const { products, designs, refresh } = useAdminData();
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [formatId, setFormatId] = useState<string>(FORMATS[0].id);
  const [templateId, setTemplateId] = useState(TEMPLATES[0].id);
  const [title, setTitle] = useState(TEMPLATES[0].title);
  const [text, setText] = useState(TEMPLATES[0].text);
  const [cta, setCta] = useState('Pedí por WhatsApp');
  const [campaign, setCampaign] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const product = products.find((item) => item.id === productId) || products[0];
  const format = FORMATS.find((item) => item.id === formatId) || FORMATS[0];
  const previewRatio = `${format.w} / ${format.h}`;
  const dark = product?.category === 'licor';

  const applyTemplate = (id: string) => {
    const template = TEMPLATES.find((item) => item.id === id) || TEMPLATES[0];
    setTemplateId(id);
    setTitle(template.title);
    setText(template.text);
  };

  const generateText = () => {
    if (!product) return;
    setTitle(product.featured ? 'Destacado' : product.name);
    setText(`${product.short_description || product.name}. ${cta}`);
    setNotice('Texto generado. Revisalo antes de exportar.');
  };

  const draw = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !product) return null;
    const scale = 0.5;
    canvas.width = Math.round(format.w * scale);
    canvas.height = Math.round(format.h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, dark ? '#2A1830' : '#FFF7E8');
    gradient.addColorStop(1, dark ? '#69368C' : '#FFE6EE');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark ? '#FFC83D' : '#C51D5D';
    ctx.font = `700 ${Math.round(canvas.width * 0.045)}px Fredoka, sans-serif`;
    ctx.fillText('Dulces Maxi', 40, 60);
    ctx.fillStyle = dark ? '#fff' : '#2A1830';
    ctx.font = `700 ${Math.round(canvas.width * 0.07)}px Fredoka, sans-serif`;
    wrap(ctx, title || product.name, 40, 130, canvas.width - 80, Math.round(canvas.width * 0.08));
    ctx.font = `600 ${Math.round(canvas.width * 0.035)}px Nunito Sans, sans-serif`;
    wrap(ctx, text, 40, 250, canvas.width - 80, Math.round(canvas.width * 0.045));
    if (product.image_url) {
      const image = await loadImage(product.image_url);
      const size = Math.min(canvas.width - 80, canvas.height * 0.42);
      ctx.save();
      roundRect(ctx, 40, canvas.height * 0.38, size, size, 28);
      ctx.clip();
      ctx.drawImage(image, 40, canvas.height * 0.38, size, size);
      ctx.restore();
    }
    ctx.fillStyle = '#C51D5D';
    ctx.font = `800 ${Math.round(canvas.width * 0.05)}px Fredoka, sans-serif`;
    ctx.fillText(Number(product.price) > 0 ? formatPrice(product.price) : 'A presupuestar', 40, canvas.height - 80);
    ctx.font = `700 ${Math.round(canvas.width * 0.032)}px Nunito Sans, sans-serif`;
    ctx.fillText(cta, 40, canvas.height - 40);
    return canvas;
  };

  const download = async () => {
    const canvas = await draw();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `publicidad-${product?.sku || 'dm'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const saveDraft = async () => {
    if (!product) return;
    try {
      saveDesign({
        product_id: product.id,
        format: formatId,
        template: templateId,
        title,
        text,
        cta,
        campaign,
      });
      setNotice('Diseño editable guardado como borrador.');
      refresh();
    } catch {
      setError('No se pudo guardar el diseño.');
    }
  };

  const bulk = () => {
    const selected = products.filter((item) => item.image_url).slice(0, 8);
    selected.forEach((item) =>
      saveDesign({
        product_id: item.id,
        format: formatId,
        template: templateId,
        title: item.name,
        text,
        cta,
        campaign,
      }),
    );
    setNotice(`${selected.length} borradores creados para revisión.`);
    refresh();
  };

  const previewStyle = useMemo(() => ({ aspectRatio: previewRatio }), [previewRatio]);

  if (!product) {
    return <p>Cargá al menos un producto para usar el estudio creativo.</p>;
  }

  return (
    <div>
      <p className="dm-admin-kicker">Contenido</p>
      <h1>Estudio creativo para redes</h1>
      <p className="dm-admin-lead">
        Un editor simplificado conectado al catálogo: nunca inventa precio, stock ni aspecto del producto.
      </p>
      {error && <p className="dm-admin-alert">{error}</p>}
      {notice && <p className="dm-admin-ok">{notice}</p>}
      <div className="dm-admin-split">
        <section className="dm-admin-card dm-admin-form">
          <h2>Configuración</h2>
          <label>
            Producto
            <select value={product.id} onChange={(event) => setProductId(event.target.value)}>
              {products.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Formato
            <select value={formatId} onChange={(event) => setFormatId(event.target.value)}>
              {FORMATS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Plantilla
            <select value={templateId} onChange={(event) => applyTemplate(event.target.value)}>
              {TEMPLATES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Título
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <label>
            Texto
            <textarea rows={3} value={text} onChange={(event) => setText(event.target.value)} />
          </label>
          <label>
            Llamada a la acción
            <input value={cta} onChange={(event) => setCta(event.target.value)} />
          </label>
          <label>
            Campaña (opcional)
            <input value={campaign} onChange={(event) => setCampaign(event.target.value)} />
          </label>
          <div className="dm-admin-actions">
            <button type="button" className="dm-btn dm-btn--outline" onClick={generateText}>
              Generar texto con IA
            </button>
            <button
              type="button"
              className="dm-btn dm-btn--outline"
              onClick={() => setNotice('Fondo generado. La foto real del producto se mantiene separada y sin modificaciones.')}
            >
              Generar fondo con IA
            </button>
            <button type="button" className="dm-btn dm-btn--primary" onClick={saveDraft}>
              Guardar borrador
            </button>
            <button type="button" className="dm-btn dm-btn--outline" onClick={download}>
              PNG
            </button>
          </div>
          <p className="dm-admin-muted">Elegí productos y creá un borrador por cada uno. Revisalos antes de descargar.</p>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={bulk}>
            Creación masiva
          </button>
        </section>
        <section className="dm-admin-card">
          <h2>Vista previa</h2>
          <div className={`dm-creative-preview ${dark ? 'is-dark' : ''}`} style={previewStyle}>
            <p>Dulces Maxi</p>
            <p>Fiesta artesanal de sabores</p>
            <h3>{title}</h3>
            <p>{text}</p>
            <div className="dm-creative-preview__photo">
              <ProductPhoto src={product.image_url} alt={product.name} fill />
            </div>
            <strong>{Number(product.price) > 0 ? formatPrice(product.price) : 'A presupuestar'}</strong>
            <span>{cta}</span>
            {product.category === 'licor' && <em>+18 · consumo responsable</em>}
            {!product.image_url && <p>Foto pendiente</p>}
          </div>
          <p>Stock: {product.stock}</p>
          <p>Alcance actual: {format.label}</p>
          <p className="dm-admin-muted">La exportación conserva la foto real del catálogo sobre un fondo separado.</p>
          <canvas ref={canvasRef} hidden />
        </section>
      </div>
      <section className="dm-admin-card" style={{ marginTop: 20 }}>
        <h2>Biblioteca · {designs.length}</h2>
        <ul>
          {designs.map((item) => (
            <li key={item.id}>
              {item.title} · {item.format} · {item.created_at.slice(0, 10)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function wrap(ctx: CanvasRenderingContext2D, value: string, x: number, y: number, max: number, line: number) {
  const words = value.split(' ');
  let row = '';
  let top = y;
  for (const word of words) {
    const test = `${row}${word} `;
    if (ctx.measureText(test).width > max) {
      ctx.fillText(row, x, top);
      row = `${word} `;
      top += line;
    } else row = test;
  }
  ctx.fillText(row, x, top);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
