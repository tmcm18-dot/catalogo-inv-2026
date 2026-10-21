'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowRight,
  CakeSlice,
  CalendarDays,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  ImagePlus,
  ListPlus,
  MessageCircle,
  Plus,
  ShieldCheck,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { generateReference } from '@/lib/dulces-maxi/cart';
import {
  COVER_OPTIONS,
  INITIAL_PASTRY_FORM,
  PASTRY_CATEGORY_LABELS,
  PASTRY_PRODUCTS,
  PRESENTATION_OPTIONS,
  TART_OPTIONS,
  buildPastryWhatsAppUrl,
  emptyDessert,
  isCustomDessertTable,
  isPastryCategory,
  validatePastryForm,
  type DessertItem,
  type PastryCategory,
  type PastryForm,
} from '@/lib/dulces-maxi/pastry';
import { DM_BASE } from '@/lib/dulces-maxi/products';

interface Preview {
  file: File;
  url: string;
}

interface QuoteResult {
  request_number: string;
  whatsapp_url: string;
}

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_DESSERTS = 20;

function scrollToForm(block: ScrollLogicalPosition = 'start') {
  document.getElementById('solicitar-presupuesto')?.scrollIntoView({ behavior: 'smooth', block });
}

export default function PastryPage() {
  const searchParams = useSearchParams();
  const productParam = (searchParams.get('producto') || '').trim().slice(0, 100);
  const nameParam = (searchParams.get('nombre') || '').trim().slice(0, 160);
  const typeParam = (searchParams.get('tipo') || '').trim().toLowerCase();
  const typeFromUrl: PastryCategory = isPastryCategory(typeParam) ? typeParam : 'torta';

  const [form, setForm] = useState<PastryForm>(INITIAL_PASTRY_FORM);
  const [catalogProduct, setCatalogProduct] = useState<{ id: string; name: string } | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<QuoteResult | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const customTable = isCustomDessertTable(form);

  const productOptions = useMemo(() => {
    const options = PASTRY_PRODUCTS[form.category] || [];
    if (catalogProduct && form.catalog_product_id === catalogProduct.id && !options.includes(catalogProduct.name)) {
      return [catalogProduct.name, ...options];
    }
    return options;
  }, [catalogProduct, form.catalog_product_id, form.category]);

  useEffect(() => {
    if (!productParam || !nameParam) return;
    setCatalogProduct({ id: productParam, name: nameParam });
    setForm((current) => ({
      ...current,
      catalog_product_id: productParam,
      category: typeFromUrl,
      product_name: nameParam,
      cake_name: '',
      desired_kg: typeFromUrl === 'torta' ? current.desired_kg || '1' : '',
      cover: typeFromUrl === 'torta' ? 'merengue_italiano' : 'no_aplica',
      description:
        current.catalog_product_id === productParam && current.description
          ? current.description
          : `Quiero solicitar ${nameParam} por encargo.`,
    }));
    window.setTimeout(() => scrollToForm('start'), 120);
  }, [productParam, nameParam, typeFromUrl]);

  useEffect(() => {
    const next = photos.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews(next);
    return () => next.forEach(({ url }) => URL.revokeObjectURL(url));
  }, [photos]);

  const setField = <K extends keyof PastryForm>(field: K, value: PastryForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError('');
  };

  const changeCategory = (category: PastryCategory) => {
    setCatalogProduct(null);
    setForm((current) => ({
      ...current,
      catalog_product_id: '',
      category,
      product_name: PASTRY_PRODUCTS[category][0],
      cake_name: '',
      desired_kg: category === 'torta' ? current.desired_kg || '1' : '',
      cover: category === 'torta' ? 'merengue_italiano' : 'no_aplica',
    }));
    setError('');
  };

  const chooseOption = (category: PastryCategory, productName: string) => {
    setCatalogProduct(null);
    setForm((current) => ({
      ...current,
      catalog_product_id: '',
      category,
      product_name: productName,
      cake_name: productName === 'Torta personalizada' ? current.cake_name : '',
      desired_kg: category === 'torta' ? current.desired_kg || '1' : '',
      cover: category === 'torta' && current.cover !== 'no_aplica' ? current.cover : 'merengue_italiano',
    }));
    scrollToForm('start');
  };

  const changeProduct = (productName: string) => {
    setForm((current) => ({
      ...current,
      product_name: productName,
      catalog_product_id: catalogProduct?.name === productName ? catalogProduct.id : '',
    }));
    setError('');
  };

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    const accepted: File[] = [];
    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Las fotos deben ser JPG, PNG o WEBP.');
        return;
      }
      if (file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
        setError('Cada foto debe pesar hasta 5 MB.');
        return;
      }
      accepted.push(file);
    }
    if (photos.length + accepted.length > MAX_PHOTOS) {
      setError('Podés adjuntar hasta 5 fotos.');
      return;
    }
    setPhotos((current) => [...current, ...accepted]);
    setError('');
  };

  const removePhoto = (index: number) => setPhotos((current) => current.filter((_, i) => i !== index));

  const updateDessert = (index: number, field: keyof DessertItem, value: string) => {
    setForm((current) => ({
      ...current,
      dessert_items: current.dessert_items.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
    setError('');
  };

  const addDessert = () => {
    if (form.dessert_items.length >= MAX_DESSERTS) {
      setError('Podés agregar hasta 20 postres diferentes.');
      return;
    }
    setForm((current) => ({ ...current, dessert_items: [...current.dessert_items, emptyDessert()] }));
    setError('');
  };

  const removeDessert = (index: number) => {
    setForm((current) => ({
      ...current,
      dessert_items:
        current.dessert_items.length === 1
          ? [emptyDessert()]
          : current.dessert_items.filter((_, i) => i !== index),
    }));
    setError('');
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (form.website) return;
    const validationError = validatePastryForm(form, photos.length);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError('');
    const requestNumber = generateReference('PAS');
    setResult({
      request_number: requestNumber,
      whatsapp_url: buildPastryWhatsAppUrl(form, requestNumber, photos.length),
    });
    setSubmitting(false);
    window.setTimeout(
      () => document.getElementById('resultado-presupuesto')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      50,
    );
  };

  return (
    <div className="dm-pastry">
      <section className="dm-pastry__hero">
        <div className="dm-hero__blob dm-hero__blob--orange" />
        <div className="dm-hero__blob dm-hero__blob--pink" />
        <div className="dm-pastry__hero-grid">
          <div>
            <p className="dm-pill">
              <Sparkles size={16} /> Elaboración artesanal
            </p>
            <h1 className="dm-pastry__title">Pastelería hecha para tu celebración</h1>
            <p className="dm-pastry__lead">
              Tortas, tartas y mesas dulces elaboradas únicamente por encargo. Contanos tu idea y te
              enviamos un presupuesto personalizado.
            </p>
            <div className="dm-pastry__actions">
              <a href="#solicitar-presupuesto" className="dm-btn dm-btn--primary">
                Solicitar presupuesto <ArrowRight size={20} />
              </a>
              <Link href={DM_BASE} className="dm-btn dm-btn--outline">
                Volver a la tienda
              </Link>
            </div>
          </div>
          <div className="dm-pastry__panel">
            <div className="dm-pastry__panel-inner">
              <div>
                <div className="dm-pastry__panel-icon">
                  <CakeSlice size={48} />
                </div>
                <h2>Solo por encargo</h2>
                <p>El valor se calcula según tamaño, diseño, cobertura, cantidad y fecha.</p>
                <div className="dm-pastry__chips">
                  <span>Fotos de referencia</span>
                  <span>Presupuesto por kilos</span>
                  <span>Atención por WhatsApp</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="dm-container dm-pastry__catalog" aria-labelledby="catalogo-pasteleria">
        <div className="dm-pastry__intro">
          <p className="dm-eyebrow dm-eyebrow--orange">Nuestro catálogo</p>
          <h2 id="catalogo-pasteleria">Elegí una opción o contanos tu idea</h2>
          <p>
            La disponibilidad se confirma al presupuestar. No se agregan al carrito porque cada encargo
            se prepara especialmente.
          </p>
        </div>

        <div className="dm-pastry__cards">
          <article className="dm-pcard dm-pcard--pink">
            <div className="dm-pcard__head">
              <div className="dm-pcard__icon dm-pcard__icon--pink">
                <CakeSlice size={24} />
              </div>
              <div>
                <p className="dm-pcard__eyebrow dm-pcard__eyebrow--pink">Tortas</p>
                <h3>Torta de manteca</h3>
              </div>
            </div>
            <p className="dm-pcard__text">
              Bizcochuelo de manteca con relleno de trocitos de bizcochuelo y dulce repostero. Los pisos
              se humedecen con almíbar.
            </p>
            <p className="dm-pcard__subtitle">Coberturas a elección</p>
            <ul className="dm-pcard__list">
              {COVER_OPTIONS.slice(0, 3).map(([, label]) => (
                <li key={label}>
                  <CircleCheck size={16} />
                  {label}
                </li>
              ))}
            </ul>
            <div className="dm-pcard__actions">
              <button
                type="button"
                onClick={() => chooseOption('torta', PASTRY_PRODUCTS.torta[0])}
                className="dm-btn dm-btn--primary"
              >
                Presupuestar esta torta
              </button>
              <button
                type="button"
                onClick={() => chooseOption('torta', PASTRY_PRODUCTS.torta[1])}
                className="dm-btn dm-btn--outline"
              >
                Quiero otra torta
              </button>
            </div>
          </article>

          <article className="dm-pcard dm-pcard--purple">
            <div className="dm-pcard__head">
              <div className="dm-pcard__icon dm-pcard__icon--purple">
                <ImagePlus size={24} />
              </div>
              <div>
                <p className="dm-pcard__eyebrow dm-pcard__eyebrow--purple">Diseño personalizado</p>
                <h3>Tu torta, a tu manera</h3>
              </div>
            </div>
            <p className="dm-pcard__text">
              Indicá el nombre o estilo de la torta, una descripción clara y la cantidad de kilos. También
              podés adjuntar hasta cinco fotos de referencia.
            </p>
            <div className="dm-pcard__tips">
              <p>Para cotizar mejor, contanos:</p>
              <ul>
                <li>• Temática, colores y decoración</li>
                <li>• Cantidad de kilos o porciones</li>
                <li>• Fecha del evento</li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => chooseOption('torta', PASTRY_PRODUCTS.torta[1])}
              className="dm-btn dm-btn--purple dm-btn--block"
            >
              Describir mi torta
            </button>
          </article>
        </div>

        <div className="dm-pcard dm-pcard--orange">
          <div className="dm-pcard__head dm-pcard__head--center">
            <div className="dm-pcard__icon dm-pcard__icon--orange">
              <Sparkles size={24} />
            </div>
            <div>
              <p className="dm-pcard__eyebrow dm-pcard__eyebrow--orange">Tartas</p>
              <h3>Molde Nº 22</h3>
            </div>
          </div>
          <div className="dm-tarts">
            {TART_OPTIONS.map(([name, description, gallery]) => {
              const shortName = name.replace(' · molde Nº 22', '');
              if (gallery) {
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => chooseOption('tarta', name)}
                    className="dm-tart dm-tart--photo"
                  >
                    <span className={`dm-tart__photos${gallery.length > 1 ? ' dm-tart__photos--two' : ''}`}>
                      {gallery.map((photo, index) => (
                        <span key={photo.src}>
                          <Image
                            src={photo.src}
                            alt={photo.alt}
                            fill
                            sizes="(min-width: 640px) 40vw, 90vw"
                            style={{ objectPosition: photo.position || (index === 1 ? 'top' : 'center') }}
                          />
                        </span>
                      ))}
                    </span>
                    <span className="dm-tart__info">
                      <span className="dm-tart__real">{gallery.length > 1 ? 'Fotos reales' : 'Foto real'}</span>
                      <span className="dm-tart__name">{shortName}</span>
                      <span className="dm-tart__desc">{description}</span>
                      <span className="dm-tart__cta">
                        Solicitar presupuesto <ArrowRight size={16} />
                      </span>
                    </span>
                  </button>
                );
              }
              return (
                <button key={name} type="button" onClick={() => chooseOption('tarta', name)} className="dm-tart">
                  <span className="dm-tart__name">{shortName}</span>
                  <span className="dm-tart__desc">{description}</span>
                </button>
              );
            })}
          </div>
        </div>

        <article className="dm-pcard dm-pcard--green">
          <div className="dm-pcard__head">
            <div className="dm-pcard__icon dm-pcard__icon--green">
              <ListPlus size={24} />
            </div>
            <div>
              <p className="dm-pcard__eyebrow dm-pcard__eyebrow--green">Mesas dulces</p>
              <h3>Mesa dulce personalizada</h3>
              <p className="dm-pcard__text">
                Armá una lista con los postres que querés, la cantidad de cada uno, la forma de
                presentación y el presupuesto disponible para tu celebración.
              </p>
            </div>
          </div>
          <div className="dm-steps">
            {[
              ['1. POSTRES', 'Escribí cada opción'],
              ['2. CANTIDADES', 'Unidades necesarias'],
              ['3. PRESENTACIÓN', 'Individual, bandeja y más'],
              ['4. PRESUPUESTO', 'Cuánto querés gastar'],
            ].map(([title, copy]) => (
              <div key={title} className="dm-step">
                <p>{title}</p>
                <p>{copy}</p>
              </div>
            ))}
          </div>
          <div className="dm-pcard__actions">
            <button
              type="button"
              onClick={() => chooseOption('mesa_dulce', PASTRY_PRODUCTS.mesa_dulce[1])}
              className="dm-btn dm-btn--green"
            >
              Armar mi mesa dulce
            </button>
            <button
              type="button"
              onClick={() => chooseOption('mesa_dulce', PASTRY_PRODUCTS.mesa_dulce[0])}
              className="dm-btn dm-btn--green-outline"
            >
              Consultar cupcakes temáticos
            </button>
          </div>
        </article>
      </section>

      <section id="solicitar-presupuesto" className="dm-quote">
        <div className="dm-quote__grid">
          <aside className="dm-quote__aside">
            <p className="dm-eyebrow">Presupuesto personalizado</p>
            <h2>Contanos qué querés celebrar</h2>
            <p>
              Registramos tu solicitud y luego continuamos por WhatsApp. Enviar el formulario no confirma
              el encargo ni fija el precio.
            </p>
            <div className="dm-quote__points">
              <div className="dm-quote__point">
                <Clock3 color="#C51D5D" />
                <div>
                  <p>Producción coordinada</p>
                  <p>Consultá con anticipación para confirmar fecha y disponibilidad.</p>
                </div>
              </div>
              <div className="dm-quote__point">
                <ShieldCheck color="#237347" />
                <div>
                  <p>Datos protegidos</p>
                  <p>Tu información y las fotos quedan visibles solo para administración.</p>
                </div>
              </div>
              <div className="dm-quote__point">
                <MessageCircle color="#237347" />
                <div>
                  <p>Seguimiento directo</p>
                  <p>Al finalizar podés enviar la solicitud por WhatsApp.</p>
                </div>
              </div>
            </div>
          </aside>

          <form onSubmit={submit} className="dm-quote__form" noValidate>
            {catalogProduct && form.catalog_product_id === catalogProduct.id && (
              <div className="dm-quote__selected">
                <strong>Producto seleccionado:</strong> {catalogProduct.name}. Completá los detalles para
                solicitarlo por encargo.
              </div>
            )}
            <div className="dm-quote__fields">
              <label className="dm-label">
                Tipo de encargo
                <select
                  value={form.category}
                  onChange={(event) => changeCategory(event.target.value as PastryCategory)}
                  className="dm-field"
                >
                  {(Object.entries(PASTRY_CATEGORY_LABELS) as [PastryCategory, string][]).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="dm-label">
                Producto
                <select
                  value={form.product_name}
                  onChange={(event) => changeProduct(event.target.value)}
                  className="dm-field"
                >
                  {productOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {form.product_name === 'Torta personalizada' && (
                <label className="dm-label dm-form__span">
                  Nombre o estilo de la torta
                  <input
                    value={form.cake_name}
                    onChange={(event) => setField('cake_name', event.target.value)}
                    maxLength={120}
                    required
                    placeholder="Ej.: torta de cumpleaños temática floral"
                    className="dm-field"
                  />
                </label>
              )}
              {form.category === 'torta' && (
                <>
                  <label className="dm-label">
                    Cantidad de kilos
                    <input
                      type="number"
                      value={form.desired_kg}
                      onChange={(event) => setField('desired_kg', event.target.value)}
                      min="0.5"
                      max="30"
                      step="0.5"
                      inputMode="decimal"
                      required
                      className="dm-field"
                    />
                  </label>
                  <label className="dm-label">
                    Cobertura
                    <select
                      value={form.cover}
                      onChange={(event) => setField('cover', event.target.value)}
                      className="dm-field"
                    >
                      {COVER_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {customTable && (
                <fieldset className="dm-fieldset dm-desserts dm-form__span">
                  <legend>Lista de postres para presupuestar</legend>
                  <p>Agregá cada postre, la cantidad que necesitás y cómo querés recibirlo o presentarlo.</p>
                  <div className="dm-desserts__list">
                    {form.dessert_items.map((item, index) => (
                      <div key={index} className="dm-dessert">
                        <div className="dm-dessert__head">
                          <p>Postre {index + 1}</p>
                          <button
                            type="button"
                            onClick={() => removeDessert(index)}
                            className="dm-dessert__remove"
                            aria-label={`Quitar postre ${index + 1}`}
                          >
                            <Trash2 size={16} /> Quitar
                          </button>
                        </div>
                        <div className="dm-dessert__grid">
                          <label className="dm-label">
                            Nombre del postre
                            <input
                              value={item.dessert_name}
                              onChange={(event) => updateDessert(index, 'dessert_name', event.target.value)}
                              maxLength={120}
                              required
                              placeholder="Ej.: brownie, cupcake, cheesecake…"
                              className="dm-field"
                            />
                          </label>
                          <label className="dm-label">
                            Cantidad
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(event) => updateDessert(index, 'quantity', event.target.value)}
                              min="1"
                              max="1000"
                              step="1"
                              inputMode="numeric"
                              required
                              className="dm-field"
                            />
                          </label>
                          <label className="dm-label">
                            Presentación
                            <select
                              value={item.presentation_mode}
                              onChange={(event) => updateDessert(index, 'presentation_mode', event.target.value)}
                              className="dm-field"
                            >
                              {PRESENTATION_OPTIONS.map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={addDessert}
                    disabled={form.dessert_items.length >= MAX_DESSERTS}
                    className="dm-desserts__add"
                  >
                    <Plus size={16} /> Agregar otro postre
                  </button>
                  <label className="dm-label">
                    Presupuesto disponible para gastar (ARS)
                    <span className="dm-field-wrap">
                      <input
                        type="number"
                        value={form.budget_amount}
                        onChange={(event) => setField('budget_amount', event.target.value)}
                        min="1"
                        max="100000000"
                        step="1000"
                        inputMode="decimal"
                        required
                        placeholder="Ej.: 150000"
                        className="dm-field dm-field--pl"
                      />
                      <CircleDollarSign className="dm-field-icon dm-field-icon--left" />
                    </span>
                    <span className="dm-hint">
                      Este valor nos ayuda a proponerte cantidades y presentaciones acordes.
                    </span>
                  </label>
                </fieldset>
              )}
              <label className="dm-label">
                {form.category === 'mesa_dulce' ? 'Invitados o porciones estimadas' : 'Porciones estimadas'}{' '}
                <span className="dm-optional">(opcional)</span>
                <input
                  type="number"
                  value={form.servings}
                  onChange={(event) => setField('servings', event.target.value)}
                  min="1"
                  max="500"
                  inputMode="numeric"
                  placeholder="Ej.: 30"
                  className="dm-field"
                />
              </label>
              <label className="dm-label">
                Fecha del evento <span className="dm-optional">(opcional)</span>
                <span className="dm-field-wrap">
                  <input
                    type="date"
                    value={form.event_date}
                    onChange={(event) => setField('event_date', event.target.value)}
                    min={today}
                    className="dm-field dm-field--pr"
                  />
                  <CalendarDays className="dm-field-icon dm-field-icon--right" />
                </span>
              </label>
              <label className="dm-label dm-form__span">
                Descripción del encargo
                <textarea
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  maxLength={2000}
                  minLength={10}
                  required
                  rows={5}
                  placeholder="Contanos temática, colores, relleno, decoración, mensaje, cantidades y cualquier detalle importante."
                  className="dm-field"
                />
                <span className="dm-counter">{form.description.length}/2000</span>
              </label>
              <fieldset className="dm-fieldset dm-form__span">
                <legend className="dm-label">
                  Fotos de referencia <span className="dm-optional">(opcional, hasta 5)</span>
                </legend>
                <label htmlFor="pastry-photos" className="dm-upload">
                  <Upload size={24} />
                  <strong>Elegir fotos</strong>
                  <small>JPG, PNG o WEBP · máximo 5 MB cada una</small>
                </label>
                <input
                  id="pastry-photos"
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  multiple
                  onChange={addPhotos}
                  className="dm-sr-only"
                />
                {previews.length > 0 && (
                  <div className="dm-previews">
                    {previews.map(({ file, url }, index) => (
                      <div key={`${file.name}-${file.lastModified}-${index}`} className="dm-preview">
                        {/* eslint-disable-next-line @next/next/no-img-element -- vista previa de un blob local */}
                        <img src={url} alt={`Referencia ${index + 1}: ${file.name}`} />
                        <button type="button" onClick={() => removePhoto(index)} aria-label={`Quitar ${file.name}`}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </fieldset>
              <div className="dm-form__span">
                <p className="dm-eyebrow dm-eyebrow--purple" style={{ letterSpacing: '0.16em' }}>
                  Tus datos
                </p>
              </div>
              <label className="dm-label">
                Nombre y apellido
                <input
                  value={form.customer_name}
                  onChange={(event) => setField('customer_name', event.target.value)}
                  maxLength={120}
                  autoComplete="name"
                  required
                  className="dm-field"
                />
              </label>
              <label className="dm-label">
                Teléfono de contacto / WhatsApp
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setField('phone', event.target.value)}
                  maxLength={30}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                  placeholder="Ej.: 387 123 4567"
                  className="dm-field"
                />
              </label>
              <label className="dm-label dm-form__span">
                Email <span className="dm-optional">(opcional)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setField('email', event.target.value)}
                  maxLength={160}
                  autoComplete="email"
                  className="dm-field"
                />
              </label>
            </div>
            <label className="dm-check dm-check--boxed" style={{ marginTop: 20 }}>
              <input
                type="checkbox"
                checked={form.consent_terms}
                onChange={(event) => setField('consent_terms', event.target.checked)}
                required
              />
              <span>
                Acepto que Dulces Maxi use estos datos y fotos para responder mi presupuesto. Leí la{' '}
                <Link href={`${DM_BASE}/privacidad`}>política de privacidad</Link>.
              </span>
            </label>
            <label className="dm-honeypot" aria-hidden="true">
              Sitio web
              <input
                value={form.website}
                onChange={(event) => setField('website', event.target.value)}
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
            {error && (
              <p role="alert" className="dm-alert" style={{ marginTop: 20 }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={submitting} className="dm-quote__submit">
              {submitting ? 'Registrando solicitud…' : 'Solicitar presupuesto'}
              {!submitting && <ArrowRight size={20} />}
            </button>
            {result && (
              <div id="resultado-presupuesto" role="status" className="dm-quote__result">
                <CircleCheck size={40} />
                <h3>¡Solicitud registrada!</h3>
                <p>
                  Guardamos el presupuesto <strong>{result.request_number}</strong>. Falta enviarlo por
                  WhatsApp para continuar la conversación.
                </p>
                <a href={result.whatsapp_url} target="_blank" rel="noreferrer" className="dm-btn dm-btn--green">
                  <MessageCircle size={20} /> Enviar solicitud por WhatsApp
                </a>
              </div>
            )}
          </form>
        </div>
      </section>
    </div>
  );
}
