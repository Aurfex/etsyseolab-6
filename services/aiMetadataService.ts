import { NewProductData } from '../types';

type VisionImageInput = {
  mimeType: string;
  data: string; // base64 without data: prefix
};

type GenerateMetadataPayload = {
  details: Pick<NewProductData, 'title' | 'description'>;
  images?: VisionImageInput[];
};

const MAX_VISION_IMAGES = 3;
const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.72;

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    const commaIndex = result.indexOf(',');
    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
  };
  reader.onerror = () => reject(reader.error || new Error('Failed to read blob'));
  reader.readAsDataURL(blob);
});

const loadImageBitmap = async (file: File): Promise<ImageBitmap> => {
  return await createImageBitmap(file);
};

const optimizeImageForVision = async (file: File): Promise<VisionImageInput> => {
  try {
    // Keep tiny files as-is
    if (file.size <= 300 * 1024) {
      const base64 = await blobToBase64(file);
      return { mimeType: file.type || 'image/jpeg', data: base64 };
    }

    const bitmap = await loadImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      const fallback = await blobToBase64(file);
      return { mimeType: file.type || 'image/jpeg', data: fallback };
    }

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    const outBlob: Blob = await new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b || file), 'image/jpeg', JPEG_QUALITY);
    });

    const base64 = await blobToBase64(outBlob);
    return { mimeType: 'image/jpeg', data: base64 };
  } catch {
    const fallback = await blobToBase64(file);
    return { mimeType: file.type || 'image/jpeg', data: fallback };
  }
};

/**
 * Calls the secure backend API to generate SEO metadata for a new product.
 * Supports image-aware generation when files are provided.
 */
export const generateSeoMetadata = async (
  details: Pick<NewProductData, 'title' | 'description'>,
  files: File[] = []
): Promise<Pick<NewProductData, 'title' | 'description' | 'tags'> & { imageAltTexts?: string[]; suggestedBasics?: { categoryHint?: string; price?: number; quantity?: number; who_made?: string; when_made?: string; is_supply?: boolean } }> => {
  const token = sessionStorage.getItem('auth') ? JSON.parse(sessionStorage.getItem('auth')!).token : null;
  if (!token) {
    throw new Error('Authentication token not found.');
  }

  const maxVisionImages = files.slice(0, MAX_VISION_IMAGES);
  const images: VisionImageInput[] = await Promise.all(
    maxVisionImages.map(async (file) => optimizeImageForVision(file))
  );

  const payload: GenerateMetadataPayload = { details };
  if (images.length > 0) payload.images = images;

  const response = await fetch('/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred while generating metadata.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};