import { NewProductData } from '../types';

type VisionImageInput = {
  mimeType: string;
  data: string; // base64 without data: prefix
};

type GenerateMetadataPayload = {
  details: Pick<NewProductData, 'title' | 'description'>;
  images?: VisionImageInput[];
};

const fileToBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => {
    const result = String(reader.result || '');
    const commaIndex = result.indexOf(',');
    resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
  };
  reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
  reader.readAsDataURL(file);
});

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

  const maxVisionImages = files.slice(0, 5);
  const images: VisionImageInput[] = await Promise.all(
    maxVisionImages.map(async (file) => ({
      mimeType: file.type || 'image/jpeg',
      data: await fileToBase64(file),
    }))
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