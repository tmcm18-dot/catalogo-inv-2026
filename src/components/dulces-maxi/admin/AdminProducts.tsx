'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, Pencil, Plus, RotateCcw, X } from 'lucide-react';
import {
  applyPricing,
  deleteProduct,
  emptyProductDraft,
  upsertProduct,
  validateProduct,
} from '@/lib/dulces-maxi/catalog';
import { compressImage } from '@/lib/dulces-maxi/images';
import { CSV_HEADERS, parseCsv } from '@/lib/dulces-maxi/pricing';
import {
  CATEGORY_LABELS,
  formatPrice,
  type Product,
  type ProductCategory,
} from '@/lib/dulces-maxi/products';
import ProductPhoto from '../ProductPhoto';
import { useAdminData } from './AdminShell';

const CATEGORIES: ProductCategory[] = [
  'mermelada',
  'dulce_regional',
  'pasteleria',
  'licor',
  'combo',
  'edicion_especial',
];

function toDraft(product: Product): Product {
  return {
    ...emptyProductDraft(),
    ...product,
    gallery: product.gallery?.length ? product.gallery : product.image_url ? [product.image_url] : [],
  };
}

export default function AdminProducts() {
  const { products, refresh } = useAdminData();
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<Product>(emptyProductDraft());
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [csvRows, setCsvRows] = useState<{ row: number; product: Product; error?: string }[]>([]);
  const [lastImport, setLastImport] = useState<Product[] | null>(null);

  const priced = useMemo(() => applyPricing(draft), [draft]);
  const open = (product?: Product) => {
    setError('');
    setNotice('');
    setDraft(product ? toDraft(product) : emptyProductDraft());
    setEditing(product || emptyProductDraft());
  };

  const save = (event: FormEvent) => {
    event.preventDefault();
    const payload = applyPricing({
      ...draft,
      gallery: draft.gallery || [],
      image_url: draft.gallery?.[0] || '',
    });
    const problem = validateProduct(payload, payload.id);
    if (problem) {
      setError(problem);
      return;
    }
    if (payload.category === 'pasteleria' && !(payload.gallery && payload.gallery[0]) && !payload.image_url) {
      setNotice('Producto creado. Falta cargar una foto.');
    }
    setSaving(true);
    upsertProduct(payload);
    setSaving(false);
    setNotice(payload.id && products.some((item) => item.id === payload.id) ? 'Producto actualizado.' : 'Producto creado.');
    setEditing(null);
    refresh();
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    const current = draft.gallery || [];
    if (current.length >= 8) {
      setError('Este producto ya tiene el máximo de 8 fotos.');
      return;
    }
    try {
      const extra = await Promise.all(
        Array.from(files)
          .slice(0, 8 - current.length)
          .map((file) => compressImage(file)),
      );
      setDraft({ ...draft, gallery: [...current, ...extra], image_url: current[0] || extra[0] });
    } catch {
      setError('No pudimos subir una o más imágenes.');
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([[CSV_HEADERS.join(','), 'DM-MER-EJ-250,Producto de ejemplo,Descripción breve,Descripción completa,mermelada,,500 g,10,3,2000,200,manual,,2500,,,,activo'].join('\n')], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plantilla-productos-dulces-maxi.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const onCsv = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const parsed = parseCsv(text);
    setCsvRows(
      parsed.map((row) => {
        const cell = (key: string) => String(row[key] ?? '');
        const method = cell('metodo_precio') === 'markup' || cell('metodo_precio') === 'margen_real' ? cell('metodo_precio') : 'manual';
        const product = applyPricing({
          ...emptyProductDraft(),
          sku: cell('sku'),
          name: cell('nombre'),
          short_description: cell('descripcion_corta'),
          description: cell('descripcion_completa'),
          category: (cell('categoria') as ProductCategory) || 'mermelada',
          subcategory: cell('subcategoria'),
          size: cell('peso_o_volumen'),
          stock: Number(cell('stock')) || 0,
          minimum_stock: Number(cell('stock_minimo')) || 3,
          cost_price: Number(cell('precio_costo')) || 0,
          additional_costs: Number(cell('costos_adicionales')) || 0,
          pricing_method: method,
          markup_percentage: method === 'markup' ? Number(cell('porcentaje')) || 0 : 0,
          target_margin_percentage: method === 'margen_real' ? Number(cell('porcentaje')) || 0 : 0,
          price: Number(cell('precio_venta')) || 0,
          supplier: cell('proveedor'),
          image_url: cell('imagen_principal'),
          lot_code: cell('lote'),
          expires_at: cell('vencimiento'),
          status: cell('estado') || 'activo',
        });
        return { row: row.__row, product, error: validateProduct(product, product.id) || undefined };
      }),
    );
  };

  const confirmImport = () => {
    const snapshot = products;
    const invalid = csvRows.find((row) => row.error);
    if (invalid) {
      setError('No se pudo completar la importación.');
      return;
    }
    csvRows.forEach((row) => upsertProduct(row.product));
    setLastImport(snapshot);
    setCsvRows([]);
    setNotice(`Importación terminada: ${csvRows.length} productos.`);
    refresh();
  };

  return (
    <div>
      <p className="dm-admin-kicker">Catálogo</p>
      <div className="dm-admin-head">
        <div>
          <h1>Productos y carga</h1>
          <p>Carga manual completa, fotos y validación previa de CSV.</p>
        </div>
        <button type="button" className="dm-btn dm-btn--primary" onClick={() => open()}>
          <Plus size={16} /> Nuevo producto
        </button>
      </div>
      {error && <p className="dm-admin-alert">{error}</p>}
      {notice && <p className="dm-admin-ok">{notice}</p>}

      {editing && (
        <form className="dm-admin-card dm-admin-form" onSubmit={save}>
          <div className="dm-admin-head">
            <h2>{draft.id ? `Editar ${draft.name || 'producto'}` : 'Nuevo producto'}</h2>
            <button type="button" className="dm-btn dm-btn--ghost" onClick={() => setEditing(null)}>
              Cancelar
            </button>
          </div>
          <div className="dm-admin-form__grid">
            <label>
              SKU
              <input required value={draft.sku} onChange={(event) => setDraft({ ...draft, sku: event.target.value })} />
            </label>
            <label>
              Nombre
              <input required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
            </label>
            <label className="dm-admin-span2">
              Descripción corta
              <input
                value={draft.short_description}
                onChange={(event) => setDraft({ ...draft, short_description: event.target.value })}
              />
            </label>
            <label className="dm-admin-span2">
              Descripción completa
              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              />
            </label>
            <label>
              Categoría
              <select
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value as ProductCategory })}
              >
                {CATEGORIES.map((key) => (
                  <option key={key} value={key}>
                    {CATEGORY_LABELS[key]}
                  </option>
                ))}
              </select>
            </label>
            {draft.category === 'pasteleria' && (
              <label>
                Tipo de pastelería
                <select
                  value={draft.subcategory}
                  onChange={(event) => setDraft({ ...draft, subcategory: event.target.value })}
                >
                  <option value="">Elegí…</option>
                  <option value="torta">Torta</option>
                  <option value="tarta">Tarta</option>
                  <option value="mesa_dulce">Mesa dulce</option>
                  <option value="cupcake">Cupcake</option>
                </select>
              </label>
            )}
            <label>
              Peso o volumen
              <input value={draft.size} onChange={(event) => setDraft({ ...draft, size: event.target.value })} />
            </label>
            <label>
              Estado
              <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })}>
                <option value="borrador">Borrador</option>
                <option value="activo">Activo</option>
                <option value="oculto">Oculto</option>
                <option value="discontinuado">Discontinuado</option>
              </select>
            </label>
            <label>
              Stock
              <input
                type="number"
                min={0}
                value={draft.stock}
                onChange={(event) => setDraft({ ...draft, stock: Number(event.target.value) })}
              />
            </label>
            <label>
              Stock mínimo
              <input
                type="number"
                min={0}
                value={draft.minimum_stock || 0}
                onChange={(event) => setDraft({ ...draft, minimum_stock: Number(event.target.value) })}
              />
            </label>
            <label>
              Vencimiento
              <input
                type="date"
                value={draft.expires_at || ''}
                onChange={(event) => setDraft({ ...draft, expires_at: event.target.value })}
              />
            </label>
            <label>
              Costo de producto
              <input
                type="number"
                min={0}
                value={draft.cost_price || 0}
                onChange={(event) => setDraft({ ...draft, cost_price: Number(event.target.value) })}
              />
            </label>
            <label>
              Costos adicionales
              <input
                type="number"
                min={0}
                value={draft.additional_costs || 0}
                onChange={(event) => setDraft({ ...draft, additional_costs: Number(event.target.value) })}
              />
            </label>
            <label>
              Método de precio
              <select
                value={draft.pricing_method || 'manual'}
                onChange={(event) => setDraft({ ...draft, pricing_method: event.target.value })}
              >
                <option value="manual">Precio manual</option>
                <option value="markup">Recargo sobre costo</option>
                <option value="margen_real">Margen real deseado</option>
              </select>
            </label>
            {draft.pricing_method === 'manual' ? (
              <label>
                Precio de venta
                <input
                  type="number"
                  min={0}
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })}
                />
              </label>
            ) : (
              <label>
                Porcentaje
                <input
                  type="number"
                  min={0}
                  value={
                    draft.pricing_method === 'margen_real'
                      ? draft.target_margin_percentage || 0
                      : draft.markup_percentage || 0
                  }
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      markup_percentage: Number(event.target.value),
                      target_margin_percentage: Number(event.target.value),
                    })
                  }
                />
              </label>
            )}
            <label>
              Redondear para terminar en
              <select
                value={draft.rounding_ending || 0}
                onChange={(event) => setDraft({ ...draft, rounding_ending: Number(event.target.value) })}
              >
                <option value={0}>Sin regla</option>
                <option value={0}>0</option>
                <option value={9}>9</option>
                <option value={90}>90</option>
                <option value={99}>99</option>
              </select>
            </label>
            <label>
              Ingredientes
              <textarea
                rows={2}
                value={draft.ingredients}
                onChange={(event) => setDraft({ ...draft, ingredients: event.target.value })}
              />
            </label>
            <label>
              Alérgenos
              <input value={draft.allergens} onChange={(event) => setDraft({ ...draft, allergens: event.target.value })} />
            </label>
            <label>
              Proveedor
              <input value={draft.supplier || ''} onChange={(event) => setDraft({ ...draft, supplier: event.target.value })} />
            </label>
            {draft.category === 'licor' && (
              <label>
                Graduación alcohólica
                <input
                  type="number"
                  min={0}
                  value={draft.alcohol_percentage || 0}
                  onChange={(event) => setDraft({ ...draft, alcohol_percentage: Number(event.target.value) })}
                />
              </label>
            )}
          </div>
          {draft.category === 'pasteleria' && (
            <p className="dm-admin-muted">
              Se publicará con el botón “Pedir por encargo” y llevará al formulario de presupuesto. El stock no
              limitará la solicitud.
            </p>
          )}
          <p className="dm-admin-lead">
            Costo efectivo {formatPrice(priced.effective_cost)} · Precio {formatPrice(priced.price)} · Ganancia{' '}
            {formatPrice(priced.gross_profit)} · Margen real {priced.real_margin}%
          </p>
          <fieldset className="dm-admin-photos">
            <legend>Fotografías</legend>
            <p className="dm-admin-muted">
              La primera foto es la principal. Usá la X para quitar una imagen; si quitás la principal, la siguiente
              ocupará su lugar.
            </p>
            <div className="dm-admin-photos__grid" aria-label="Vista previa de las fotografías cargadas">
              {(draft.gallery || []).map((src, index) => (
                <figure key={`${src.slice(0, 24)}-${index}`}>
                  <ProductPhoto src={src} alt="" fill />
                  {index === 0 && <span>Principal</span>}
                  <button
                    type="button"
                    aria-label="Eliminar foto"
                    onClick={() => {
                      const gallery = (draft.gallery || []).filter((_, i) => i !== index);
                      setDraft({ ...draft, gallery, image_url: gallery[0] || '' });
                      setNotice('Foto quitada de este producto. Guardá los cambios para confirmar.');
                    }}
                  >
                    <X size={14} />
                  </button>
                </figure>
              ))}
            </div>
            {(draft.gallery || []).length < 8 ? (
              <label className="dm-btn dm-btn--outline">
                <ImagePlus size={16} /> Agregar fotos (hasta 8)
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  hidden
                  onChange={(event) => addPhotos(event.target.files)}
                />
              </label>
            ) : (
              <p>Límite de 8 fotos alcanzado</p>
            )}
          </fieldset>
          <label className="dm-admin-check">
            <input
              type="checkbox"
              checked={draft.featured}
              onChange={(event) => setDraft({ ...draft, featured: event.target.checked })}
            />
            Producto destacado
          </label>
          <button type="submit" className="dm-btn dm-btn--primary" disabled={saving}>
            {saving ? 'Guardando…' : draft.id ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </form>
      )}

      <section className="dm-admin-card" style={{ marginTop: 20 }}>
        <h2>Carga masiva CSV</h2>
        <p>Valida filas antes de modificar el catálogo y guarda una copia para deshacer.</p>
        <div className="dm-admin-actions">
          <button type="button" className="dm-btn dm-btn--outline" onClick={downloadTemplate}>
            Descargar plantilla
          </button>
          <label className="dm-btn dm-btn--outline">
            Seleccionar archivo CSV
            <input type="file" accept=".csv,text/csv" hidden onChange={(event) => onCsv(event.target.files?.[0])} />
          </label>
          {csvRows.length > 0 && (
            <button type="button" className="dm-btn dm-btn--primary" onClick={confirmImport}>
              Confirmar importación
            </button>
          )}
          {lastImport && (
            <button
              type="button"
              className="dm-btn dm-btn--ghost"
              onClick={() => {
                lastImport.forEach((product) => upsertProduct(product));
                setLastImport(null);
                setNotice('La importación fue revertida.');
                refresh();
              }}
            >
              <RotateCcw size={16} /> Deshacer última importación
            </button>
          )}
        </div>
        {csvRows.length > 0 && (
          <table className="dm-admin-table">
            <thead>
              <tr>
                <th>Fila</th>
                <th>SKU</th>
                <th>Nombre</th>
                <th>Precio</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {csvRows.map((row) => (
                <tr key={row.row}>
                  <td>{row.row}</td>
                  <td>{row.product.sku}</td>
                  <td>{row.product.name}</td>
                  <td>{formatPrice(row.product.price)}</td>
                  <td>{row.error || 'OK'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="dm-admin-card" style={{ marginTop: 20 }}>
        <h2>Catálogo actual · {products.length}</h2>
        <ul className="dm-admin-list">
          {products.map((product) => (
            <li key={product.id}>
              <div className="dm-admin-list__thumb">
                <ProductPhoto src={product.image_url} alt="" fill />
              </div>
              <div>
                <strong>{product.name}</strong>
                <p>
                  {product.sku || 'Sin SKU'} · Stock {product.stock} · {formatPrice(product.price)} · Margen{' '}
                  {Number(product.real_margin || 0).toFixed(0)}%
                </p>
              </div>
              <div className="dm-admin-list__actions">
                <button type="button" className="dm-btn dm-btn--ghost" onClick={() => open(product)}>
                  <Pencil size={14} /> Editar
                </button>
                <button
                  type="button"
                  className="dm-btn dm-btn--ghost"
                  onClick={() => {
                    if (window.confirm(`¿Ocultar ${product.name}?`)) {
                      upsertProduct({ ...product, status: 'oculto', active: false });
                      refresh();
                    }
                  }}
                >
                  Ocultar
                </button>
                <button
                  type="button"
                  className="dm-btn dm-btn--ghost"
                  onClick={() => {
                    if (window.confirm(`¿Quitar ${product.name} del catálogo local?`)) {
                      deleteProduct(product.id);
                      refresh();
                    }
                  }}
                >
                  Quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
