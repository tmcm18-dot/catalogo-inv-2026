import type { Metadata } from 'next';
import Link from 'next/link';
import ProductDetail from '@/components/dulces-maxi/ProductDetail';
import { DM_BASE, getProduct, listProducts } from '@/lib/dulces-maxi/products';

type Params = { id: string };

export function generateStaticParams(): Params[] {
  return listProducts().map((product) => ({ id: product.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) return { title: 'Producto no encontrado' };
  return {
    title: product.name,
    description: product.short_description || product.description,
    openGraph: { title: product.name, images: [{ url: product.image_url }] },
  };
}

export default async function ProductPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const product = getProduct(id);
  if (!product) {
    return (
      <div className="dm-notfound">
        Producto no encontrado. <Link href={DM_BASE}>Volver a la tienda</Link>
      </div>
    );
  }
  return <ProductDetail product={product} />;
}
