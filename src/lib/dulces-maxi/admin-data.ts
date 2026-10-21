import type { CartItem } from './cart';
import { getCatalogProduct, setProductStock } from './catalog';
import type { DessertItem, PastryCategory } from './pastry';
import type { Product } from './products';
import { newId, nowIso, readJson, writeJson } from './storage';

export const ORDERS_KEY = 'dulces_maxi_orders_v1';
export const PASTRY_KEY = 'dulces_maxi_pastry_requests_v1';
export const CARTS_KEY = 'dulces_maxi_admin_carts_v1';
export const CUSTOMERS_KEY = 'dulces_maxi_customers_v1';
export const MOVEMENTS_KEY = 'dulces_maxi_movements_v1';
export const BATCHES_KEY = 'dulces_maxi_batches_v1';
export const DESIGNS_KEY = 'dulces_maxi_designs_v1';
export const EVENTS_KEY = 'dulces_maxi_admin_events_v1';
export const ADMIN_DATA_EVENT = 'dulces_maxi_admin_data';

export const ORDER_STATUSES = [
  'pendiente',
  'confirmado',
  'preparando',
  'listo',
  'entregado',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  'not_started',
  'waiting',
  'pending',
  'authorized',
  'in_process',
  'in_mediation',
  'approved',
  'rejected',
  'cancelled',
  'refunded',
  'charged_back',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_started: 'Sin iniciar',
  waiting: 'Esperando pago',
  pending: 'Pago pendiente',
  authorized: 'Autorizado',
  in_process: 'En proceso',
  in_mediation: 'En mediación',
  approved: 'Pagado',
  rejected: 'Rechazado',
  cancelled: 'Pago cancelado',
  refunded: 'Reembolsado',
  charged_back: 'Contracargo',
};

export const CART_STATUSES = [
  'activo',
  'inactivo',
  'abandonado',
  'enviado',
  'confirmado',
  'convertido',
  'cancelado',
  'recuperado',
] as const;
export type AdminCartStatus = (typeof CART_STATUSES)[number];

export const PASTRY_STATUSES = [
  'nuevo',
  'contactado',
  'presupuestado',
  'aprobado',
  'rechazado',
  'completado',
  'cancelado',
] as const;
export type PastryRequestStatus = (typeof PASTRY_STATUSES)[number];

export const PASTRY_STATUS_LABELS: Record<PastryRequestStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  presupuestado: 'Presupuestado',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  completado: 'Completado',
  cancelado: 'Cancelado',
};

export const CUSTOMER_STATUSES = ['nuevo', 'activo', 'frecuente', 'inactivo', 'bloqueado'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface AdminOrderItem extends CartItem {
  line_total: number;
  cost: number;
}

export interface AdminOrder {
  id: string;
  order_number: string;
  created_at: string;
  customer_name: string;
  email: string;
  phone: string;
  address: string;
  delivery_method: 'envio' | 'retiro';
  notes: string;
  internal_notes: string;
  items: AdminOrderItem[];
  total: number;
  total_cost: number;
  status: OrderStatus;
  payment_method: 'mercadopago' | 'whatsapp';
  payment_status: PaymentStatus;
  payment_id: string;
  whatsapp_sent: boolean;
  consent_marketing: boolean;
}

export interface AdminPastryRequest {
  id: string;
  request_number: string;
  created_at: string;
  status: PastryRequestStatus;
  customer_name: string;
  phone: string;
  email: string;
  category: PastryCategory | string;
  product_name: string;
  cake_name: string;
  desired_kg: string;
  servings: string;
  event_date: string;
  cover: string;
  dessert_items: DessertItem[];
  budget_amount: string;
  quote_amount: string;
  description: string;
  internal_notes: string;
  photo_count: number;
}

export interface AdminCart {
  id: string;
  source: string;
  status: AdminCartStatus;
  items: CartItem[];
  total: number;
  updated_at: string;
  phone: string;
  attended: boolean;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: CustomerStatus;
  segment: string;
  notes: string;
  marketing: boolean;
  source: string;
  created_at: string;
  last_purchase: string;
}

export interface StockMovement {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  type: 'entrada' | 'salida' | 'ajuste' | 'perdida' | 'rotura' | 'vencimiento' | 'devolucion';
  quantity: number;
  stock_after: number;
  reason: string;
}

export interface ProductionBatch {
  id: string;
  created_at: string;
  product_id: string;
  product_name: string;
  lot_code: string;
  quantity: number;
  made_at: string;
  unit_cost: number;
}

export interface CreativeDesign {
  id: string;
  created_at: string;
  product_id: string;
  format: string;
  template: string;
  title: string;
  text: string;
  cta: string;
  campaign: string;
}

export interface AdminEvent {
  id: string;
  created_at: string;
  type: 'whatsapp_click' | 'page_view';
  path?: string;
}

function emit(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(ADMIN_DATA_EVENT));
}

function loadList<T>(key: string): T[] {
  const parsed = readJson<T[]>(key, []);
  return Array.isArray(parsed) ? parsed : [];
}

function saveList<T>(key: string, value: T[]): T[] {
  writeJson(key, value);
  emit();
  return value;
}

export function listOrders(): AdminOrder[] {
  return loadList<AdminOrder>(ORDERS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveOrder(order: Omit<AdminOrder, 'id' | 'created_at' | 'total_cost' | 'items'> & {
  items: CartItem[];
  created_at?: string;
}): AdminOrder {
  const items: AdminOrderItem[] = order.items.map((item) => {
    const product = getCatalogProduct(item.product_id);
    const cost = Number(product?.effective_cost || product?.cost_price || 0);
    return { ...item, line_total: item.price * item.quantity, cost };
  });
  const record: AdminOrder = {
    ...order,
    id: newId('ord'),
    created_at: order.created_at || nowIso(),
    items,
    total_cost: items.reduce((sum, item) => sum + item.cost * item.quantity, 0),
    internal_notes: order.internal_notes || '',
    payment_id: order.payment_id || '',
  };
  saveList(ORDERS_KEY, [record, ...listOrders()]);
  upsertCustomerFromOrder(record);
  return record;
}

export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  const flow: Record<OrderStatus, OrderStatus | null> = {
    pendiente: 'confirmado',
    confirmado: 'preparando',
    preparando: 'listo',
    listo: 'entregado',
    entregado: null,
    cancelado: null,
  };
  return flow[status];
}

export function isConfirmedSale(status: OrderStatus): boolean {
  return status === 'confirmado' || status === 'preparando' || status === 'listo' || status === 'entregado';
}

export function updateOrder(
  id: string,
  patch: Partial<Pick<AdminOrder, 'status' | 'internal_notes' | 'whatsapp_sent' | 'payment_status'>>,
): AdminOrder | null {
  const orders = listOrders();
  const current = orders.find((order) => order.id === id);
  if (!current) return null;
  const next: AdminOrder = { ...current, ...patch };
  if (patch.status === 'confirmado' && current.status === 'pendiente') {
    for (const item of next.items) {
      const product = getCatalogProduct(item.product_id);
      if (product && product.category !== 'pasteleria') {
        setProductStock(item.product_id, Number(product.stock) - item.quantity);
      }
    }
  }
  saveList(
    ORDERS_KEY,
    orders.map((order) => (order.id === id ? next : order)),
  );
  return next;
}

export function listPastryRequests(): AdminPastryRequest[] {
  return loadList<AdminPastryRequest>(PASTRY_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function savePastryRequest(
  input: Omit<AdminPastryRequest, 'id' | 'created_at' | 'status' | 'internal_notes' | 'quote_amount'> & {
    status?: PastryRequestStatus;
  },
): AdminPastryRequest {
  const record: AdminPastryRequest = {
    ...input,
    id: newId('pas'),
    created_at: nowIso(),
    status: input.status || 'nuevo',
    internal_notes: '',
    quote_amount: '',
  };
  saveList(PASTRY_KEY, [record, ...listPastryRequests()]);
  upsertCustomer({
    name: record.customer_name,
    email: record.email,
    phone: record.phone,
    marketing: false,
    source: 'pasteleria',
  });
  return record;
}

export function updatePastryRequest(
  id: string,
  patch: Partial<Pick<AdminPastryRequest, 'status' | 'internal_notes' | 'quote_amount'>>,
): AdminPastryRequest | null {
  const list = listPastryRequests();
  const current = list.find((item) => item.id === id);
  if (!current) return null;
  const next = { ...current, ...patch };
  saveList(
    PASTRY_KEY,
    list.map((item) => (item.id === id ? next : item)),
  );
  return next;
}

export function listAdminCarts(): AdminCart[] {
  return loadList<AdminCart>(CARTS_KEY).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

export function upsertTrackedCart(input: {
  items: CartItem[];
  total: number;
  source?: string;
  phone?: string;
}): AdminCart | null {
  if (!input.items.length) {
    const existing = listAdminCarts();
    const open = existing.find((cart) => cart.id === 'local-visitor');
    if (open && (open.status === 'activo' || open.status === 'inactivo')) {
      const next = { ...open, items: [], total: 0, updated_at: nowIso(), status: 'abandonado' as const };
      saveList(
        CARTS_KEY,
        existing.map((cart) => (cart.id === open.id ? next : cart)),
      );
      return next;
    }
    return null;
  }
  const existing = listAdminCarts();
  const current = existing.find((cart) => cart.id === 'local-visitor');
  const record: AdminCart = {
    id: 'local-visitor',
    source: input.source || 'direct',
    status: current?.status === 'convertido' ? 'activo' : current?.status || 'activo',
    items: input.items,
    total: input.total,
    updated_at: nowIso(),
    phone: input.phone || current?.phone || '',
    attended: current?.attended || false,
  };
  saveList(
    CARTS_KEY,
    current ? existing.map((cart) => (cart.id === record.id ? record : cart)) : [record, ...existing],
  );
  return record;
}

export function refreshCartStatuses(inactiveHours: number, abandonedHours: number): AdminCart[] {
  const now = Date.now();
  const next = listAdminCarts().map((cart) => {
    if (['convertido', 'cancelado', 'recuperado', 'confirmado'].includes(cart.status)) return cart;
    const ageHours = (now - Date.parse(cart.updated_at)) / 36e5;
    if (ageHours >= abandonedHours) return { ...cart, status: 'abandonado' as const };
    if (ageHours >= inactiveHours) return { ...cart, status: 'inactivo' as const };
    return cart;
  });
  return saveList(CARTS_KEY, next);
}

export function updateAdminCart(id: string, status: AdminCartStatus): AdminCart | null {
  const list = listAdminCarts();
  const current = list.find((cart) => cart.id === id);
  if (!current) return null;
  const next = { ...current, status, attended: true };
  saveList(
    CARTS_KEY,
    list.map((cart) => (cart.id === id ? next : cart)),
  );
  return next;
}

export function listCustomers(): AdminCustomer[] {
  return loadList<AdminCustomer>(CUSTOMERS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

function segmentFor(customer: AdminCustomer, orders: AdminOrder[]): string {
  const confirmed = orders.filter((order) => isConfirmedSale(order.status));
  const total = confirmed.reduce((sum, order) => sum + order.total, 0);
  const last = confirmed[0]?.created_at;
  const days = last ? (Date.now() - Date.parse(last)) / 864e5 : Infinity;
  if (total >= 50000) return 'VIP';
  if (confirmed.length >= 4) return 'Frecuente';
  if (days > 90 && confirmed.length > 0) return 'En riesgo';
  if (confirmed.length >= 2) return 'Activo';
  if (confirmed.length === 1) return 'Nuevo';
  return 'Potencial';
}

export function upsertCustomer(input: {
  name: string;
  email: string;
  phone: string;
  marketing?: boolean;
  source?: string;
}): AdminCustomer {
  const list = listCustomers();
  const email = input.email.trim().toLowerCase();
  const phone = input.phone.trim();
  const current = list.find(
    (customer) => (email && customer.email === email) || (phone && customer.phone === phone),
  );
  const record: AdminCustomer = current
    ? {
        ...current,
        name: input.name.trim() || current.name,
        email: email || current.email,
        phone: phone || current.phone,
        marketing: input.marketing ?? current.marketing,
      }
    : {
        id: newId('cus'),
        name: input.name.trim() || 'Sin nombre',
        email,
        phone,
        status: 'nuevo',
        segment: 'Potencial',
        notes: '',
        marketing: Boolean(input.marketing),
        source: input.source || 'tienda',
        created_at: nowIso(),
        last_purchase: '',
      };
  const next = current ? list.map((customer) => (customer.id === record.id ? record : customer)) : [record, ...list];
  saveList(CUSTOMERS_KEY, next);
  return record;
}

function upsertCustomerFromOrder(order: AdminOrder): void {
  const customer = upsertCustomer({
    name: order.customer_name,
    email: order.email,
    phone: order.phone,
    marketing: order.consent_marketing,
    source: 'checkout',
  });
  const orders = listOrders().filter(
    (item) => item.email === order.email || item.phone === order.phone,
  );
  const confirmed = orders.filter((item) => isConfirmedSale(item.status));
  updateCustomer(customer.id, {
    last_purchase: confirmed[0]?.created_at || order.created_at,
    segment: segmentFor({ ...customer, last_purchase: confirmed[0]?.created_at || '' }, orders),
    status: confirmed.length >= 4 ? 'frecuente' : confirmed.length >= 1 ? 'activo' : 'nuevo',
  });
}

export function updateCustomer(
  id: string,
  patch: Partial<Pick<AdminCustomer, 'status' | 'notes' | 'segment' | 'last_purchase'>>,
): AdminCustomer | null {
  const list = listCustomers();
  const current = list.find((customer) => customer.id === id);
  if (!current) return null;
  const next = { ...current, ...patch };
  saveList(
    CUSTOMERS_KEY,
    list.map((customer) => (customer.id === id ? next : customer)),
  );
  return next;
}

export function listMovements(): StockMovement[] {
  return loadList<StockMovement>(MOVEMENTS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function listBatches(): ProductionBatch[] {
  return loadList<ProductionBatch>(BATCHES_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function registerMovement(input: {
  product_id: string;
  type: StockMovement['type'];
  quantity: number;
  reason: string;
}): StockMovement {
  const product = getCatalogProduct(input.product_id);
  if (!product) throw new Error('Seleccioná un producto.');
  const signed =
    input.type === 'salida' || input.type === 'perdida' || input.type === 'rotura' || input.type === 'vencimiento'
      ? -Math.abs(input.quantity)
      : input.type === 'ajuste'
        ? input.quantity
        : Math.abs(input.quantity);
  const stock = Number(product.stock) + signed;
  if (stock < 0) throw new Error('La cantidad dejaría el stock en negativo o es inválida.');
  setProductStock(product.id, stock);
  const movement: StockMovement = {
    id: newId('mov'),
    created_at: nowIso(),
    product_id: product.id,
    product_name: product.name,
    type: input.type,
    quantity: signed,
    stock_after: stock,
    reason: input.reason.trim(),
  };
  saveList(MOVEMENTS_KEY, [movement, ...listMovements()]);
  return movement;
}

export function registerBatch(input: {
  product_id: string;
  lot_code: string;
  quantity: number;
  made_at: string;
  unit_cost: number;
}): ProductionBatch {
  const product = getCatalogProduct(input.product_id);
  if (!product || !input.lot_code.trim() || input.quantity <= 0) {
    throw new Error('Completá producto, lote y cantidad.');
  }
  const batch: ProductionBatch = {
    id: newId('lot'),
    created_at: nowIso(),
    product_id: product.id,
    product_name: product.name,
    lot_code: input.lot_code.trim(),
    quantity: input.quantity,
    made_at: input.made_at || nowIso().slice(0, 10),
    unit_cost: input.unit_cost || Number(product.cost_price) || 0,
  };
  saveList(BATCHES_KEY, [batch, ...listBatches()]);
  registerMovement({
    product_id: product.id,
    type: 'entrada',
    quantity: input.quantity,
    reason: `Lote ${batch.lot_code}`,
  });
  setProductStock(product.id, Number(getCatalogProduct(product.id)?.stock || 0), {
    lot_code: batch.lot_code,
    cost_price: batch.unit_cost || product.cost_price,
  });
  return batch;
}

export function listDesigns(): CreativeDesign[] {
  return loadList<CreativeDesign>(DESIGNS_KEY).sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveDesign(input: Omit<CreativeDesign, 'id' | 'created_at'>): CreativeDesign {
  const record: CreativeDesign = { ...input, id: newId('des'), created_at: nowIso() };
  saveList(DESIGNS_KEY, [record, ...listDesigns()]);
  return record;
}

export function listEvents(): AdminEvent[] {
  return loadList<AdminEvent>(EVENTS_KEY);
}

export function trackEvent(type: AdminEvent['type'], path?: string): void {
  const events = listEvents();
  events.push({ id: newId('evt'), created_at: nowIso(), type, path });
  saveList(EVENTS_KEY, events.slice(-500));
}

export function loadAdminBundle(): {
  products: Product[];
  orders: AdminOrder[];
  carts: AdminCart[];
  events: AdminEvent[];
  customers: AdminCustomer[];
  pastry_requests: AdminPastryRequest[];
  movements: StockMovement[];
  batches: ProductionBatch[];
  designs: CreativeDesign[];
} {
  return {
    products: [],
    orders: listOrders(),
    carts: listAdminCarts(),
    events: listEvents(),
    customers: listCustomers(),
    pastry_requests: listPastryRequests(),
    movements: listMovements(),
    batches: listBatches(),
    designs: listDesigns(),
  };
}
