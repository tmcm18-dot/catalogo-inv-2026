"use client";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type SyntheticEvent } from 'react';
import type { CartItem, Product } from '@/types';
import { cachePageImageDimensions, catalogBrands, catalogCategories, catalogPages, catalogProducts, getAdjacentPagesToPreload, getCachedPageImageHeight, getCachedPageImageWidth, getHotspotsByPage, getPageImage, getPageTitle, getProductById, isPageImageCached, normalizeText, preloadPageImage } from '@/lib/catalog';
import { addOrMergeCartItem, buildOrderWhatsAppUrl, createCartItem, generateWhatsAppMessage, getCartCount, ORDER_VENDOR } from '@/lib/cart';

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

const DEFAULT_PAGE_RATIO = 0.5625; // ancho/alto de respaldo hasta conocer la proporción real

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

function PageImage({ pageNumber, zoom = 1, className = '' }: { pageNumber: number; zoom?: number; className?: string }) {
  const [displayPage, setDisplayPage] = useState(pageNumber);
  const [loading, setLoading] = useState(!isPageImageCached(pageNumber));

  useEffect(() => {
    let cancelled = false;

    const showPage = (page: number) => {
      setDisplayPage(page);
      setLoading(false);
    };

    if (isPageImageCached(pageNumber)) {
      showPage(pageNumber);
      return;
    }

    setLoading(true);
    preloadPageImage(pageNumber).then(() => {
      if (cancelled) return;
      showPage(pageNumber);
    });

    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  return (
    <>
      {loading && <div className="canvasLoading">Cargando página...</div>}
      <img
        src={getPageImage(displayPage)}
        alt={`Página ${displayPage} del catálogo INV 2026`}
        className={`pageImage ${className}`}
        style={{ width: `${zoom * 100}%` }}
      />
    </>
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
  const [cartNotice, setCartNotice] = useState<CartNotice | null>(null);
  const touchStartX = useRef<number | null>(null);
  useEffect(() => { const saved = localStorage.getItem('inv2026-cart'); if (saved) setCart(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('inv2026-cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => {
    preloadPageImage(currentPage);
    getAdjacentPagesToPreload(currentPage).forEach((page) => preloadPageImage(page));
  }, [currentPage]);
  // En celular el modo inicial es "ajustar": un piso de 430px en pantallas
  // angostas generaría scroll horizontal permanente. Se sincroniza el estado
  // (no sólo el CSS) y sin desajuste de hidratación: el primer render en
  // cliente coincide con el del servidor ('lectura') y luego el efecto ajusta.
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches) {
      setMode('ajustar');
    }
  }, []);

  const pageProducts = catalogProducts.filter((p) => p.page === currentPage);
  const pageHotspots = getHotspotsByPage(currentPage);
  const pageTitle = getPageTitle(currentPage);
  const filteredProducts = useMemo(() => {
    const q = normalizeText(query.trim());
    return catalogProducts.filter((product) => {
      const searchable = normalizeText(`${product.code} ${product.name} ${product.description} ${product.brand} ${product.category} ${product.sizes.join(' ')} ${product.colors.join(' ')} ${product.page}`);
      return (!q || searchable.includes(q)) && (!brandFilter || product.brand === brandFilter) && (!categoryFilter || product.category === categoryFilter);
    });
  }, [query, brandFilter, categoryFilter]);

  function goToPage(n: number) { const next = Math.min(Math.max(n, 1), catalogPages.length); setCurrentPage(next); setView('catalog'); }
  function selectMode(next: Mode) { setMode(next); if (next !== 'ampliar') setZoom(1); }
  function enterAmpliar() { setMode('ampliar'); setZoom((z) => (z <= 1 ? 1.25 : z)); }
  function zoomIn() { setMode('ampliar'); setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100)); }
  function zoomOut() { setZoom((z) => { const next = Math.max(1, Math.round((z - 0.25) * 100) / 100); if (next <= 1) setMode((m) => (m === 'ampliar' ? 'lectura' : m)); return next; }); }
  function onTouchEnd(x: number) { if (touchStartX.current === null) return; const d = x - touchStartX.current; if (Math.abs(d) > 50) { if (d < 0) goToPage(currentPage + 1); if (d > 0) goToPage(currentPage - 1); } touchStartX.current = null; }
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
    localStorage.removeItem('inv2026-cart');
    setCurrentPage(1);
    setView('catalog');
    setCartNotice(null);
  }
  const whatsappMessage = generateWhatsAppMessage(cart);

  return <main className="appShell"><header className="topbar"><div className="brand"><strong>Catálogo INV 2026</strong><small className="topbarMeta">218 páginas · {catalogProducts.length} productos · {catalogBrands.length} marcas</small></div><nav><button className={view==='catalog'?'active':''} onClick={()=>setView('catalog')}>Revista</button><button className={view==='products'?'active':''} onClick={()=>setView('products')}>Productos</button><button className="cartButton" onClick={()=>setView('cart')}>Carrito ({getCartCount(cart)})</button><details className="menu"><summary aria-label="Más opciones" title="Más opciones">☰</summary><div className="menuPanel"><button className={view==='admin'?'active':''} onClick={()=>setView('admin')}>Admin</button></div></details></nav></header>
  {view==='catalog' && <section className="catalogView"><div className="viewerHeader"><div className="viewerInfo"><h1>Página {currentPage} de {catalogPages.length}</h1><p className="viewerMeta">{pageTitle} · {pageProducts.length} productos clickeables</p></div><div className="viewerTools" role="group" aria-label="Modo de visualización de la revista"><button type="button" aria-pressed={mode==='lectura'} className={mode==='lectura'?'active':''} onClick={()=>selectMode('lectura')}>Lectura</button><button type="button" aria-pressed={mode==='ajustar'} className={mode==='ajustar'?'active':''} onClick={()=>selectMode('ajustar')}>Ajustar</button><button type="button" aria-pressed={mode==='ampliar'} className={mode==='ampliar'?'active':''} onClick={enterAmpliar}>Ampliar</button><span className="zoomControls"><button type="button" className="iconButton" aria-label="Reducir zoom" onClick={zoomOut} disabled={zoom<=1}>−</button><span aria-live="polite">{Math.round(zoom*100)}%</span><button type="button" className="iconButton" aria-label="Aumentar zoom" onClick={zoomIn} disabled={zoom>=3}>+</button></span><button type="button" className="iconButton" aria-label="Ver la página a pantalla completa" onClick={()=>setLightboxPage(currentPage)}>⤢</button></div></div><div className={`catalogReaderShell mode-${mode}`} onPointerDown={(e)=>{touchStartX.current=e.clientX}} onPointerUp={(e)=>onTouchEnd(e.clientX)}><div className="catalogScroll"><PageStage pageNumber={currentPage} zoom={zoom}>{pageHotspots.map((h)=>{const product=getProductById(h.productId); if(!product)return null; return <button key={h.id} className="hotspot" title={h.label} aria-label={`Ver producto ${product.code} - ${product.name}`} style={{left:`${h.x}%`,top:`${h.y}%`,width:`${h.width}%`,height:`${h.height}%`}} onClick={()=>setSelectedProduct(product)}><span>{product.code}</span></button>})}</PageStage></div><button className="pageNav prev" aria-label="Página anterior" disabled={currentPage<=1} onClick={()=>goToPage(currentPage-1)}>‹</button><button className="pageNav next" aria-label="Página siguiente" disabled={currentPage>=catalogPages.length} onClick={()=>goToPage(currentPage+1)}>›</button></div><div className="thumbsBar"><button type="button" className="thumbsToggle" aria-expanded={showThumbs} aria-label={showThumbs?'Ocultar miniaturas':'Mostrar miniaturas'} onClick={()=>setShowThumbs(s=>!s)}>{showThumbs?'▾':'▸'}</button>{showThumbs && <div className="pageStrip">{catalogPages.slice(Math.max(0,currentPage-5),Math.min(catalogPages.length,currentPage+5)).map(p=><button key={p.id} className={p.pageNumber===currentPage?'selectedThumb':''} onClick={()=>goToPage(p.pageNumber)}><span>{p.pageNumber}</span><small>{getPageTitle(p.pageNumber)}</small></button>)}</div>}</div></section>}
  {view==='products' && <section className="productsView"><h1>Productos</h1><div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por código, nombre, talle, color, marca..."/><select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}><option value="">Todas las marcas</option>{[...new Set(catalogProducts.map(p=>p.brand))].sort().map(brand=><option key={brand}>{brand}</option>)}</select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">Todas las categorías</option>{catalogCategories.map(c=><option key={c.id}>{c.name}</option>)}</select></div><p className="muted">{filteredProducts.length} productos encontrados</p><div className="productGrid">{filteredProducts.map((product)=><article className="productCard" key={product.id}><span className="tag">{product.brand}</span><h3>{product.name}</h3><p>Cód. {product.code} · Página {product.page}</p><p>{product.description}</p><p><b>Talles:</b> {product.sizes.join(', ')}</p><p><b>Colores:</b> {product.colors.join(', ')}</p><button onClick={()=>goToPage(product.page)}>Ver en revista</button><button onClick={()=>setSelectedProduct(product)}>Seleccionar</button></article>)}</div></section>}
  {view==='admin' && <section className="adminView"><h1>Panel administrador base</h1><div className="metricsGrid"><Metric label="Páginas" value={`${catalogPages.length}/218`}/><Metric label="Productos extraídos" value={String(catalogProducts.length)}/><Metric label="Marcas" value={String(new Set(catalogProducts.map(p=>p.brand)).size)}/><Metric label="Hotspots" value={String(catalogPages.reduce((t,p)=>t+getHotspotsByPage(p.pageNumber).length,0))}/></div><div className="adminCard"><h2>Estado</h2><p>Este proyecto muestra el catálogo con imágenes estáticas por página. Incluye extracción inicial de productos y hotspots aproximados. Para producción, conectar base de datos y editor visual de hotspots.</p><ul><li>Imágenes: <code>public/assets/catalogo/pages/page-XXX.jpg</code></li><li>PDF de respaldo: <code>public/assets/catalogo/pdf/inv-2026.pdf</code></li><li>Productos: <code>src/data/products.json</code></li><li>Hotspots: <code>src/data/hotspots.json</code></li></ul></div></section>}
  {view==='cart' && <section className="cartView"><h1>Carrito</h1>{cart.length===0?<p>El carrito está vacío.</p>:<><div className="cartItems">{cart.map((item)=><article key={item.id} className="cartItem"><div><strong>{item.code} - {item.name}</strong><p>{item.brand} · {item.category} · Página {item.page}</p><p>Talle: {item.selectedSize} · Color: {item.selectedColor}</p></div><input type="number" min="1" value={item.quantity} onChange={e=>setCart(current=>current.map(ci=>ci.id===item.id?{...ci,quantity:Math.max(1,Number(e.target.value))}:ci))}/><button onClick={()=>setCart(current=>current.filter(ci=>ci.id!==item.id))}>Eliminar</button></article>)}</div><p className="vendorInfo">Pedido para <strong>{ORDER_VENDOR.name}</strong> por WhatsApp</p><textarea readOnly value={whatsappMessage}/><div className="cartActions"><button type="button" className="whatsapp" onClick={sendOrderViaWhatsApp}>Enviar pedido por WhatsApp</button><button type="button" onClick={()=>setCart([])}>Vaciar carrito</button></div></>}</section>}
  {selectedProduct && <ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAdd={addToCart} onPage={()=>goToPage(selectedProduct.page)}/>}
  {cartNotice && <CartAddedNotice productName={cartNotice.productName} onContinue={continueShopping} onOpenCart={openCartFromNotice}/>}
  {lightboxPage && <PageLightbox pageNumber={lightboxPage} onClose={()=>setLightboxPage(null)}/>}
  </main>;
}
function ProductModal({product,onClose,onAdd,onPage}:{product:Product;onClose:()=>void;onAdd:(p:Product,s:string,c:string,q:number)=>void;onPage:()=>void}){const [size,setSize]=useState(product.sizes[0]??'Único'); const [color,setColor]=useState(product.colors[0]??'No especificado'); const [quantity,setQuantity]=useState(1); return <div className="modalOverlay" onClick={onClose}><article className="productModal" onClick={e=>e.stopPropagation()}><button className="close" onClick={onClose}>×</button><div><span className="tag">{product.brand} · {product.category}</span><h2>{product.code} - {product.name}</h2><p>{product.description}</p><p className="muted">Página {product.page}</p><label>Talle<select value={size} onChange={e=>setSize(e.target.value)}>{product.sizes.map((s,index)=><option key={`${product.id}-size-${index}`}>{s}</option>)}</select></label><label>Color<select value={color} onChange={e=>setColor(e.target.value)}>{product.colors.map((c,index)=><option key={`${product.id}-color-${index}`}>{c}</option>)}</select></label><label>Cantidad<input type="number" min="1" value={quantity} onChange={e=>setQuantity(Math.max(1,Number(e.target.value)))}/></label><button className="primary" onClick={()=>onAdd(product,size,color,quantity)}>Agregar al carrito</button><button onClick={onPage}>Ver página del catálogo</button></div></article></div>}
function CartAddedNotice({productName,onContinue,onOpenCart}:{productName:string;onContinue:()=>void;onOpenCart:()=>void}){return <div className="modalOverlay" onClick={onContinue}><article className="cartNotice" onClick={e=>e.stopPropagation()}><h2>Producto agregado al carrito</h2><p className="muted">{productName}</p><div className="cartNoticeActions"><button type="button" className="primary" onClick={onContinue}>Seguir viendo</button><button type="button" onClick={onOpenCart}>Ver carrito</button></div></article></div>}
function PageLightbox({pageNumber,onClose}:{pageNumber:number;onClose:()=>void}){const [zoom,setZoom]=useState(1); useEffect(()=>{document.body.style.overflow='hidden'; const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}; document.addEventListener('keydown',close); return()=>{document.body.style.overflow=''; document.removeEventListener('keydown',close)}},[onClose]); return <div className="lightboxOverlay" onClick={onClose}><button className="lightboxClose">×</button><div className="lightboxToolbar" onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>setZoom(z=>Math.max(.75,z-.25))}>−</button><button type="button" onClick={()=>setZoom(1)}>Ajustar</button><button type="button" onClick={()=>setZoom(z=>Math.min(3,z+.25))}>+</button></div><div className="lightboxImageWrapper" onClick={e=>e.stopPropagation()}><PageImage pageNumber={pageNumber} zoom={zoom}/></div></div>}
function Metric({label,value}:{label:string;value:string}){return <article className="metric"><strong>{value}</strong><span>{label}</span></article>}
