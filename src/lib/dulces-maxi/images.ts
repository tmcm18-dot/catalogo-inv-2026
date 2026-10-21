export function isLocalSrc(src: string | undefined): boolean {
  return Boolean(src && src.startsWith('/') && !src.startsWith('//'));
}

export async function compressImage(file: File, maxSize = 900, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('No pudimos procesar la imagen.');
  context.drawImage(bitmap, 0, 0, width, height);
  return canvas.toDataURL('image/webp', quality);
}
