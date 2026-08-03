"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode, type SyntheticEvent } from 'react';
import type { CartItem, Product } from '@/types';
import { cachePageImageDimensions, catalogBrands, catalogCategories, catalogPages, catalogProducts, clampPageNumber, filterProducts, getAdjacentPagesToPreload, getCachedPageImageHeight, getCachedPageImageWidth, getHotspotsByPage, getPageImage, getPageTitle, getProductById, isPageImageCached, preloadPageImage } from '@/lib/catalog';
import { CART_STORAGE_KEY, ORDER_VENDOR, addOrMergeCartItem, buildOrderWhatsAppUrl, createCartItem, generateWhatsAppMessage, getCartCount, getProductColorOptions, getProductSizeOptions, normalizeQuantity, parseStoredCart, updateCartItemQuantity } from '@/lib/cart';
import { isHotspotTarget, isSwipeGesture, isTapGesture, SWIPE_THRESHOLD } from '@/lib/gestures';

type View = 'catalog' | 'products' | 'cart' | 'admin';

type CartNotice = {
  productName: string;
  resumeView: View;
  resumePage: number;
};

// Tres estados reales del visor:
//  - lectura : piso legible + scroll de respaldo dentro del visor (predeterminado en PC)
//  - ajustar : la página entra completa en el espacio disponible (contain)
//  - ampliar : dimensiones reales aumentadas por --zoom, con desplazamiento interno
type Mode = 'lectura' | 'ajustar' | 'ampliar';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const MOBILE_VIEWPORT = '(max-width: 768px)';

const DEFAULT_PAGE_RATIO = 0.5625; // ancho/alto de respaldo hasta conocer la proporción real
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function isMobileViewport() {
  return typeof window !== 'undefined' && window.matchMedia(MOBILE_VIEWPORT).matches;
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
}

function useOverlayAccessibility<T extends HTMLElement>(onClose: () => void) {
  const dialogRef = useRef<T | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      const [firstFocusable] = getFocusableElements(dialog);
      (firstFocusable ?? dialog).focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (!active || active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  return dialogRef;
}

function EditableQuantityInput({
  value,
  onChange,
  onCommit,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (quantity: number) => void;
  ariaLabel?: string;
}) {
  function commitValue() {
    const quantity = normalizeQuantity(value);
    onChange(String(quantity));
    onCommit?.(quantity);
  }

  return (
    <input
      type="number"
      min="1"
      step="1"
      inputMode="numeric"
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
      onBlur={commitValue}
    />
  );
}

function CartQuantityInput({
  quantity,
  ariaLabel,
  onCommit,
}: {
  quantity: number;
  ariaLabel: string;
  onCommit: (quantity: number) => void;
}) {
  const [draft, setDraft] = useState(String(normalizeQuantity(quantity)));

  useEffect(() => {
    setDraft(String(normalizeQuantity(quantity)));
  }, [quantity]);

  return (
    <EditableQuantityInput
      value={draft}
      onChange={setDraft}
      onCommit={onCommit}
      ariaLabel={ariaLabel}
    />
  );
}

// Escenario de la página. Calcula su tamaño en CSS a partir del espacio real
// disponible (container queries) y de la proporción real de la imagen.
// No usa transform: el ancho real crece con --zoom para que el contenedor
// desplazable represente el tamaño visual.
function PageStage({
  pageNumber,
  zoom,
  children,
}: {
  pageNumber: number;
  zoom: number;
  children?: ReactNode;
}) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const initialWidth = getCachedPageImageWidth(pageNumber);
  const initialHeight = getCachedPageImageHeight(pageNumber);
  const [ratio, setRatio] = useState<number>(
    initialWidth && initialHeight ? initialWidth / initialHeight : DEFAULT_PAGE_RATIO,
  );
  const [loading, setLoading] = useState<boolean>(!isPageImageCached(pageNumber));

  const applyDimensions = (naturalWidth: number, naturalHeight: number) => {
    if (naturalWidth && naturalHeight) {
      cachePageImageDimensions(pageNumber, naturalWidth, naturalHeight);
      setRatio(naturalWidth / naturalHeight);
    }
  };

  useEffect(() => {
    const cachedWidth = getCachedPageImageWidth(pageNumber);
    const cachedHeight = getCachedPageImageHeight(pageNumber);
    if (cachedWidth && cachedHeight) setRatio(cachedWidth / cachedHeight);

    // La imagen puede completarse antes de montar el handler onLoad (caché del
    // navegador), en cuyo caso onLoad no dispara. Se sincroniza vía img.complete.
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth) {
      applyDimensions(img.naturalWidth, img.naturalHeight);
      setLoading(false);
      return;
    }

    setLoading(!isPageImageCached(pageNumber));
    let cancelled = false;
    preloadPageImage(pageNumber).then(() => {
      if (cancelled) return;
      const width = getCachedPageImageWidth(pageNumber);
      const height = getCachedPageImageHeight(pageNumber);
      if (width && height) setRatio(width / height);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageNumber]);

  const handleLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    applyDimensions(img.naturalWidth, img.naturalHeight);
    setLoading(false);
  };

  const stageStyle = { '--page-ratio': ratio, '--zoom': zoom } as CSSProperties;

  return (
    <div className="catalogPageStage" style={stageStyle}>
      {loading && <div className="canvasLoading">Cargando página...</div>}
      <img
        ref={imgRef}
        key={pageNumber}
        src={getPageImage(pageNumber)}
        alt={`Página ${pageNumber} del catálogo INV 2026`}
        className="pageImage"
        onLoad={handleLoad}
        onError={() => setLoading(false)}
      />
      {children}
    </div>
  );
}

export default function CatalogApp() {
  const [view, setView] = useState<View>('catalog');
  const [currentPage, setCurrentPage] = useState(1);
  const [mode, setMode] = useState<Mode>('lectura');
  const [zoom, setZoom] = useState(1);
  const [showThumbs, setShowThumbs] = useState(true);
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lightboxPage, setLightboxPage] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartNotice, setCartNotice] = useState<CartNotice | null>(null);

  // ----- Gestos táctiles del visor -----
  // scrollRef: contenedor real donde ocurren los toques (.catalogScroll)
  // pointersRef: pointers activos para detectar 1 dedo (swipe) o 2 dedos (pinch)
  // gestureRef: estado del gesto en curso, fuera del ciclo de render
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const zoomRef = useRef(zoom);
  const modeRef = useRef(mode);
  const lastBaseModeRef = useRef<Mode>('lectura');
  const gestureRef = useRef({
    startX: 0,
    startY: 0,
    swipeCandidate: false,
    pinching: false,
    pinchStartDist: 0,
    pinchStartZoom: 1,
    modeBeforePinch: 'lectura' as Mode,
    // Ancla del centro de la pinza para que el zoom no "salte" al crecer el layout.
    anchorContentX: 0,
    anchorContentY: 0,
    anchorOffsetX: 0,
    anchorOffsetY: 0,
    anchorZoom: 1,
    // Si el pointer bajó sobre un hotspot, no capturamos el pointer en el
    // contenedor (si no, el <button> nunca recibe click). Un swipe claro sigue
    // pudiendo cambiar de página y suprime la apertura del producto.
    startedOnHotspot: false,
    suppressHotspotClick: false,
  });
  zoomRef.current = zoom;
  modeRef.current = mode;
  if (mode !== 'ampliar') lastBaseModeRef.current = mode;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CART_STORAGE_KEY);
      const restored = parseStoredCart(saved);
      setCart(restored);
      if (saved !== null && restored.length === 0) window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      setCart([]);
    } finally {
      setCartLoaded(true);
    }
  }, []);
  useEffect(() => {
    if (!cartLoaded) return;
    try {
      if (cart.length === 0) window.localStorage.removeItem(CART_STORAGE_KEY);
      else window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // localStorage puede fallar por permisos, cuota o modo privado; el carrito en memoria sigue funcionando.
    }
  }, [cart, cartLoaded]);
  useEffect(() => {
    preloadPageImage(currentPage);
    getAdjacentPagesToPreload(currentPage).forEach((page) => preloadPageImage(page));
  }, [currentPage]);
  // En celular el modo inicial es "ajustar": un piso de 430px en pantallas
  // angostas generaría scroll horizontal permanente. Se sincroniza el estado
  // (no sólo el CSS) y sin desajuste de hidratación: el primer render en
  // cliente coincide con el del servidor ('lectura') y luego el efecto ajusta.
  useEffect(() => {
    if (isMobileViewport()) setMode('ajustar');
  }, []);

  // Tras cada cambio de zoom durante una pinza, recoloca el scroll para que
  // el punto bajo los dedos siga en el mismo lugar de la pantalla.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const g = gestureRef.current;
    if (!el || !g.pinching || g.anchorZoom <= 0) return;
    const scale = zoom / g.anchorZoom;
    el.scrollLeft = g.anchorContentX * scale - g.anchorOffsetX;
    el.scrollTop = g.anchorContentY * scale - g.anchorOffsetY;
  }, [zoom]);

  // Bloquea el zoom nativo del navegador con dos dedos SOLO dentro del visor.
  // Se registra como listener no pasivo para poder llamar preventDefault en
  // iOS Safari, donde touch-action no siempre alcanza para el gesto de pinza.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const preventTwoFingerZoom = (ev: TouchEvent) => {
      if (ev.touches.length >= 2) ev.preventDefault();
    };
    el.addEventListener('touchmove', preventTwoFingerZoom, { passive: false });
    return () => el.removeEventListener('touchmove', preventTwoFingerZoom);
  }, [view]);

  const pageProducts = catalogProducts.filter((p) => p.page === currentPage);
  const pageHotspots = getHotspotsByPage(currentPage);
  const pageTitle = getPageTitle(currentPage);
  const filteredProducts = useMemo(
    () => filterProducts(catalogProducts, { query, brand: brandFilter, category: categoryFilter }),
    [query, brandFilter, categoryFilter],
  );

  function goToPage(n: number) { const next = clampPageNumber(n); setCurrentPage(next); setView('catalog'); }
  function selectMode(next: Mode) { setMode(next); if (next !== 'ampliar') setZoom(1); }
  function enterAmpliar() { setMode('ampliar'); setZoom((z) => (z <= 1 ? 1.25 : z)); }
  function zoomIn() { setMode('ampliar'); setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + 0.25) * 100) / 100)); }
  function zoomOut() {
    setZoom((z) => {
      const next = Math.max(MIN_ZOOM, Math.round((z - 0.25) * 100) / 100);
      if (next <= 1) setMode((m) => (m === 'ampliar' ? lastBaseModeRef.current : m));
      return next;
    });
  }

  function pinchDistance() {
    const pts = Array.from(pointersRef.current.values());
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  }

  function capturePinchAnchor() {
    const el = scrollRef.current;
    const pts = Array.from(pointersRef.current.values());
    if (!el || pts.length < 2) return;
    const g = gestureRef.current;
    const rect = el.getBoundingClientRect();
    const midX = (pts[0].x + pts[1].x) / 2;
    const midY = (pts[0].y + pts[1].y) / 2;
    g.anchorOffsetX = midX - rect.left;
    g.anchorOffsetY = midY - rect.top;
    g.anchorContentX = el.scrollLeft + g.anchorOffsetX;
    g.anchorContentY = el.scrollTop + g.anchorOffsetY;
    g.anchorZoom = zoomRef.current;
  }

  function applyPinchZoom(nextZoom: number) {
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, nextZoom));
    const rounded = Math.round(clamped * 100) / 100;
    zoomRef.current = rounded;
    setZoom(rounded);
    if (rounded > 1) setMode('ampliar');
    else setMode(gestureRef.current.modeBeforePinch);
  }

  function handleViewerPointerDown(e: ReactPointerEvent<HTMLDivElement>) {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    const onHotspot = isHotspotTarget(e.target);

    if (pointersRef.current.size === 2) {
      // Dos dedos: zoom interno. Capturamos para no perder el gesto si un dedo
      // salió del hotspot. En móvil partimos de "ajustar"; ampliar con
      // --zoom:1 debe verse igual (ver CSS) para no saltar al tocar con pinza.
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // Algunos navegadores rechazan capture si el pointer ya terminó.
      }
      g.pinching = true;
      g.swipeCandidate = false;
      g.startedOnHotspot = false;
      g.suppressHotspotClick = true;
      g.pinchStartDist = pinchDistance();
      g.pinchStartZoom = zoomRef.current;
      g.modeBeforePinch = modeRef.current === 'ampliar' ? lastBaseModeRef.current : modeRef.current;
      capturePinchAnchor();
      setMode('ampliar');
    } else if (pointersRef.current.size === 1) {
      g.startX = e.clientX;
      g.startY = e.clientY;
      g.pinching = false;
      g.startedOnHotspot = onHotspot;
      g.suppressHotspotClick = false;
      // Sólo es candidato a swipe si estamos en el tamaño base. Con zoom
      // ampliado un dedo desplaza la imagen (scroll nativo), no cambia página.
      g.swipeCandidate = zoomRef.current <= 1;
      // Causa raíz del clic muerto: setPointerCapture en el contenedor redirige
      // pointerup/click al scroll y el <button class="hotspot"> nunca recibe click.
      // En hotspots omitimos la captura para restaurar clic/toque/teclado.
      if (!onHotspot) {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Algunos navegadores rechazan capture si el pointer ya terminó.
        }
      }
    }
  }

  function handleViewerPointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gestureRef.current;
    if (g.pinching && pointersRef.current.size >= 2 && g.pinchStartDist > 0) {
      // Ancla el centro de la pinza al contenido actual antes de cambiar --zoom,
      // así el useLayoutEffect puede recolocar el scroll sin saltos.
      capturePinchAnchor();
      const ratio = pinchDistance() / g.pinchStartDist;
      applyPinchZoom(g.pinchStartZoom * ratio);
    } else if (g.startedOnHotspot && pointersRef.current.size === 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      // Si el usuario arrastra desde un hotspot (swipe o pan), no abrir producto.
      if (!isTapGesture(dx, dy)) g.suppressHotspotClick = true;
    }
  }

  function handleViewerPointerEnd(e: ReactPointerEvent<HTMLDivElement>) {
    const g = gestureRef.current;
    const wasPinching = g.pinching;
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) g.pinching = false;

    // Swipe con un dedo: sólo al soltar el último pointer, sin pinza previa y
    // en tamaño base. Debe ser claramente horizontal para no robar el scroll.
    if (pointersRef.current.size === 0 && !wasPinching && g.swipeCandidate && zoomRef.current <= 1) {
      const dx = e.clientX - g.startX;
      const dy = e.clientY - g.startY;
      if (isSwipeGesture(dx, dy, SWIPE_THRESHOLD)) {
        g.suppressHotspotClick = true;
        if (dx < 0) goToPage(currentPage + 1);
        else goToPage(currentPage - 1);
      }
    }
    if (pointersRef.current.size === 0) {
      g.swipeCandidate = false;
      g.startedOnHotspot = false;
      if (wasPinching && zoomRef.current <= 1) {
        setZoom(1);
        setMode(g.modeBeforePinch);
      }
    }
  }

  function openHotspotProduct(product: Product) {
    const g = gestureRef.current;
    // Pinch, swipe o arrastre desde el hotspot suprimen la apertura.
    if (g.pinching || g.suppressHotspotClick) {
      g.suppressHotspotClick = false;
      return;
    }
    setSelectedProduct(product);
  }

  function addToCart(product: Product, size: string, color: string, quantity: number) {
    setCart((c) => addOrMergeCartItem(c, createCartItem(product, size, color, quantity)));
    setSelectedProduct(null);
    setCartNotice({ productName: product.name, resumeView: view, resumePage: currentPage });
  }
  function continueShopping() {
    if (!cartNotice) return;
    setView(cartNotice.resumeView);
    if (cartNotice.resumeView === 'catalog') setCurrentPage(cartNotice.resumePage);
    setCartNotice(null);
  }
  function openCartFromNotice() {
    setCartNotice(null);
    setView('cart');
  }
  function sendOrderViaWhatsApp() {
    if (cart.length === 0) return;
    window.open(buildOrderWhatsAppUrl(cart), '_blank', 'noopener,noreferrer');
    setCart([]);
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Si localStorage no está disponible, el reseteo en memoria alcanza para esta sesión.
    }
    setCurrentPage(1);
    setView('catalog');
    setCartNotice(null);
  }
  const whatsappMessage = generateWhatsAppMessage(cart);

  return <main className="appShell"><header className="topbar"><div className="brand"><strong>Catálogo INV 2026</strong><small className="topbarMeta">218 páginas · {catalogProducts.length} productos · {catalogBrands.length} marcas</small></div><nav><button className={view==='catalog'?'active':''} onClick={()=>setView('catalog')}>Revista</button><button className={view==='products'?'active':''} onClick={()=>setView('products')}>Productos</button><button className="cartButton" onClick={()=>setView('cart')}>Carrito ({getCartCount(cart)})</button><details className="menu"><summary aria-label="Más opciones" title="Más opciones">☰</summary><div className="menuPanel"><button className={view==='admin'?'active':''} onClick={()=>setView('admin')}>Admin</button></div></details></nav></header>
  {view==='catalog' && <section className="catalogView"><div className="viewerHeader"><div className="viewerInfo"><h1>Página {currentPage} de {catalogPages.length}</h1><p className="viewerMeta">{pageTitle} · {pageProducts.length} productos clickeables</p></div><div className="viewerTools" role="group" aria-label="Modo de visualización de la revista"><button type="button" aria-pressed={mode==='lectura'} className={mode==='lectura'?'active':''} onClick={()=>selectMode('lectura')}>Lectura</button><button type="button" aria-pressed={mode==='ajustar'} className={mode==='ajustar'?'active':''} onClick={()=>selectMode('ajustar')}>Ajustar</button><button type="button" aria-pressed={mode==='ampliar'} className={mode==='ampliar'?'active':''} onClick={enterAmpliar}>Ampliar</button><span className="zoomControls"><button type="button" className="iconButton" aria-label="Reducir zoom" onClick={zoomOut} disabled={zoom<=1}>−</button><span aria-live="polite">{Math.round(zoom*100)}%</span><button type="button" className="iconButton" aria-label="Aumentar zoom" onClick={zoomIn} disabled={zoom>=3}>+</button></span><button type="button" className="iconButton" aria-label="Ver la página a pantalla completa" onClick={()=>setLightboxPage(currentPage)}>⤢</button></div></div><div className={`catalogReaderShell mode-${mode}${zoom>1?' is-zoomed':''}`}><div className="catalogScroll" ref={scrollRef} onPointerDown={handleViewerPointerDown} onPointerMove={handleViewerPointerMove} onPointerUp={handleViewerPointerEnd} onPointerCancel={handleViewerPointerEnd}><PageStage pageNumber={currentPage} zoom={zoom}>{pageHotspots.map((h)=>{const product=getProductById(h.productId); if(!product)return null; return <button key={h.id} className="hotspot" title={h.label} aria-label={`Ver producto ${product.code} - ${product.name}`} style={{left:`${h.x}%`,top:`${h.y}%`,width:`${h.width}%`,height:`${h.height}%`}} onClick={()=>openHotspotProduct(product)}><span aria-hidden="true">{product.code}</span></button>})}</PageStage></div><button className="pageNav prev" aria-label="Página anterior" disabled={currentPage<=1} onClick={()=>goToPage(currentPage-1)}>‹</button><button className="pageNav next" aria-label="Página siguiente" disabled={currentPage>=catalogPages.length} onClick={()=>goToPage(currentPage+1)}>›</button></div><div className="thumbsBar"><button type="button" className="thumbsToggle" aria-expanded={showThumbs} aria-label={showThumbs?'Ocultar miniaturas':'Mostrar miniaturas'} onClick={()=>setShowThumbs(s=>!s)}>{showThumbs?'▾':'▸'}</button>{showThumbs && <div className="pageStrip">{catalogPages.slice(Math.max(0,currentPage-5),Math.min(catalogPages.length,currentPage+5)).map(p=><button key={p.id} className={p.pageNumber===currentPage?'selectedThumb':''} onClick={()=>goToPage(p.pageNumber)}><span>{p.pageNumber}</span><small>{getPageTitle(p.pageNumber)}</small></button>)}</div>}</div></section>}
  {view==='products' && <section className="productsView"><h1>Productos</h1><div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por código, nombre, talle, color, marca..."/><select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}><option value="">Todas las marcas</option>{[...new Set(catalogProducts.map(p=>p.brand))].sort().map(brand=><option key={brand}>{brand}</option>)}</select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">Todas las categorías</option>{catalogCategories.map(c=><option key={c.id}>{c.name}</option>)}</select></div><p className="muted">{filteredProducts.length} productos encontrados</p><div className="productGrid">{filteredProducts.map((product)=><article className="productCard" key={product.id}><span className="tag">{product.brand}</span><h3>{product.name}</h3><p>Cód. {product.code} · Página {product.page}</p><p>{product.description}</p><p><b>Talles:</b> {getProductSizeOptions(product).join(', ')}</p><p><b>Colores:</b> {getProductColorOptions(product).join(', ')}</p><button onClick={()=>goToPage(product.page)}>Ver en revista</button><button onClick={()=>setSelectedProduct(product)}>Seleccionar</button></article>)}</div></section>}
  {view==='admin' && <section className="adminView"><h1>Panel administrador base</h1><div className="metricsGrid"><Metric label="Páginas" value={`${catalogPages.length}/218`}/><Metric label="Productos extraídos" value={String(catalogProducts.length)}/><Metric label="Marcas" value={String(new Set(catalogProducts.map(p=>p.brand)).size)}/><Metric label="Hotspots" value={String(catalogPages.reduce((t,p)=>t+getHotspotsByPage(p.pageNumber).length,0))}/></div><div className="adminCard"><h2>Estado</h2><p>Este proyecto muestra el catálogo con imágenes estáticas por página. Incluye extracción inicial de productos y hotspots aproximados. Para producción, conectar base de datos y editor visual de hotspots.</p><ul><li>Imágenes: <code>public/assets/catalogo/pages/page-XXX.jpg</code></li><li>PDF de respaldo: <code>public/assets/catalogo/pdf/inv-2026.pdf</code></li><li>Productos: <code>src/data/products.json</code></li><li>Hotspots: <code>src/data/hotspots.json</code></li></ul></div></section>}
  {view==='cart' && <section className="cartView"><h1>Carrito</h1>{cart.length===0?<p>El carrito está vacío.</p>:<><div className="cartItems">{cart.map((item)=><article key={item.id} className="cartItem"><div><strong>{item.code} - {item.name}</strong><p>{item.brand} · {item.category} · Página {item.page}</p><p>Talle: {item.selectedSize} · Color: {item.selectedColor}</p></div><CartQuantityInput quantity={item.quantity} ariaLabel={`Cantidad de ${item.code}`} onCommit={quantity=>setCart(current=>updateCartItemQuantity(current,item.id,quantity))}/><button type="button" onClick={()=>setCart(current=>current.filter(ci=>ci.id!==item.id))}>Eliminar</button></article>)}</div><p className="vendorInfo">Pedido para <strong>{ORDER_VENDOR.name}</strong> por WhatsApp</p><textarea readOnly value={whatsappMessage}/><div className="cartActions"><button type="button" className="whatsapp" onClick={sendOrderViaWhatsApp}>Enviar pedido por WhatsApp</button><button type="button" onClick={()=>setCart([])}>Vaciar carrito</button></div></>}</section>}
  {selectedProduct && <ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAdd={addToCart} onPage={()=>{ const page = selectedProduct.page; setSelectedProduct(null); goToPage(page); }}/>}
  {cartNotice && <CartAddedNotice productName={cartNotice.productName} onContinue={continueShopping} onOpenCart={openCartFromNotice}/>}
  {lightboxPage && <PageLightbox pageNumber={lightboxPage} onClose={()=>setLightboxPage(null)}/>}
  </main>;
}
function ProductModal({
  product,
  onClose,
  onAdd,
  onPage,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, s: string, c: string, q: number) => void;
  onPage: () => void;
}) {
  const sizeOptions = getProductSizeOptions(product);
  const colorOptions = getProductColorOptions(product);
  const [size, setSize] = useState(sizeOptions[0]);
  const [color, setColor] = useState(colorOptions[0]);
  const [quantityDraft, setQuantityDraft] = useState('1');
  const dialogRef = useOverlayAccessibility<HTMLElement>(onClose);
  const titleId = `product-modal-${product.id}-title`;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <article
        ref={dialogRef}
        className="productModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="productModalHeader">
          <div className="productModalHeading">
            <span className="tag">{product.brand} · {product.category}</span>
            <h2 id={titleId}>{product.code} - {product.name}</h2>
          </div>
          <button type="button" className="close" aria-label="Cerrar producto" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="productModalBody">
          <p>{product.description}</p>
          <p className="muted">Página {product.page}</p>
          <label>
            Talle
            <select value={size} onChange={(e) => setSize(e.target.value)}>
              {sizeOptions.map((s, index) => (
                <option key={`${product.id}-size-${index}`}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Color
            <select value={color} onChange={(e) => setColor(e.target.value)}>
              {colorOptions.map((c, index) => (
                <option key={`${product.id}-color-${index}`}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Cantidad
            <EditableQuantityInput value={quantityDraft} onChange={setQuantityDraft} />
          </label>
        </div>
        <footer className="productModalFooter">
          <button
            type="button"
            className="primary"
            onClick={() => onAdd(product, size, color, normalizeQuantity(quantityDraft))}
          >
            Agregar al carrito
          </button>
          <button type="button" onClick={onPage}>
            Ver página del catálogo
          </button>
          <button type="button" onClick={onClose}>
            Salir
          </button>
        </footer>
      </article>
    </div>
  );
}

function CartAddedNotice({
  productName,
  onContinue,
  onOpenCart,
}: {
  productName: string;
  onContinue: () => void;
  onOpenCart: () => void;
}) {
  const dialogRef = useOverlayAccessibility<HTMLElement>(onContinue);
  const titleId = 'cart-added-title';

  return (
    <div className="modalOverlay" onClick={onContinue}>
      <article
        ref={dialogRef}
        className="cartNotice"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId}>Producto agregado al carrito</h2>
        <p className="muted">{productName}</p>
        <div className="cartNoticeActions">
          <button type="button" className="primary" onClick={onContinue}>
            Seguir viendo
          </button>
          <button type="button" onClick={onOpenCart}>
            Ver carrito
          </button>
        </div>
      </article>
    </div>
  );
}

function PageLightbox({ pageNumber, onClose }: { pageNumber: number; onClose: () => void }) {
  const [zoom, setZoom] = useState(1);
  const [canMousePan, setCanMousePan] = useState(false);
  const [isMouseDragging, setIsMouseDragging] = useState(false);
  const dialogRef = useOverlayAccessibility<HTMLDivElement>(onClose);
  const imageWrapperRef = useRef<HTMLDivElement | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const mouseDragRef = useRef({
    pointerId: null as number | null,
    startX: 0,
    startY: 0,
    startScrollLeft: 0,
    startScrollTop: 0,
    moved: false,
  });
  const zoomOut = () => setZoom((value) => Math.max(MIN_ZOOM, value - 0.25));
  const zoomIn = () => setZoom((value) => Math.min(MAX_ZOOM, value + 0.25));

  useLayoutEffect(() => {
    const wrapper = imageWrapperRef.current;
    if (!wrapper) return;

    const updateCanMousePan = () => {
      setCanMousePan(
        wrapper.scrollWidth > wrapper.clientWidth + 1 ||
        wrapper.scrollHeight > wrapper.clientHeight + 1,
      );
    };
    const observer = new ResizeObserver(updateCanMousePan);
    const stage = wrapper.querySelector('.catalogPageStage');

    updateCanMousePan();
    observer.observe(wrapper);
    if (stage) observer.observe(stage);
    window.addEventListener('resize', updateCanMousePan);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateCanMousePan);
    };
  }, [zoom]);

  useEffect(() => () => {
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
  }, []);

  function finishMouseDrag(wrapper: HTMLDivElement, pointerId: number, cancelled = false) {
    const drag = mouseDragRef.current;
    if (drag.pointerId !== pointerId) return;

    const suppressClick = drag.moved && !cancelled;
    drag.pointerId = null;
    drag.moved = false;
    setIsMouseDragging(false);
    if (wrapper.hasPointerCapture(pointerId)) wrapper.releasePointerCapture(pointerId);

    suppressClickRef.current = suppressClick;
    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
    }
    if (suppressClick) {
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, 0);
    }
  }

  function handleMousePanStart(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;

    const wrapper = event.currentTarget;
    const target = event.target instanceof Element ? event.target : null;
    const stage = target?.closest('.catalogPageStage');
    const hasOverflow =
      wrapper.scrollWidth > wrapper.clientWidth + 1 ||
      wrapper.scrollHeight > wrapper.clientHeight + 1;
    const rect = wrapper.getBoundingClientRect();
    const isOverScrollbar =
      event.clientX >= rect.left + wrapper.clientWidth ||
      event.clientY >= rect.top + wrapper.clientHeight;
    if (!stage || !wrapper.contains(stage) || !hasOverflow || isOverScrollbar) return;

    if (suppressClickTimerRef.current !== null) {
      window.clearTimeout(suppressClickTimerRef.current);
      suppressClickTimerRef.current = null;
    }
    suppressClickRef.current = false;
    mouseDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollLeft: wrapper.scrollLeft,
      startScrollTop: wrapper.scrollTop,
      moved: false,
    };
    wrapper.setPointerCapture(event.pointerId);
    setIsMouseDragging(true);
    event.preventDefault();
  }

  function handleMousePanMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = mouseDragRef.current;
    if (event.pointerType !== 'mouse' || drag.pointerId !== event.pointerId) return;
    if ((event.buttons & 1) === 0) {
      finishMouseDrag(event.currentTarget, event.pointerId, true);
      return;
    }

    const deltaX = event.clientX - drag.startX;
    const deltaY = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;

    drag.moved = true;
    event.currentTarget.scrollLeft = drag.startScrollLeft - deltaX;
    event.currentTarget.scrollTop = drag.startScrollTop - deltaY;
    event.preventDefault();
  }

  function handleMousePanEnd(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'mouse') return;
    finishMouseDrag(event.currentTarget, event.pointerId);
  }

  function handleLostMouseCapture(event: ReactPointerEvent<HTMLDivElement>) {
    if (mouseDragRef.current.pointerId !== event.pointerId) return;
    mouseDragRef.current.pointerId = null;
    mouseDragRef.current.moved = false;
    suppressClickRef.current = false;
    setIsMouseDragging(false);
  }

  return (
    <div
      ref={dialogRef}
      className={`lightboxOverlay${isMouseDragging ? ' isMouseDragging' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={`Página ${pageNumber} ampliada`}
      tabIndex={-1}
      onClick={onClose}
    >
      <button
        type="button"
        className="lightboxClose"
        aria-label="Cerrar pantalla completa"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>
      <div
        className="lightboxToolbar"
        role="group"
        aria-label="Controles de la página ampliada"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Reducir zoom de pantalla completa"
          disabled={zoom <= MIN_ZOOM}
          onClick={zoomOut}
        >
          −
        </button>
        <output className="lightboxZoomValue" aria-label="Zoom actual" aria-live="polite">
          {Math.round(zoom * 100)}%
        </output>
        <button
          type="button"
          aria-label="Aumentar zoom de pantalla completa"
          disabled={zoom >= MAX_ZOOM}
          onClick={zoomIn}
        >
          +
        </button>
        <button type="button" className="lightboxFitButton" onClick={() => setZoom(MIN_ZOOM)}>
          Ajustar
        </button>
        <button type="button" onClick={onClose}>
          Salir
        </button>
      </div>
      <div
        ref={imageWrapperRef}
        className={`lightboxImageWrapper${canMousePan ? ' canMousePan' : ''}`}
        onPointerDown={handleMousePanStart}
        onPointerMove={handleMousePanMove}
        onPointerUp={handleMousePanEnd}
        onPointerCancel={(event) => {
          if (event.pointerType === 'mouse') finishMouseDrag(event.currentTarget, event.pointerId, true);
        }}
        onLostPointerCapture={handleLostMouseCapture}
        onDragStart={(event) => event.preventDefault()}
        onClick={(event) => {
          event.stopPropagation();
          if (!suppressClickRef.current) return;
          event.preventDefault();
          suppressClickRef.current = false;
        }}
      >
        <PageStage pageNumber={pageNumber} zoom={zoom} />
      </div>
    </div>
  );
}
function Metric({label,value}:{label:string;value:string}){return <article className="metric"><strong>{value}</strong><span>{label}</span></article>}
