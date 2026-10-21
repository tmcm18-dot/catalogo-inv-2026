'use client';

import Image from 'next/image';
import { isLocalSrc } from '@/lib/dulces-maxi/images';

export default function ProductPhoto({
  src,
  alt,
  fill,
  width,
  height,
  sizes,
  priority,
  className,
}: {
  src?: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  if (!src) return <div className="dm-card__nophoto">Falta cargar la foto</div>;
  if (isLocalSrc(src)) {
    if (fill) {
      return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
    }
    return (
      <Image
        src={src}
        alt={alt}
        width={width || 1200}
        height={height || 1200}
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} style={fill ? { width: '100%', height: '100%', objectFit: 'cover' } : undefined} />
  );
}
