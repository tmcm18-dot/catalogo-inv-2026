"use client";
import { useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, Product } from '@/types';
import { catalogBrands, catalogCategories, catalogPages, catalogProducts, getHotspotsByPage, getProductById, normalizeText } from '@/lib/catalog';
import { addOrMergeCartItem, createCartItem, createWhatsAppUrl, generateWhatsAppMessage, getCartCount } from '@/lib/cart';

type View = 'catalog' | 'products' | 'cart' | 'admin';
const PDF_URL = '/assets/catalogo/pdf/inv-2026.pdf';

function PdfCanvas({ pageNumber, scale = 1, className = '' }: { pageNumber: number; scale?: number; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function render() {
      setLoading(true);
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument(PDF_URL).promise;
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas || cancelled) return;
      const context = canvas.getContext('2d');
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
      if (!cancelled) setLoading(false);
    }
    render().catch(() => setLoading(false));
    return () => { cancelled = true; };
  }, [pageNumber, scale]);
  return <>{loading && <div className="canvasLoading">Cargando página...</div>}<canvas ref={canvasRef} className={`pdfCanvas ${className}`} /> </>;
}

export default function CatalogApp() {
  const [view, setView] = useState<View>('catalog');
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(1.05);
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lightboxPage, setLightboxPage] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [phone, setPhone] = useState('5493870000000');
  const touchStartX = useRef<number | null>(null);
  useEffect(() => { const saved = localStorage.getItem('inv2026-cart'); if (saved) setCart(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('inv2026-cart', JSON.stringify(cart)); }, [cart]);

  const page = catalogPages[currentPage - 1];
  const pageProducts = catalogProducts.filter((p) => p.page === currentPage);
  const pageHotspots = getHotspotsByPage(currentPage);
  const filteredProducts = useMemo(() => {
    const q = normalizeText(query.trim());
    return catalogProducts.filter((product) => {
      const searchable = normalizeText(`${product.code} ${product.name} ${product.description} ${product.brand} ${product.category} ${product.sizes.join(' ')} ${product.colors.join(' ')} ${product.page}`);
      return (!q || searchable.includes(q)) && (!brandFilter || product.brand === brandFilter) && (!categoryFilter || product.category === categoryFilter);
    });
  }, [query, brandFilter, categoryFilter]);
  function goToPage(n: number) { const next = Math.min(Math.max(n, 1), catalogPages.length); setCurrentPage(next); setView('catalog'); }
  function onTouchEnd(x: number) { if (touchStartX.current === null) return; const d = x - touchStartX.current; if (Math.abs(d) > 50) { if (d < 0) goToPage(currentPage + 1); if (d > 0) goToPage(currentPage - 1); } touchStartX.current = null; }
  function addToCart(product: Product, size: string, color: string, quantity: number) { setCart((c) => addOrMergeCartItem(c, createCartItem(product, size, color, quantity))); setSelectedProduct(null); setView('cart'); }
  const whatsappMessage = generateWhatsAppMessage(cart);
  const whatsappUrl = createWhatsAppUrl(phone, whatsappMessage);

  return <main className="appShell"><header className="topbar"><div><strong>Catálogo INV 2026</strong><small>PDF real · 218 páginas · {catalogProducts.length} productos · {catalogBrands.length} marcas</small></div><nav><button className={view==='catalog'?'active':''} onClick={()=>setView('catalog')}>Revista</button><button className={view==='products'?'active':''} onClick={()=>setView('products')}>Productos</button><button className={view==='admin'?'active':''} onClick={()=>setView('admin')}>Admin</button><button className="cartButton" onClick={()=>setView('cart')}>Carrito ({getCartCount(cart)})</button></nav></header>
  {view==='catalog' && <section className="catalogView"><div className="viewerHeader"><div><h1>Página {currentPage} de {catalogPages.length}</h1><p>{page?.title} · {pageProducts.length} productos clickeables</p></div><div className="viewerTools"><button onClick={()=>setZoom(z=>Math.max(.7,z-.15))}>−</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.min(2.2,z+.15))}>+</button><button onClick={()=>setLightboxPage(currentPage)}>Ampliar</button></div></div><div className="magazineLayout"><button className="pageNav" disabled={currentPage<=1} onClick={()=>goToPage(currentPage-1)}>‹</button><div className="pageStage" onPointerDown={(e)=>{touchStartX.current=e.clientX}} onPointerUp={(e)=>onTouchEnd(e.clientX)}><div className="pageCanvas"><PdfCanvas pageNumber={currentPage} scale={zoom}/>{pageHotspots.map((h,index)=>{const product=getProductById(h.productId); if(!product)return null; return <button key={h.id + "-" + index} className="hotspot" title={h.label} style={{left:`${h.x}%`,top:`${h.y}%`,width:`${h.width}%`,height:`${h.height}%`}} onClick={()=>setSelectedProduct(product)}><span>{product.code}</span></button>})}</div></div><button className="pageNav" disabled={currentPage>=catalogPages.length} onClick={()=>goToPage(currentPage+1)}>›</button></div><div className="pageStrip">{catalogPages.slice(Math.max(0,currentPage-5),Math.min(catalogPages.length,currentPage+5)).map(p=><button key={p.id} className={p.pageNumber===currentPage?'selectedThumb':''} onClick={()=>goToPage(p.pageNumber)}><span>{p.pageNumber}</span><small>{p.brand}</small></button>)}</div></section>}
  {view==='products' && <section className="productsView"><h1>Productos</h1><div className="filters"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar por código, nombre, talle, color, marca..."/><select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)}><option value="">Todas las marcas</option>{[...new Set(catalogProducts.map(p=>p.brand))].sort().map(brand=><option key={brand}>{brand}</option>)}</select><select value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}><option value="">Todas las categorías</option>{catalogCategories.map(c=><option key={c.id}>{c.name}</option>)}</select></div><p className="muted">{filteredProducts.length} productos encontrados</p><div className="productGrid">{filteredProducts.map((product,index)=><article className="productCard" key={product.id + "-" + product.page + "-" + index}><span className="tag">{product.brand}</span><h3>{product.name}</h3><p>Cód. {product.code} · Página {product.page}</p><p>{product.description}</p><p><b>Talles:</b> {product.sizes.join(', ')}</p><p><b>Colores:</b> {product.colors.join(', ')}</p><button onClick={()=>goToPage(product.page)}>Ver en revista</button><button onClick={()=>setSelectedProduct(product)}>Seleccionar</button></article>)}</div></section>}
  {view==='admin' && <section className="adminView"><h1>Panel administrador base</h1><div className="metricsGrid"><Metric label="Páginas PDF" value={`${catalogPages.length}/218`}/><Metric label="Productos extraídos" value={String(catalogProducts.length)}/><Metric label="Marcas" value={String(new Set(catalogProducts.map(p=>p.brand)).size)}/><Metric label="Hotspots" value={String(catalogPages.reduce((t,p)=>t+getHotspotsByPage(p.pageNumber).length,0))}/></div><div className="adminCard"><h2>Estado</h2><p>Este proyecto renderiza el PDF completo en el navegador con PDF.js. Incluye extracción inicial de productos y hotspots aproximados. Para producción, conectar base de datos y editor visual de hotspots.</p><ul><li>PDF real: <code>public/assets/catalogo/pdf/inv-2026.pdf</code></li><li>Productos: <code>src/data/products.json</code></li><li>Hotspots: <code>src/data/hotspots.json</code></li></ul></div></section>}
  {view==='cart' && <section className="cartView"><h1>Carrito</h1>{cart.length===0?<p>El carrito está vacío.</p>:<><div className="cartItems">{cart.map((item,index)=><article key={item.id + "-" + index} className="cartItem"><div><strong>{item.code} - {item.name}</strong><p>{item.brand} · {item.category} · Página {item.page}</p><p>Talle: {item.selectedSize} · Color: {item.selectedColor}</p></div><input type="number" min="1" value={item.quantity} onChange={e=>setCart(current=>current.map(ci=>ci.id===item.id?{...ci,quantity:Math.max(1,Number(e.target.value))}:ci))}/><button onClick={()=>setCart(current=>current.filter(ci=>ci.id!==item.id))}>Eliminar</button></article>)}</div><label className="phoneField">Número WhatsApp destino<input value={phone} onChange={e=>setPhone(e.target.value)}/></label><textarea readOnly value={whatsappMessage}/><div className="cartActions"><a className="whatsapp" href={whatsappUrl} target="_blank">Enviar pedido por WhatsApp</a><button onClick={()=>setCart([])}>Vaciar carrito</button></div></>}</section>}
  {selectedProduct && <ProductModal product={selectedProduct} onClose={()=>setSelectedProduct(null)} onAdd={addToCart} onPage={()=>goToPage(selectedProduct.page)}/>} {lightboxPage && <PdfLightbox pageNumber={lightboxPage} onClose={()=>setLightboxPage(null)}/>}</main>;
}
function ProductModal({product,onClose,onAdd,onPage}:{product:Product;onClose:()=>void;onAdd:(p:Product,s:string,c:string,q:number)=>void;onPage:()=>void}){const [size,setSize]=useState(product.sizes[0]??'Único'); const [color,setColor]=useState(product.colors[0]??'No especificado'); const [quantity,setQuantity]=useState(1); return <div className="modalOverlay" onClick={onClose}><article className="productModal" onClick={e=>e.stopPropagation()}><button className="close" onClick={onClose}>×</button><div><span className="tag">{product.brand} · {product.category}</span><h2>{product.code} - {product.name}</h2><p>{product.description}</p><p className="muted">Página {product.page}</p><label>Talle<select value={size} onChange={e=>setSize(e.target.value)}>{product.sizes.map((s,index)=><option key={s + "-" + index}>{s}</option>)}</select></label><label>Color<select value={color} onChange={e=>setColor(e.target.value)}>{product.colors.map((c,index)=><option key={c + "-" + index}>{c}</option>)}</select></label><label>Cantidad<input type="number" min="1" value={quantity} onChange={e=>setQuantity(Math.max(1,Number(e.target.value)))}/></label><button className="primary" onClick={()=>onAdd(product,size,color,quantity)}>Agregar al carrito</button><button onClick={onPage}>Ver página del catálogo</button></div></article></div>}
function PdfLightbox({pageNumber,onClose}:{pageNumber:number;onClose:()=>void}){const [zoom,setZoom]=useState(1.45); useEffect(()=>{document.body.style.overflow='hidden'; const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose()}; document.addEventListener('keydown',close); return()=>{document.body.style.overflow=''; document.removeEventListener('keydown',close)}},[onClose]); return <div className="lightboxOverlay" onClick={onClose}><button className="lightboxClose">×</button><div className="lightboxToolbar" onClick={e=>e.stopPropagation()}><button onClick={()=>setZoom(z=>Math.max(.75,z-.25))}>−</button><button onClick={()=>setZoom(1.2)}>100%</button><button onClick={()=>setZoom(z=>Math.min(3,z+.25))}>+</button></div><div className="lightboxImageWrapper" onClick={e=>e.stopPropagation()}><PdfCanvas pageNumber={pageNumber} scale={zoom}/></div></div>}
function Metric({label,value}:{label:string;value:string}){return <article className="metric"><strong>{value}</strong><span>{label}</span></article>}
