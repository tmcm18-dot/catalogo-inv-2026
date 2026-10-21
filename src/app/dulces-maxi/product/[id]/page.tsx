import type { Metadata } from 'next';
import ProductDetail from '@/components/dulces-maxi/ProductDetail';
import { getProduct, listProducts } from '@/lib/dulces-maxi/products';

type Params = { id: string };

export const dynamicParams = true;

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
  return <ProductDetail id={id} initialProduct={getProduct(id)} />;
}
