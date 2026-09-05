'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import styles from './gestion.module.css';

type ModuleKey =
  | 'dashboard'
  | 'products'
  | 'customers'
  | 'sales'
  | 'inventory'
  | 'purchases'
  | 'finance'
  | 'personal'
  | 'ai'
  | 'audit';

type Role = 'Administrador' | 'Gerencia' | 'Ventas' | 'Stock';
type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reserved: number;
  minStock: number;
  supplier: string;
  active: boolean;
};
type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  segment: string;
  totalSpent: number;
  lastPurchase: string;
  consent: boolean;
  notes: string;
};
type OrderLine = { productId: string; qty: number; unitPrice: number };
type Order = {
  id: string;
  customerId: string;
  channel: 'POS' | 'Web' | 'Marketplace' | 'Venta asistida';
  status: 'Confirmado' | 'Preparando' | 'Entregado' | 'Devuelto';
  date: string;
  total: number;
  lines: OrderLine[];
};
type FinanceTransaction = {
  id: string;
  date: string;
  type: 'Ingreso' | 'Egreso';
  category: string;
  description: string;
  amount: number;
};
type AuditEvent = {
  id: string;
  at: string;
  module: string;
  action: string;
  detail: string;
};
type ReorderDraft = {
  id: string;
  productId: string;
  supplier: string;
  qty: number;
  estimatedCost: number;
  status: 'Borrador';
};

type AiMessage = { id: string; role: 'user' | 'assistant'; text: string };

const now = new Date();
const isoDate = (daysAgo = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
};

const seedProducts: Product[] = [
  { id: 'p1', sku: 'SKU-1001', name: 'Perfume Citrus 100 ml', category: 'Perfumería', price: 42900, cost: 24800, stock: 18, reserved: 3, minStock: 8, supplier: 'Proveedor Norte', active: true },
  { id: 'p2', sku: 'SKU-1002', name: 'Body Splash Floral 200 ml', category: 'Cuidado personal', price: 21900, cost: 11800, stock: 6, reserved: 2, minStock: 10, supplier: 'Proveedor Norte', active: true },
  { id: 'p3', sku: 'SKU-1003', name: 'Crema corporal 400 ml', category: 'Cuidado personal', price: 17900, cost: 9400, stock: 31, reserved: 4, minStock: 12, supplier: 'Distribuidora Centro', active: true },
  { id: 'p4', sku: 'SKU-1004', name: 'Kit regalo esencial', category: 'Combos', price: 54900, cost: 33600, stock: 4, reserved: 1, minStock: 6, supplier: 'Distribuidora Centro', active: true },
  { id: 'p5', sku: 'SKU-1005', name: 'Jabón vegetal x 5', category: 'Higiene', price: 14900, cost: 7200, stock: 42, reserved: 5, minStock: 15, supplier: 'Proveedor Sur', active: true },
];

const seedCustomers: Customer[] = [
  { id: 'c1', name: 'María López', email: 'maria@example.com', phone: '+54 387 555 0101', segment: 'Recurrente', totalSpent: 186300, lastPurchase: isoDate(8), consent: true, notes: 'Prefiere perfumes cítricos y regalos.' },
  { id: 'c2', name: 'Carlos Pérez', email: 'carlos@example.com', phone: '+54 387 555 0102', segment: 'Nuevo', totalSpent: 54900, lastPurchase: isoDate(16), consent: true, notes: 'Primera compra por web.' },
  { id: 'c3', name: 'Lucía Díaz', email: 'lucia@example.com', phone: '+54 387 555 0103', segment: 'VIP', totalSpent: 412700, lastPurchase: isoDate(3), consent: true, notes: 'Alta frecuencia; valora combos y envío rápido.' },
  { id: 'c4', name: 'Juan Gómez', email: 'juan@example.com', phone: '+54 387 555 0104', segment: 'En riesgo', totalSpent: 98300, lastPurchase: isoDate(96), consent: false, notes: 'No enviar campañas sin renovar consentimiento.' },
];

const seedOrders: Order[] = [
  { id: 'V-1048', customerId: 'c3', channel: 'Web', status: 'Entregado', date: isoDate(1), total: 69700, lines: [{ productId: 'p1', qty: 1, unitPrice: 42900 }, { productId: 'p5', qty: 1, unitPrice: 14900 }, { productId: 'p3', qty: 1, unitPrice: 11900 }] },
  { id: 'V-1047', customerId: 'c1', channel: 'Venta asistida', status: 'Preparando', date: isoDate(2), total: 54900, lines: [{ productId: 'p4', qty: 1, unitPrice: 54900 }] },
  { id: 'V-1046', customerId: 'c2', channel: 'Marketplace', status: 'Confirmado', date: isoDate(4), total: 43800, lines: [{ productId: 'p2', qty: 2, unitPrice: 21900 }] },
  { id: 'V-1045', customerId: 'c1', channel: 'POS', status: 'Entregado', date: isoDate(7), total: 57800, lines: [{ productId: 'p1', qty: 1, unitPrice: 42900 }, { productId: 'p5', qty: 1, unitPrice: 14900 }] },
];

const seedFinance: FinanceTransaction[] = [
  { id: 'f1', date: isoDate(0), type: 'Ingreso', category: 'Ventas', description: 'Cobros del día', amount: 112800 },
  { id: 'f2', date: isoDate(1), type: 'Egreso', category: 'Proveedores', description: 'Pago mercadería', amount: 58600 },
  { id: 'f3', date: isoDate(2), type: 'Egreso', category: 'Logística', description: 'Despachos y entregas', amount: 12700 },
  { id: 'f4', date: isoDate(3), type: 'Ingreso', category: 'Ventas', description: 'Cobros e-commerce', amount: 173400 },
];

const seedPersonal: FinanceTransaction[] = [
  { id: 'pf1', date: isoDate(0), type: 'Ingreso', category: 'Ingreso personal', description: 'Ingreso mensual', amount: 520000 },
  { id: 'pf2', date: isoDate(2), type: 'Egreso', category: 'Hogar', description: 'Servicios y compras', amount: 114500 },
  { id: 'pf3', date: isoDate(5), type: 'Egreso', category: 'Ahorro', description: 'Transferencia a objetivo', amount: 80000 },
];

const seedAudit: AuditEvent[] = [
  { id: 'a1', at: new Date().toISOString(), module: 'Sistema', action: 'Inicialización', detail: 'MVP Gestión 2026 cargado con datos de demostración.' },
];

const storage = {
  products: 'gestion2026:products',
  customers: 'gestion2026:customers',
  orders: 'gestion2026:orders',
  finance: 'gestion2026:finance',
  personal: 'gestion2026:personal',
  audit: 'gestion2026:audit',
  drafts: 'gestion2026:reorder-drafts',
};

function usePersistedState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setValue(JSON.parse(raw) as T);
    } catch {
      // Local demo storage is non-critical; keep seed state if it cannot be read.
    } finally {
      setReady(true);
    }
  }, [key]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore local storage quota/privacy mode errors in the demo.
    }
  }, [key, ready, value]);

  return [value, setValue] as const;
}

const money = (value: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

const shortDate = (value: string) => new Intl.DateTimeFormat('es-AR').format(new Date(`${value}T12:00:00`));

export default function GestionApp() {
  const [active, setActive] = useState<ModuleKey>('dashboard');
  const [role, setRole] = useState<Role>('Administrador');
  const [products, setProducts] = usePersistedState(storage.products, seedProducts);
  const [customers, setCustomers] = usePersistedState(storage.customers, seedCustomers);
  const [orders, setOrders] = usePersistedState(storage.orders, seedOrders);
  const [finance, setFinance] = usePersistedState(storage.finance, seedFinance);
  const [personal, setPersonal] = usePersistedState(storage.personal, seedPersonal);
  const [audit, setAudit] = usePersistedState(storage.audit, seedAudit);
  const [reorderDrafts, setReorderDrafts] = usePersistedState<ReorderDraft[]>(storage.drafts, []);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [customerDetail, setCustomerDetail] = useState<Customer | null>(null);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { id: 'm0', role: 'assistant', text: 'Copiloto listo. Puedo analizar ventas, stock, clientes, margen y preparar borradores de reposición. Las acciones sensibles quedan en borrador para revisión humana.' },
  ]);

  const available = (p: Product) => Math.max(0, p.stock - p.reserved);
  const lowStock = useMemo(() => products.filter((p) => p.active && available(p) <= p.minStock), [products]);
  const revenue = useMemo(() => orders.filter((o) => o.status !== 'Devuelto').reduce((sum, o) => sum + o.total, 0), [orders]);
  const totalCost = useMemo(
    () => orders.filter((o) => o.status !== 'Devuelto').reduce((sum, o) => sum + o.lines.reduce((lineSum, line) => {
      const product = products.find((p) => p.id === line.productId);
      return lineSum + (product?.cost ?? 0) * line.qty;
    }, 0), 0),
    [orders, products],
  );
  const grossMargin = revenue > 0 ? ((revenue - totalCost) / revenue) * 100 : 0;
  const businessBalance = useMemo(() => finance.reduce((sum, tx) => sum + (tx.type === 'Ingreso' ? tx.amount : -tx.amount), 0), [finance]);
  const personalBalance = useMemo(() => personal.reduce((sum, tx) => sum + (tx.type === 'Ingreso' ? tx.amount : -tx.amount), 0), [personal]);
  const stockValue = useMemo(() => products.reduce((sum, p) => sum + p.stock * p.cost, 0), [products]);

  const pushAudit = (module: string, action: string, detail: string) => {
    setAudit((current) => [{ id: crypto.randomUUID(), at: new Date().toISOString(), module, action, detail }, ...current].slice(0, 200));
  };

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 3200);
  };

  const resetDemo = () => {
    setProducts(seedProducts);
    setCustomers(seedCustomers);
    setOrders(seedOrders);
    setFinance(seedFinance);
    setPersonal(seedPersonal);
    setReorderDrafts([]);
    setAudit(seedAudit);
    setAiMessages([{ id: 'm0', role: 'assistant', text: 'Datos de demostración restablecidos. Las finanzas personales continúan separadas del libro empresarial.' }]);
    notify('Datos de demostración restablecidos.');
  };

  const addProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    const sku = String(form.get('sku') || '').trim();
    if (!name || !sku) return;
    if (products.some((p) => p.sku.toLowerCase() === sku.toLowerCase())) {
      notify('Ese SKU ya existe.');
      return;
    }
    const product: Product = {
      id: crypto.randomUUID(),
      sku,
      name,
      category: String(form.get('category') || 'General'),
      price: Number(form.get('price') || 0),
      cost: Number(form.get('cost') || 0),
      stock: Number(form.get('stock') || 0),
      reserved: 0,
      minStock: Number(form.get('minStock') || 0),
      supplier: String(form.get('supplier') || 'Sin asignar'),
      active: true,
    };
    setProducts((current) => [product, ...current]);
    pushAudit('Catálogo', 'Alta de producto', `${sku} · ${name}`);
    event.currentTarget.reset();
    notify('Producto creado.');
  };

  const adjustStock = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    setProducts((current) => current.map((p) => p.id === productId ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
    pushAudit('Inventario', 'Ajuste de stock', `${product.sku}: ${delta > 0 ? '+' : ''}${delta} unidades`);
    notify('Stock actualizado.');
  };

  const addCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get('name') || '').trim();
    if (!name) return;
    const customer: Customer = {
      id: crypto.randomUUID(),
      name,
      email: String(form.get('email') || ''),
      phone: String(form.get('phone') || ''),
      segment: 'Nuevo',
      totalSpent: 0,
      lastPurchase: '',
      consent: form.get('consent') === 'on',
      notes: String(form.get('notes') || ''),
    };
    setCustomers((current) => [customer, ...current]);
    pushAudit('CRM', 'Alta de cliente', name);
    event.currentTarget.reset();
    notify('Cliente creado.');
  };

  const createSale = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const productId = String(form.get('productId') || '');
    const customerId = String(form.get('customerId') || '');
    const qty = Math.max(1, Number(form.get('qty') || 1));
    const product = products.find((p) => p.id === productId);
    const customer = customers.find((c) => c.id === customerId);
    if (!product || !customer) return;
    if (available(product) < qty) {
      notify(`Stock disponible insuficiente: ${available(product)} unidades.`);
      return;
    }
    const total = product.price * qty;
    const order: Order = {
      id: `V-${String(1049 + orders.length).padStart(4, '0')}`,
      customerId,
      channel: String(form.get('channel') || 'POS') as Order['channel'],
      status: 'Confirmado',
      date: isoDate(0),
      total,
      lines: [{ productId, qty, unitPrice: product.price }],
    };
    setOrders((current) => [order, ...current]);
    setProducts((current) => current.map((p) => p.id === productId ? { ...p, stock: p.stock - qty } : p));
    setCustomers((current) => current.map((c) => c.id === customerId ? { ...c, totalSpent: c.totalSpent + total, lastPurchase: isoDate(0), segment: c.totalSpent + total > 250000 ? 'VIP' : c.segment } : c));
    setFinance((current) => [{ id: crypto.randomUUID(), date: isoDate(0), type: 'Ingreso', category: 'Ventas', description: `Venta ${order.id}`, amount: total }, ...current]);
    pushAudit('Ventas', 'Venta confirmada', `${order.id} · ${customer.name} · ${product.sku} x${qty} · ${money(total)}`);
    event.currentTarget.reset();
    notify(`Venta ${order.id} creada y stock descontado.`);
  };

  const addBusinessTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const tx: FinanceTransaction = {
      id: crypto.randomUUID(),
      date: String(form.get('date') || isoDate(0)),
      type: String(form.get('type') || 'Egreso') as FinanceTransaction['type'],
      category: String(form.get('category') || 'Otros'),
      description: String(form.get('description') || ''),
      amount: Math.abs(Number(form.get('amount') || 0)),
    };
    if (!tx.amount) return;
    setFinance((current) => [tx, ...current]);
    pushAudit('Finanzas', 'Movimiento empresarial', `${tx.type} · ${tx.category} · ${money(tx.amount)}`);
    event.currentTarget.reset();
    notify('Movimiento empresarial registrado.');
  };

  const addPersonalTransaction = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (role !== 'Administrador') return;
    const form = new FormData(event.currentTarget);
    const tx: FinanceTransaction = {
      id: crypto.randomUUID(),
      date: String(form.get('date') || isoDate(0)),
      type: String(form.get('type') || 'Egreso') as FinanceTransaction['type'],
      category: String(form.get('category') || 'Personal'),
      description: String(form.get('description') || ''),
      amount: Math.abs(Number(form.get('amount') || 0)),
    };
    if (!tx.amount) return;
    setPersonal((current) => [tx, ...current]);
    pushAudit('Finanzas personales', 'Movimiento personal', `${tx.type} · ${tx.category} · ${money(tx.amount)} (dominio separado)`);
    event.currentTarget.reset();
    notify('Movimiento personal registrado en dominio separado.');
  };

  const generateReorderDrafts = () => {
    const drafts = lowStock.map((product) => {
      const target = Math.max(product.minStock * 2, product.minStock + 1);
      const qty = Math.max(product.minStock, target - available(product));
      return {
        id: crypto.randomUUID(),
        productId: product.id,
        supplier: product.supplier,
        qty,
        estimatedCost: qty * product.cost,
        status: 'Borrador' as const,
      };
    });
    setReorderDrafts(drafts);
    pushAudit('Compras', 'Borradores de reposición', `${drafts.length} propuestas generadas; ninguna orden fue emitida automáticamente.`);
    notify(`${drafts.length} borradores creados para revisión.`);
  };

  const askAi = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = aiInput.trim();
    if (!question) return;
    setAiMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', text: question }]);
    const q = question.toLowerCase();
    let answer = '';
    if (q.includes('stock') || q.includes('rotura') || q.includes('inventario')) {
      answer = lowStock.length
        ? `Hay ${lowStock.length} artículos en nivel de reposición: ${lowStock.map((p) => `${p.sku} (${available(p)} disponibles / mínimo ${p.minStock})`).join('; ')}. Puedo preparar borradores de compra, pero no emitirlos sin revisión.`
        : 'No hay artículos por debajo del umbral de reposición configurado.';
    } else if (q.includes('venta') || q.includes('factur')) {
      answer = `Las ventas registradas suman ${money(revenue)} en ${orders.filter((o) => o.status !== 'Devuelto').length} pedidos. Ticket medio: ${money(revenue / Math.max(1, orders.filter((o) => o.status !== 'Devuelto').length))}. Margen bruto estimado: ${grossMargin.toFixed(1)}%.`;
    } else if (q.includes('cliente') || q.includes('crm') || q.includes('recompra')) {
      const top = [...customers].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 3);
      answer = `Los clientes con mayor valor histórico en este dataset son ${top.map((c) => `${c.name} (${money(c.totalSpent)})`).join(', ')}. Hay ${customers.filter((c) => c.segment === 'En riesgo').length} cliente(s) marcado(s) en riesgo y ${customers.filter((c) => !c.consent).length} sin consentimiento comercial activo.`;
    } else if (q.includes('margen') || q.includes('rentab')) {
      answer = `Margen bruto estimado: ${grossMargin.toFixed(1)}%. Ingresos por ventas: ${money(revenue)}; coste estimado de mercadería: ${money(totalCost)}. Este cálculo usa costes actuales del catálogo y es orientativo para el MVP.`;
    } else if (q.includes('repos') || q.includes('compra') || q.includes('proveedor')) {
      answer = lowStock.length
        ? `Sugiero preparar reposición para ${lowStock.map((p) => `${p.sku}: ${Math.max(p.minStock, p.minStock * 2 - available(p))} u. a ${p.supplier}`).join('; ')}. La ejecución debe quedar sujeta a aprobación.`
        : 'No detecto necesidad inmediata de reposición según los mínimos configurados.';
    } else if (q.includes('caja') || q.includes('finanz')) {
      answer = `Saldo operativo empresarial del demo: ${money(businessBalance)}. Las finanzas personales están aisladas y sólo se muestran por separado al rol Administrador.`;
    } else {
      answer = `Resumen operativo: ${money(revenue)} en ventas, ${products.length} SKU, ${customers.length} clientes, ${lowStock.length} alertas de stock y ${money(businessBalance)} de saldo empresarial en el demo. Preguntame por ventas, stock, clientes, margen, caja o reposición.`;
    }
    setAiMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', text: answer }]);
    pushAudit('IA', 'Consulta analítica', question.slice(0, 120));
    setAiInput('');
  };

  const visibleProducts = products.filter((p) => `${p.sku} ${p.name} ${p.category} ${p.supplier}`.toLowerCase().includes(search.toLowerCase()));
  const visibleCustomers = customers.filter((c) => `${c.name} ${c.email} ${c.phone} ${c.segment}`.toLowerCase().includes(search.toLowerCase()));

  const navItems: Array<{ key: ModuleKey; label: string; group: string }> = [
    { key: 'dashboard', label: 'Panel general', group: 'Inicio' },
    { key: 'products', label: 'Catálogo y precios', group: 'Comercio' },
    { key: 'sales', label: 'Ventas y pedidos', group: 'Comercio' },
    { key: 'inventory', label: 'Inventario', group: 'Operación' },
    { key: 'purchases', label: 'Compras', group: 'Operación' },
    { key: 'customers', label: 'CRM · Clientes 360°', group: 'Clientes' },
    { key: 'finance', label: 'Finanzas empresa', group: 'Finanzas' },
    { key: 'personal', label: 'Finanzas personales', group: 'Finanzas' },
    { key: 'ai', label: 'Copiloto IA', group: 'Inteligencia' },
    { key: 'audit', label: 'Auditoría', group: 'Seguridad' },
  ];

  const allowed = (key: ModuleKey) => {
    if (role === 'Administrador' || role === 'Gerencia') return key !== 'personal' || role === 'Administrador';
    if (role === 'Ventas') return ['dashboard', 'products', 'customers', 'sales', 'ai'].includes(key);
    return ['dashboard', 'products', 'inventory', 'purchases', 'ai'].includes(key);
  };

  useEffect(() => {
    if (!allowed(active)) setActive('dashboard');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  return (
    <div className={styles.app}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <div className={styles.brandMark}>G26</div>
          <div>
            <strong>Gestión 2026</strong>
            <small>ERP · CRM · Retail · IA</small>
          </div>
        </div>

        <div className={styles.tenantCard}>
          <span>Organización demo</span>
          <strong>Comercio Central</strong>
          <small>Argentina · ARS</small>
        </div>

        <nav className={styles.nav} aria-label="Módulos de gestión">
          {Array.from(new Set(navItems.map((item) => item.group))).map((group) => (
            <div className={styles.navGroup} key={group}>
              <span className={styles.navGroupLabel}>{group}</span>
              {navItems.filter((item) => item.group === group && allowed(item.key)).map((item) => (
                <button key={item.key} className={active === item.key ? styles.navActive : ''} onClick={() => setActive(item.key)}>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <span>MVP conectado a datos locales</span>
          <button onClick={resetDemo}>Restablecer demo</button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <span className={styles.eyebrow}>Plataforma de gestión integral</span>
            <h1>{navItems.find((item) => item.key === active)?.label ?? 'Gestión 2026'}</h1>
          </div>
          <div className={styles.topActions}>
            <label className={styles.roleSelect}>
              <span>Rol</span>
              <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                <option>Administrador</option>
                <option>Gerencia</option>
                <option>Ventas</option>
                <option>Stock</option>
              </select>
            </label>
            <button className={styles.aiShortcut} onClick={() => setActive('ai')}>Abrir copiloto</button>
          </div>
        </header>

        {notice && <div className={styles.notice} role="status">{notice}</div>}

        <section className={styles.content}>
          {active === 'dashboard' && (
            <>
              <div className={styles.hero}>
                <div>
                  <span className={styles.badge}>Estado operativo</span>
                  <h2>Una sola vista para vender, comprar, controlar stock y entender al cliente.</h2>
                  <p>Este MVP mantiene catálogo, clientes, pedidos, inventario, caja empresarial y finanzas personales en dominios separados. La IA consulta datos vivos del propio estado de la aplicación y las acciones sensibles quedan como propuestas.</p>
                </div>
                <div className={styles.heroScore}>
                  <span>Alertas activas</span>
                  <strong>{lowStock.length}</strong>
                  <small>artículos requieren revisión de reposición</small>
                </div>
              </div>

              <div className={styles.metricGrid}>
                <Metric label="Ventas registradas" value={money(revenue)} note={`${orders.length} pedidos`} />
                <Metric label="Margen bruto estimado" value={`${grossMargin.toFixed(1)}%`} note={`Costo mercadería ${money(totalCost)}`} />
                <Metric label="Stock valorizado" value={money(stockValue)} note={`${products.length} SKU activos`} />
                <Metric label="Saldo operativo" value={money(businessBalance)} note="Finanzas empresa" />
              </div>

              <div className={styles.twoColumns}>
                <Panel title="Alertas de inventario" action={<button onClick={() => setActive('inventory')}>Ver inventario</button>}>
                  {lowStock.length === 0 ? <Empty text="No hay alertas de stock." /> : lowStock.map((p) => (
                    <div className={styles.listRow} key={p.id}>
                      <div>
                        <strong>{p.name}</strong>
                        <small>{p.sku} · {p.supplier}</small>
                      </div>
                      <span className={styles.dangerPill}>{available(p)} disponibles</span>
                    </div>
                  ))}
                </Panel>
                <Panel title="Pedidos recientes" action={<button onClick={() => setActive('sales')}>Ver ventas</button>}>
                  {orders.slice(0, 5).map((o) => (
                    <div className={styles.listRow} key={o.id}>
                      <div>
                        <strong>{o.id} · {customers.find((c) => c.id === o.customerId)?.name ?? 'Cliente'}</strong>
                        <small>{shortDate(o.date)} · {o.channel}</small>
                      </div>
                      <div className={styles.alignRight}>
                        <strong>{money(o.total)}</strong>
                        <small>{o.status}</small>
                      </div>
                    </div>
                  ))}
                </Panel>
              </div>

              <Panel title="Siguiente mejor acción" action={<button onClick={() => setActive('ai')}>Consultar IA</button>}>
                <div className={styles.insightGrid}>
                  <Insight title="Reposición" text={lowStock.length ? `Preparar borradores para ${lowStock.length} SKU por debajo del mínimo.` : 'Inventario dentro de mínimos configurados.'} />
                  <Insight title="CRM" text={`${customers.filter((c) => c.segment === 'En riesgo').length} cliente(s) en riesgo de recompra; revisar consentimiento antes de contactar.`} />
                  <Insight title="Rentabilidad" text={`Margen bruto estimado ${grossMargin.toFixed(1)}%. Revisar promociones si baja del umbral objetivo.`} />
                </div>
              </Panel>
            </>
          )}

          {active === 'products' && (
            <>
              <div className={styles.sectionHeader}>
                <div><h2>Catálogo maestro</h2><p>SKU único, precio, coste, proveedor y disponibilidad desde una sola fuente.</p></div>
                <input className={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar SKU, producto o proveedor" />
              </div>
              <div className={styles.splitLayout}>
                <Panel title="Productos">
                  <div className={styles.tableWrap}>
                    <table>
                      <thead><tr><th>SKU</th><th>Producto</th><th>Precio</th><th>Costo</th><th>Disp.</th><th>Margen</th></tr></thead>
                      <tbody>{visibleProducts.map((p) => {
                        const margin = p.price ? ((p.price - p.cost) / p.price) * 100 : 0;
                        return <tr key={p.id}><td>{p.sku}</td><td><strong>{p.name}</strong><small>{p.category}</small></td><td>{money(p.price)}</td><td>{money(p.cost)}</td><td><span className={available(p) <= p.minStock ? styles.dangerPill : styles.okPill}>{available(p)}</span></td><td>{margin.toFixed(1)}%</td></tr>;
                      })}</tbody>
                    </table>
                  </div>
                </Panel>
                <Panel title="Nuevo producto">
                  <form className={styles.form} onSubmit={addProduct}>
                    <label>SKU<input name="sku" required placeholder="SKU-1006" /></label>
                    <label>Nombre<input name="name" required placeholder="Nombre comercial" /></label>
                    <div className={styles.formRow}><label>Categoría<input name="category" placeholder="Categoría" /></label><label>Proveedor<input name="supplier" placeholder="Proveedor" /></label></div>
                    <div className={styles.formRow}><label>Precio<input name="price" type="number" min="0" required /></label><label>Costo<input name="cost" type="number" min="0" required /></label></div>
                    <div className={styles.formRow}><label>Stock inicial<input name="stock" type="number" min="0" defaultValue="0" /></label><label>Stock mínimo<input name="minStock" type="number" min="0" defaultValue="5" /></label></div>
                    <button className={styles.primary} type="submit">Crear producto</button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {active === 'customers' && (
            <>
              <div className={styles.sectionHeader}>
                <div><h2>CRM y cliente 360°</h2><p>Identidad, compras, consentimiento, segmento y notas comerciales.</p></div>
                <input className={styles.search} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente, email o segmento" />
              </div>
              <div className={styles.splitLayout}>
                <Panel title="Clientes">
                  <div className={styles.customerGrid}>
                    {visibleCustomers.map((c) => (
                      <button className={styles.customerCard} key={c.id} onClick={() => setCustomerDetail(c)}>
                        <div className={styles.avatar}>{c.name.split(' ').map((part) => part[0]).join('').slice(0, 2)}</div>
                        <div><strong>{c.name}</strong><small>{c.email || c.phone}</small><span>{c.segment}</span></div>
                        <div className={styles.alignRight}><strong>{money(c.totalSpent)}</strong><small>{c.lastPurchase ? `Última ${shortDate(c.lastPurchase)}` : 'Sin compras'}</small></div>
                      </button>
                    ))}
                  </div>
                </Panel>
                <Panel title="Nuevo cliente">
                  <form className={styles.form} onSubmit={addCustomer}>
                    <label>Nombre<input name="name" required /></label>
                    <label>Email<input name="email" type="email" /></label>
                    <label>Teléfono<input name="phone" /></label>
                    <label>Notas<textarea name="notes" rows={3} /></label>
                    <label className={styles.check}><input name="consent" type="checkbox" /> Consentimiento comercial registrado</label>
                    <button className={styles.primary} type="submit">Crear cliente</button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {active === 'sales' && (
            <>
              <div className={styles.sectionHeader}><div><h2>Ventas y pedidos</h2><p>Pedido, cliente, canal y stock comparten identificadores trazables.</p></div></div>
              <div className={styles.splitLayout}>
                <Panel title="Pedidos">
                  <div className={styles.tableWrap}><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Canal</th><th>Fecha</th><th>Estado</th><th>Total</th></tr></thead><tbody>{orders.map((o) => <tr key={o.id}><td><strong>{o.id}</strong></td><td>{customers.find((c) => c.id === o.customerId)?.name ?? 'Cliente'}</td><td>{o.channel}</td><td>{shortDate(o.date)}</td><td><span className={styles.statusPill}>{o.status}</span></td><td>{money(o.total)}</td></tr>)}</tbody></table></div>
                </Panel>
                <Panel title="Nueva venta">
                  <form className={styles.form} onSubmit={createSale}>
                    <label>Cliente<select name="customerId" required defaultValue=""><option value="" disabled>Seleccionar cliente</option>{customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
                    <label>Producto<select name="productId" required defaultValue=""><option value="" disabled>Seleccionar producto</option>{products.filter((p) => p.active).map((p) => <option key={p.id} value={p.id}>{p.sku} · {p.name} · {available(p)} disp.</option>)}</select></label>
                    <div className={styles.formRow}><label>Cantidad<input name="qty" type="number" min="1" defaultValue="1" /></label><label>Canal<select name="channel" defaultValue="POS"><option>POS</option><option>Web</option><option>Marketplace</option><option>Venta asistida</option></select></label></div>
                    <div className={styles.callout}>Al confirmar se descuenta stock, actualiza el cliente, registra ingreso y genera auditoría.</div>
                    <button className={styles.primary} type="submit">Confirmar venta</button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {active === 'inventory' && (
            <>
              <div className={styles.sectionHeader}><div><h2>Inventario multiestado</h2><p>El disponible se calcula como existencia física menos reservado. Este MVP conserva la separación conceptual requerida para omnicanalidad.</p></div></div>
              <Panel title="Existencias">
                <div className={styles.tableWrap}><table><thead><tr><th>SKU</th><th>Producto</th><th>Físico</th><th>Reservado</th><th>Disponible</th><th>Mínimo</th><th>Ajustar</th></tr></thead><tbody>{products.map((p) => <tr key={p.id}><td>{p.sku}</td><td><strong>{p.name}</strong><small>{p.supplier}</small></td><td>{p.stock}</td><td>{p.reserved}</td><td><span className={available(p) <= p.minStock ? styles.dangerPill : styles.okPill}>{available(p)}</span></td><td>{p.minStock}</td><td><div className={styles.inlineActions}><button onClick={() => adjustStock(p.id, -1)} aria-label={`Restar una unidad a ${p.name}`}>−1</button><button onClick={() => adjustStock(p.id, 1)} aria-label={`Sumar una unidad a ${p.name}`}>+1</button><button onClick={() => adjustStock(p.id, 10)} aria-label={`Sumar diez unidades a ${p.name}`}>+10</button></div></td></tr>)}</tbody></table></div>
              </Panel>
            </>
          )}

          {active === 'purchases' && (
            <>
              <div className={styles.sectionHeader}>
                <div><h2>Compras y reposición</h2><p>La propuesta usa stock disponible y mínimos; nunca emite una orden definitiva sin aprobación.</p></div>
                <button className={styles.primary} onClick={generateReorderDrafts}>Generar borradores</button>
              </div>
              <div className={styles.metricGrid}>
                <Metric label="SKU a reponer" value={String(lowStock.length)} note="según mínimos actuales" />
                <Metric label="Borradores" value={String(reorderDrafts.length)} note="sin compromiso de compra" />
                <Metric label="Costo estimado" value={money(reorderDrafts.reduce((sum, d) => sum + d.estimatedCost, 0))} note="sujeto a revisión proveedor" />
              </div>
              <Panel title="Propuestas de compra">
                {reorderDrafts.length === 0 ? <Empty text="Todavía no hay borradores. Generá propuestas para los SKU con riesgo de rotura." /> : <div className={styles.tableWrap}><table><thead><tr><th>Producto</th><th>Proveedor</th><th>Cantidad</th><th>Costo estimado</th><th>Estado</th></tr></thead><tbody>{reorderDrafts.map((d) => { const p = products.find((item) => item.id === d.productId); return <tr key={d.id}><td><strong>{p?.sku}</strong><small>{p?.name}</small></td><td>{d.supplier}</td><td>{d.qty}</td><td>{money(d.estimatedCost)}</td><td><span className={styles.statusPill}>{d.status}</span></td></tr>; })}</tbody></table></div>}
              </Panel>
            </>
          )}

          {active === 'finance' && (
            <>
              <div className={styles.sectionHeader}><div><h2>Finanzas empresariales</h2><p>Caja operativa separada del patrimonio personal.</p></div></div>
              <div className={styles.metricGrid}>
                <Metric label="Saldo registrado" value={money(businessBalance)} note="ingresos menos egresos" />
                <Metric label="Ingresos" value={money(finance.filter((t) => t.type === 'Ingreso').reduce((s, t) => s + t.amount, 0))} note="movimientos empresariales" />
                <Metric label="Egresos" value={money(finance.filter((t) => t.type === 'Egreso').reduce((s, t) => s + t.amount, 0))} note="movimientos empresariales" />
              </div>
              <div className={styles.splitLayout}>
                <Panel title="Movimientos">
                  <div className={styles.tableWrap}><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Detalle</th><th>Importe</th></tr></thead><tbody>{finance.map((tx) => <tr key={tx.id}><td>{shortDate(tx.date)}</td><td>{tx.type}</td><td>{tx.category}</td><td>{tx.description}</td><td className={tx.type === 'Ingreso' ? styles.positive : styles.negative}>{tx.type === 'Ingreso' ? '+' : '−'}{money(tx.amount)}</td></tr>)}</tbody></table></div>
                </Panel>
                <Panel title="Registrar movimiento">
                  <form className={styles.form} onSubmit={addBusinessTransaction}>
                    <div className={styles.formRow}><label>Fecha<input name="date" type="date" defaultValue={isoDate(0)} /></label><label>Tipo<select name="type"><option>Ingreso</option><option>Egreso</option></select></label></div>
                    <label>Categoría<input name="category" required placeholder="Ventas, proveedor, logística..." /></label>
                    <label>Descripción<input name="description" required /></label>
                    <label>Importe<input name="amount" type="number" min="0" required /></label>
                    <button className={styles.primary} type="submit">Registrar</button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {active === 'personal' && role === 'Administrador' && (
            <>
              <div className={styles.separationBanner}><strong>Dominio separado</strong><span>Estos movimientos no entran en el libro empresarial. En producción usarían almacenamiento, permisos y retención independientes.</span></div>
              <div className={styles.metricGrid}>
                <Metric label="Saldo personal" value={money(personalBalance)} note="vista privada del propietario" />
                <Metric label="Ahorro registrado" value={money(personal.filter((t) => t.category === 'Ahorro').reduce((s, t) => s + t.amount, 0))} note="objetivo personal" />
              </div>
              <div className={styles.splitLayout}>
                <Panel title="Movimientos personales">
                  <div className={styles.tableWrap}><table><thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría</th><th>Detalle</th><th>Importe</th></tr></thead><tbody>{personal.map((tx) => <tr key={tx.id}><td>{shortDate(tx.date)}</td><td>{tx.type}</td><td>{tx.category}</td><td>{tx.description}</td><td className={tx.type === 'Ingreso' ? styles.positive : styles.negative}>{tx.type === 'Ingreso' ? '+' : '−'}{money(tx.amount)}</td></tr>)}</tbody></table></div>
                </Panel>
                <Panel title="Registrar movimiento personal">
                  <form className={styles.form} onSubmit={addPersonalTransaction}>
                    <div className={styles.formRow}><label>Fecha<input name="date" type="date" defaultValue={isoDate(0)} /></label><label>Tipo<select name="type"><option>Ingreso</option><option>Egreso</option></select></label></div>
                    <label>Categoría<input name="category" required /></label>
                    <label>Descripción<input name="description" required /></label>
                    <label>Importe<input name="amount" type="number" min="0" required /></label>
                    <button className={styles.primary} type="submit">Registrar en dominio personal</button>
                  </form>
                </Panel>
              </div>
            </>
          )}

          {active === 'ai' && (
            <>
              <div className={styles.sectionHeader}><div><h2>Copiloto de gestión</h2><p>Consulta datos del estado actual. Para el MVP usa reglas deterministas y no un modelo externo; esto permite validar UX, permisos y flujos antes de conectar un LLM/RAG.</p></div><button onClick={generateReorderDrafts}>Preparar borradores de reposición</button></div>
              <div className={styles.aiLayout}>
                <div className={styles.chatPanel}>
                  <div className={styles.chatMessages}>
                    {aiMessages.map((message) => <div key={message.id} className={message.role === 'assistant' ? styles.aiMessage : styles.userMessage}><span>{message.role === 'assistant' ? 'Copiloto' : 'Vos'}</span><p>{message.text}</p></div>)}
                  </div>
                  <form className={styles.aiComposer} onSubmit={askAi}>
                    <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="Ej.: ¿Qué productos tienen riesgo de rotura?" />
                    <button className={styles.primary} type="submit">Consultar</button>
                  </form>
                </div>
                <div className={styles.aiSide}>
                  <Panel title="Política de autonomía">
                    <div className={styles.policyList}>
                      <div><strong>Informativo</strong><span>Automático: ventas, stock, clientes, KPI.</span></div>
                      <div><strong>Analítico</strong><span>Automático con explicación y datos usados.</span></div>
                      <div><strong>Propositivo</strong><span>Puede crear borradores; requiere revisión.</span></div>
                      <div><strong>Transaccional</strong><span>No se ejecuta sin aprobación explícita.</span></div>
                    </div>
                  </Panel>
                  <Panel title="Datos en vivo del MVP">
                    <div className={styles.kpiList}><span>SKU <strong>{products.length}</strong></span><span>Clientes <strong>{customers.length}</strong></span><span>Pedidos <strong>{orders.length}</strong></span><span>Alertas <strong>{lowStock.length}</strong></span></div>
                  </Panel>
                </div>
              </div>
            </>
          )}

          {active === 'audit' && (
            <>
              <div className={styles.sectionHeader}><div><h2>Auditoría</h2><p>Registro local de cambios críticos y consultas del copiloto.</p></div></div>
              <Panel title="Eventos recientes">
                <div className={styles.tableWrap}><table><thead><tr><th>Fecha/hora</th><th>Módulo</th><th>Acción</th><th>Detalle</th></tr></thead><tbody>{audit.map((event) => <tr key={event.id}><td>{new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(event.at))}</td><td>{event.module}</td><td><strong>{event.action}</strong></td><td>{event.detail}</td></tr>)}</tbody></table></div>
              </Panel>
            </>
          )}
        </section>
      </main>

      {customerDetail && (
        <div className={styles.modalBackdrop} onMouseDown={() => setCustomerDetail(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`Cliente ${customerDetail.name}`} onMouseDown={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}><div><span className={styles.badge}>Cliente 360°</span><h2>{customerDetail.name}</h2></div><button onClick={() => setCustomerDetail(null)} aria-label="Cerrar detalle">Cerrar</button></div>
            <div className={styles.metricGrid}>
              <Metric label="Valor histórico" value={money(customerDetail.totalSpent)} note={customerDetail.segment} />
              <Metric label="Última compra" value={customerDetail.lastPurchase ? shortDate(customerDetail.lastPurchase) : 'Sin compras'} note="historial comercial" />
              <Metric label="Consentimiento" value={customerDetail.consent ? 'Activo' : 'No activo'} note="marketing" />
            </div>
            <div className={styles.detailGrid}><div><span>Email</span><strong>{customerDetail.email || '—'}</strong></div><div><span>Teléfono</span><strong>{customerDetail.phone || '—'}</strong></div><div className={styles.full}><span>Notas</span><p>{customerDetail.notes || 'Sin notas.'}</p></div></div>
            <h3>Pedidos asociados</h3>
            {orders.filter((o) => o.customerId === customerDetail.id).length === 0 ? <Empty text="Sin pedidos registrados." /> : orders.filter((o) => o.customerId === customerDetail.id).map((o) => <div className={styles.listRow} key={o.id}><div><strong>{o.id}</strong><small>{shortDate(o.date)} · {o.channel}</small></div><strong>{money(o.total)}</strong></div>)}
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className={styles.metric}><span>{label}</span><strong>{value}</strong><small>{note}</small></article>;
}

function Panel({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <article className={styles.panel}><header><h3>{title}</h3>{action}</header><div>{children}</div></article>;
}

function Insight({ title, text }: { title: string; text: string }) {
  return <div className={styles.insight}><span>{title}</span><p>{text}</p></div>;
}

function Empty({ text }: { text: string }) {
  return <div className={styles.empty}>{text}</div>;
}
