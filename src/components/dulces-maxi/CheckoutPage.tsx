'use client';

import Link from 'next/link';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { CircleCheck, CreditCard, LockKeyhole, MessageCircle } from 'lucide-react';
import {
  buildOrderWhatsAppUrl,
  clearCart,
  generateReference,
  useCart,
  type CartItem,
} from '@/lib/dulces-maxi/cart';
import { DM_BASE, formatPrice } from '@/lib/dulces-maxi/products';

type DeliveryMethod = 'envio' | 'retiro';
type PaymentMethod = 'mercadopago' | 'whatsapp';

interface CheckoutForm {
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  delivery_method: DeliveryMethod;
  notes: string;
  accept_terms: boolean;
  consent_marketing: boolean;
  payment_method: PaymentMethod;
}

const INITIAL_FORM: CheckoutForm = {
  customer_name: '',
  email: '',
  phone: '',
  address: '',
  delivery_method: 'envio',
  notes: '',
  accept_terms: false,
  consent_marketing: false,
  payment_method: 'mercadopago',
};

interface RegisteredOrder {
  orderNumber: string;
  total: number;
  items: CartItem[];
  whatsappUrl: string;
  paymentMethod: PaymentMethod;
  paymentError: string;
}

const MP_UNAVAILABLE =
  'No pudimos abrir Mercado Pago. Intentá nuevamente o continuá por WhatsApp.';

export default function CheckoutPage() {
  const { items, total } = useCart();
  const [form, setForm] = useState<CheckoutForm>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<RegisteredOrder | null>(null);
  const [error, setError] = useState('');

  const bind =
    (field: keyof CheckoutForm) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (form.delivery_method === 'envio' && !form.address.trim()) {
      setError('Ingresá una dirección o referencia para coordinar el envío.');
      return;
    }
    if (!form.accept_terms) {
      setError('Para continuar, aceptá los términos y la política de privacidad.');
      return;
    }
    setSubmitting(true);
    const orderNumber = generateReference('DM');
    const whatsappUrl = buildOrderWhatsAppUrl({
      orderNumber,
      customer: form.customer_name.trim(),
      items,
      total,
      deliveryMethod: form.delivery_method,
      address: form.delivery_method === 'envio' ? form.address.trim() : '',
      notes: form.notes.trim(),
    });
    setOrder({
      orderNumber,
      total,
      items,
      whatsappUrl,
      paymentMethod: form.payment_method,
      paymentError: form.payment_method === 'mercadopago' ? MP_UNAVAILABLE : '',
    });
    setSubmitting(false);
  };

  const sendWhatsApp = () => {
    if (!order) return;
    window.open(order.whatsappUrl, '_blank', 'noopener,noreferrer');
    clearCart();
  };

  if (order) {
    const mp = order.paymentMethod === 'mercadopago';
    return (
      <div className="dm-container dm-result">
        <div className={`dm-result__icon ${mp ? 'dm-result__icon--blue' : 'dm-result__icon--green'}`}>
          {mp ? <CreditCard size={40} /> : <CircleCheck size={40} />}
        </div>
        <p className="dm-eyebrow">Pedido {order.orderNumber}</p>
        <h1>{mp ? 'Tu pedido está listo para pagar' : '¡El pedido quedó registrado!'}</h1>
        <p className="dm-result__text">
          {mp
            ? 'El pedido está registrado, pero todavía no está pagado. Continuá en Mercado Pago; el resultado se verificará desde el servidor.'
            : 'Falta enviarlo por WhatsApp. Abrir WhatsApp registra una intención de compra; la venta recién se confirma cuando el negocio acepta el pedido.'}
        </p>
        {order.paymentError && (
          <p className="dm-result__error" role="alert">
            {order.paymentError}
          </p>
        )}
        <div className="dm-result__actions">
          {mp && (
            <button
              type="button"
              onClick={() => setOrder({ ...order, paymentError: MP_UNAVAILABLE })}
              className="dm-btn dm-btn--mp"
            >
              <CreditCard size={20} /> Pagar con Mercado Pago
            </button>
          )}
          <button type="button" onClick={sendWhatsApp} className="dm-btn dm-btn--green">
            <MessageCircle size={20} /> Enviar pedido por WhatsApp
          </button>
        </div>
        <div className="dm-result__back">
          <Link href={DM_BASE} className="dm-link">
            Volver a la tienda
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="dm-container dm-cart-empty" style={{ maxWidth: '36rem' }}>
        <h1 style={{ marginTop: 0, fontSize: 30, lineHeight: '36px', fontWeight: 700 }}>
          No hay productos en el carrito
        </h1>
        <Link href={DM_BASE} className="dm-btn dm-btn--primary" style={{ marginTop: 28 }}>
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="dm-container dm-checkout">
      <div className="dm-checkout__grid">
        <section>
          <p className="dm-eyebrow">Paso final</p>
          <h1>Datos y forma de pago</h1>
          <p className="dm-checkout__lead">
            El servidor volverá a consultar precios y stock antes de registrar el pedido y abrir el
            medio elegido.
          </p>
          <form onSubmit={submit} className="dm-form">
            <div className="dm-form__span">
              <label htmlFor="customer_name" className="dm-label dm-label--basic">
                Nombre y apellido
              </label>
              <input
                id="customer_name"
                required
                minLength={2}
                autoComplete="name"
                value={form.customer_name}
                onChange={bind('customer_name')}
                className="dm-field"
              />
            </div>
            <div>
              <label htmlFor="email" className="dm-label dm-label--basic">
                Email
              </label>
              <input
                id="email"
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={bind('email')}
                className="dm-field"
              />
            </div>
            <div>
              <label htmlFor="phone" className="dm-label dm-label--basic">
                Teléfono / WhatsApp
              </label>
              <input
                id="phone"
                required
                minLength={6}
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={bind('phone')}
                className="dm-field"
              />
            </div>
            <fieldset className="dm-fieldset dm-form__span">
              <legend>¿Cómo querés recibirlo?</legend>
              <div className="dm-options">
                {(
                  [
                    ['envio', 'Envío a coordinar'],
                    ['retiro', 'Retiro a coordinar'],
                  ] as [DeliveryMethod, string][]
                ).map(([value, label]) => (
                  <label
                    key={value}
                    className={`dm-radio${form.delivery_method === value ? ' is-active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="delivery_method"
                      value={value}
                      checked={form.delivery_method === value}
                      onChange={bind('delivery_method')}
                    />{' '}
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {form.delivery_method === 'envio' && (
              <div className="dm-form__span">
                <label htmlFor="address" className="dm-label dm-label--basic">
                  Dirección o referencia
                </label>
                <input
                  id="address"
                  required
                  autoComplete="street-address"
                  value={form.address}
                  onChange={bind('address')}
                  className="dm-field"
                />
              </div>
            )}
            <fieldset className="dm-fieldset dm-form__span">
              <legend>¿Cómo querés pagar?</legend>
              <div className="dm-options dm-options--stack">
                <label
                  className={`dm-radio dm-radio--card dm-radio--mp${form.payment_method === 'mercadopago' ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="mercadopago"
                    checked={form.payment_method === 'mercadopago'}
                    onChange={bind('payment_method')}
                  />
                  <span>
                    <strong>
                      <CreditCard size={16} color="#009EE3" /> Mercado Pago
                    </strong>
                    <small>Pagá online en el sitio seguro de Mercado Pago.</small>
                  </span>
                </label>
                <label
                  className={`dm-radio dm-radio--card dm-radio--wa${form.payment_method === 'whatsapp' ? ' is-active' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="whatsapp"
                    checked={form.payment_method === 'whatsapp'}
                    onChange={bind('payment_method')}
                  />
                  <span>
                    <strong>
                      <MessageCircle size={16} color="#237347" /> Coordinar por WhatsApp
                    </strong>
                    <small>Registrá el pedido y acordá el pago después.</small>
                  </span>
                </label>
              </div>
            </fieldset>
            <div className="dm-form__span">
              <label htmlFor="notes" className="dm-label dm-label--basic">
                Notas del pedido (opcional)
              </label>
              <textarea
                id="notes"
                maxLength={800}
                rows={4}
                value={form.notes}
                onChange={bind('notes')}
                className="dm-field"
                placeholder="Horario preferido, dedicatoria o consulta…"
              />
            </div>
            <label className="dm-check dm-form__span">
              <input
                type="checkbox"
                checked={form.accept_terms}
                onChange={(event) => setForm((current) => ({ ...current, accept_terms: event.target.checked }))}
              />
              <span>
                Acepto los{' '}
                <Link href={`${DM_BASE}/terminos`} target="_blank">
                  términos
                </Link>{' '}
                y la{' '}
                <Link href={`${DM_BASE}/privacidad`} target="_blank">
                  política de privacidad
                </Link>{' '}
                en versión borrador pendiente de revisión.
              </span>
            </label>
            <label className="dm-check dm-form__span">
              <input
                type="checkbox"
                checked={form.consent_marketing}
                onChange={(event) =>
                  setForm((current) => ({ ...current, consent_marketing: event.target.checked }))
                }
              />
              <span>Quiero recibir novedades y promociones. Es opcional y podré revocarlo.</span>
            </label>
            {error && (
              <p className="dm-alert dm-form__span" role="alert" style={{ border: 0 }}>
                {error}
              </p>
            )}
            <div className="dm-form__span">
              <button type="submit" disabled={submitting} className="dm-submit">
                {submitting
                  ? 'Validando precios y stock…'
                  : form.payment_method === 'mercadopago'
                    ? 'Continuar a Mercado Pago'
                    : 'Registrar pedido'}
              </button>
              <p className="dm-secure">
                <LockKeyhole size={14} /> Tus datos se usan para gestionar este pedido.
              </p>
            </div>
          </form>
        </section>
        <aside className="dm-order-summary">
          <h2>Resumen del pedido</h2>
          <div className="dm-order-summary__items">
            {items.map((item) => (
              <div key={item.product_id}>
                <span>
                  {item.quantity} × {item.name}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="dm-order-summary__total">
            <span>Total estimado</span>
            <span className="dm-price">{formatPrice(total)}</span>
          </div>
          <p className="dm-order-summary__note">
            El total definitivo se recalcula en el servidor. Mercado Pago se abre fuera de la tienda y
            Dulces Maxi no recibe los datos de tu tarjeta.
          </p>
        </aside>
      </div>
    </div>
  );
}
