const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PAGE_SAND = '#fbf8ee';
const ALPHA_TYPES = new Set(['image/png', 'image/webp', 'image/gif']);

export function compressImageFile(file: File, maxEdge = 1400, quality = 0.82): Promise<string> {
  return rasterizeToBlob(file, { maxEdge, mime: 'image/jpeg', quality, flatten: PAGE_SAND }).then(
    (blob) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('READ'));
        reader.readAsDataURL(blob);
      })
  );
}

export function compressImageToFile(file: File, maxEdge = 1400, quality = 0.82): Promise<File> {
  return rasterizeToFile(file, { maxEdge, mime: 'image/jpeg', quality, flatten: PAGE_SAND });
}

export async function compressImageForUpload(file: File): Promise<File> {
  const type = file.type || 'image/jpeg';
  if (type === 'image/jpeg' && file.size <= MAX_UPLOAD_BYTES) return file;

  if (ALPHA_TYPES.has(type)) {
    const png = await rasterizeToFile(file, { maxEdge: 1400, mime: 'image/png' });
    if (png.size <= MAX_UPLOAD_BYTES) return png;

    let quality = 0.88;
    let edge = 1400;
    let webp = await rasterizeToFile(file, { maxEdge: edge, mime: 'image/webp', quality });
    while (webp.size > MAX_UPLOAD_BYTES && (quality > 0.5 || edge > 800)) {
      quality = Math.max(0.5, quality - 0.1);
      edge = Math.max(800, Math.round(edge * 0.85));
      webp = await rasterizeToFile(file, { maxEdge: edge, mime: 'image/webp', quality });
    }
    if (webp.size <= MAX_UPLOAD_BYTES) return webp;
  }

  let quality = 0.82;
  let edge = 1400;
  let jpeg = await rasterizeToFile(file, { maxEdge: edge, mime: 'image/jpeg', quality, flatten: PAGE_SAND });
  while (jpeg.size > MAX_UPLOAD_BYTES && (quality > 0.45 || edge > 800)) {
    quality = Math.max(0.45, quality - 0.12);
    edge = Math.max(800, Math.round(edge * 0.85));
    jpeg = await rasterizeToFile(file, { maxEdge: edge, mime: 'image/jpeg', quality, flatten: PAGE_SAND });
  }
  return jpeg;
}

type RasterizeOpts = {
  maxEdge: number;
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  quality?: number;
  flatten?: string;
};

function extFor(mime: RasterizeOpts['mime']): string {
  if (mime === 'image/png') return '.png';
  if (mime === 'image/webp') return '.webp';
  return '.jpg';
}

function rasterizeToFile(file: File, opts: RasterizeOpts): Promise<File> {
  const name = file.name.replace(/\.[^.]+$/, '') + extFor(opts.mime);
  return rasterizeToBlob(file, opts).then((blob) => new File([blob], name, { type: blob.type || opts.mime }));
}

function rasterizeToBlob(file: File, opts: RasterizeOpts): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(1, opts.maxEdge / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('CANVAS'));
        return;
      }
      if (opts.flatten) {
        ctx.fillStyle = opts.flatten;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.drawImage(image, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('BLOB'));
            return;
          }
          resolve(blob);
        },
        opts.mime,
        opts.quality
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('IMAGE'));
    };
    image.src = url;
  });
}

export async function fileFromRemoteUrl(url: string, index = 0): Promise<File> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('FETCH');
  const blob = await res.blob();
  const type = blob.type && blob.type.startsWith('image/') ? blob.type : 'image/jpeg';
  const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : type.includes('gif') ? 'gif' : 'jpg';
  return new File([blob], `product-${index + 1}.${ext}`, { type });
}
