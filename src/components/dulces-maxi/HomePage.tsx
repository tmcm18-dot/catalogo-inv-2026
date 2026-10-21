'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import {
  CakeSlice,
  Gift,
  Leaf,
  MessageCircle,
  PackageCheck,
  Search,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import ProductCard from './ProductCard';
import {
  CATALOG_FILTERS,
  DM_BASE,
  WHATSAPP_URL,
  filterProducts,
  isValidFilter,
  listProducts,
  pickHeroFeatured,
  pickHeroStrawberry,
  productHref,
  type CatalogFilterKey,
} from '@/lib/dulces-maxi/products';

const CATEGORY_TILES: { key: CatalogFilterKey; title: string; copy: string; icon: LucideIcon }[] = [
  { key: 'mermelada', title: 'Mermeladas', copy: 'Fruta, color y textura', icon: Leaf },
  { key: 'dulce_regional', title: 'Dulces regionales', copy: 'Sabores de nuestra tierra', icon: Sparkles },
  { key: 'pasteleria', title: 'Pastelería', copy: 'Elaborada solo por encargo', icon: CakeSlice },
  { key: 'combo', title: 'Combos y regalos', copy: 'Listos para compartir', icon: Gift },
];

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: Leaf, title: 'Elaboración artesanal', description: 'Lotes pequeños y sabores protagonistas.' },
  { icon: PackageCheck, title: 'Stock actualizado', description: 'Disponibilidad visible antes de pedir.' },
  { icon: MessageCircle, title: 'Atención directa', description: 'Coordinación personal por WhatsApp.' },
];

export default function HomePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('categoria');
  const query = (searchParams.get('q') || '').trim().toLowerCase();
  const filter: CatalogFilterKey = isValidFilter(categoryParam) ? categoryParam : 'all';

  const products = useMemo(() => listProducts(), []);
  const visible = useMemo(() => filterProducts(products, filter, query), [products, filter, query]);
  const favorites = useMemo(() => products.filter((product) => product.featured).slice(0, 3), [products]);
  const heroStrawberry = useMemo(() => pickHeroStrawberry(products), [products]);
  const heroFeatured = useMemo(() => pickHeroFeatured(products, heroStrawberry), [products, heroStrawberry]);

  const selectFilter = (key: CatalogFilterKey) => {
    const params = new URLSearchParams();
    if (key !== 'all') params.set('categoria', key);
    if (query) params.set('q', query);
    const search = params.toString();
    router.replace(`${DM_BASE}${search ? `?${search}` : ''}#productos`, { scroll: false });
    document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <section className="dm-hero">
        <div className="dm-hero__grid">
          <div>
            <div className="dm-pill">
              <Sparkles size={16} /> Elaboración artesanal en Salta
            </div>
            <h1 className="dm-hero__title">Sabores artesanales que te alegran el día</h1>
            <p className="dm-hero__lead">
              Descubrí nuestras mermeladas, dulces y pastelería por encargo, elaborados para disfrutar y
              compartir.
            </p>
            <div className="dm-hero__actions">
              <button type="button" onClick={() => selectFilter('all')} className="dm-btn dm-btn--primary">
                Ver productos
              </button>
              <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="dm-btn dm-btn--outline">
                <MessageCircle size={20} /> Pedir por WhatsApp
              </a>
            </div>
            <p className="dm-hero__note">Productos y precios de demostración para el entorno de prueba.</p>
          </div>
          <div className="dm-hero__visual">
            <div className="dm-hero__blob dm-hero__blob--orange" />
            <div className="dm-hero__blob dm-hero__blob--pink" />
            <div className="dm-hero__cards">
              {heroStrawberry ? (
                <Link
                  href={productHref(heroStrawberry.id)}
                  aria-label={`Ver ${heroStrawberry.name}`}
                  className="dm-hero__card dm-hero__card--offset"
                >
                  <Image
                    src={heroStrawberry.image_url}
                    alt={heroStrawberry.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 256px, 45vw"
                  />
                  <span className="dm-hero__caption">Mermelada de frutilla</span>
                </Link>
              ) : (
                <div className="dm-hero__placeholder dm-hero__card--offset" aria-hidden="true">
                  <Leaf size={36} color="rgba(197,29,93,.5)" />
                </div>
              )}
              {heroFeatured ? (
                <Link
                  href={productHref(heroFeatured.id)}
                  aria-label={`Ver producto destacado: ${heroFeatured.name}`}
                  className="dm-hero__card"
                >
                  <Image
                    src={heroFeatured.image_url}
                    alt={heroFeatured.name}
                    fill
                    priority
                    sizes="(min-width: 1024px) 256px, 45vw"
                  />
                  <span className="dm-hero__tag">Producto destacado</span>
                  <span className="dm-hero__caption dm-hero__caption--purple">{heroFeatured.name}</span>
                </Link>
              ) : (
                <div className="dm-hero__placeholder" aria-hidden="true">
                  <Star size={36} color="rgba(255,200,61,.7)" />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="dm-container dm-categories">
        <div className="dm-categories__grid">
          {CATEGORY_TILES.map(({ key, title, copy, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => selectFilter(key)}
              className={`dm-category dm-category--${key}`}
            >
              <Icon />
              <h2>{title}</h2>
              <p>{copy}</p>
            </button>
          ))}
        </div>
      </section>

      {favorites.length > 0 && (
        <section className="dm-container dm-section">
          <div className="dm-section__head">
            <div>
              <p className="dm-eyebrow dm-eyebrow--orange">Los favoritos</p>
              <h2 className="dm-section-title">Más elegidos</h2>
            </div>
            <Star className="dm-star" />
          </div>
          <div className="dm-products">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      <section className="dm-container dm-catalog" id="productos">
        <div className="dm-catalog__head">
          <div>
            <p className="dm-eyebrow">Catálogo</p>
            <h2 className="dm-section-title">Elegí tu próximo sabor favorito</h2>
            {query && (
              <p className="dm-catalog__query">
                <Search size={16} /> Resultados para “{query}”
              </p>
            )}
          </div>
          <div className="dm-filters" role="group" aria-label="Filtrar catálogo">
            {CATALOG_FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => selectFilter(item.key)}
                aria-pressed={filter === item.key}
                className={`dm-filter${filter === item.key ? ' is-active' : ''}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        {visible.length === 0 ? (
          <p className="dm-empty">No encontramos productos con esos filtros.</p>
        ) : (
          <div className="dm-products dm-products--catalog">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="dm-container dm-banner">
        <div className="dm-banner__box dm-banner__box--pastry">
          <div className="dm-banner__content">
            <div className="dm-banner__icon">
              <CakeSlice size={28} />
            </div>
            <div>
              <p className="dm-eyebrow">Nueva sección</p>
              <h2>Pastelería solo por encargo</h2>
              <p className="dm-banner__text">
                Tortas por kilo, tartas de molde Nº 22 y cupcakes temáticos. Podés describir tu idea y
                adjuntar fotos para recibir un presupuesto.
              </p>
            </div>
          </div>
          <Link href={`${DM_BASE}/pasteleria`} className="dm-btn dm-btn--primary">
            <CakeSlice size={20} /> Ver pastelería
          </Link>
        </div>
      </section>

      <section className="dm-container dm-banner">
        <div className="dm-banner__box dm-banner__box--combo">
          <div>
            <p className="dm-eyebrow">Regalos con sabor</p>
            <h2>Armamos combos personalizados.</h2>
            <p className="dm-banner__text">Consultanos por sabores, presentaciones y dedicatorias.</p>
          </div>
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="dm-btn dm-btn--white">
            <MessageCircle size={20} /> Quiero un combo
          </a>
        </div>
      </section>

      <section className="dm-container dm-features">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="dm-feature">
            <div className="dm-feature__icon">
              <Icon size={20} />
            </div>
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="dm-container dm-reviews">
        <div className="dm-reviews__box">
          <p className="dm-eyebrow dm-eyebrow--purple">Reseñas verificadas</p>
          <h2>Este espacio mostrará opiniones reales</h2>
          <p className="dm-reviews__text">
            No publicamos testimonios inventados. Las reseñas aparecerán cuando existan compras
            confirmadas y autorización del cliente.
          </p>
        </div>
      </section>
    </div>
  );
}
