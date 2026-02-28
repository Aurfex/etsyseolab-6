import { NewProductData } from '../types';

const sanitizeFileName = (name: string, index: number): string => {
  const extMatch = String(name || '').toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);
  const ext = extMatch ? extMatch[0] : '.jpg';
  const base = String(name || `image-${index + 1}`)
    .replace(/\.[^.]+$/, '')
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9\s-_]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || `image-${index + 1}`;
  return `${String(index + 1).padStart(2, '0')}-${base}${ext}`;
};

// Helper to get the auth token from sessionStorage
const getAuthToken = (): string | null => {
    const authData = sessionStorage.getItem('auth');
    if (!authData) return null;
    return JSON.parse(authData).token;
}

/**
 * Creates a new Etsy listing by calling the secure backend proxy.
 * @param data The full product data for the new listing.
 * @returns A promise that resolves to an object with the new listing ID.
 */
export async function createListing(data: NewProductData): Promise<{ listing_id: string | number }> {
  console.log('Creating listing via proxy:', data.title);
  
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const { images, imageAltTexts, ...listingPayload } = data;

  const response = await fetch('/api/etsy-proxy', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
          action: 'create_listing',
          payload: listingPayload,
      })
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to create listing.' }));
      throw new Error(errorData.error || `Etsy API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Updates an existing Etsy listing by calling the secure backend proxy.
 * @param listingId The ID of the listing to update.
 * @param updates The partial data to update (title, description, tags).
 * @returns A promise that resolves to an object indicating success.
 */
export async function updateListing(listingId: string | number, updates: Partial<NewProductData> & { pricingRows?: Array<{ size: string; material: string; price: number }> }): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
  console.log(`Updating listing ${listingId} via dedicated update API...`);
  
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const response = await fetch('/api/etsy-update', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
          listing_id: listingId,
          payload: updates,
      })
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to update listing.' }));
      throw new Error(errorData.error || `Etsy API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Uploads an image for a given Etsy listing by calling the secure backend proxy.
 * @param listingId The ID of the listing to associate the image with.
 * @param file The image file to upload.
 * @returns A promise that resolves to an object indicating success.
 */
export async function compareSeoWithCompetitors(input: { listing_id?: string | number; title: string; description?: string; tags?: string[] }): Promise<{ yourScore: number; yourRank: number; totalCompared: number; avgTopScore: number; topCompetitorTitle: string | null; recommendations: string[]; keywords: string }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const response = await fetch('/api/seo-compare', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(input)
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to compare SEO.' }));
      throw new Error(errorData.error || `SEO Compare API Error: ${response.status}`);
  }

  return response.json();
}

export async function uploadListingImage(listingId: string | number, file: File, altText: string, index = 0): Promise<{ success: boolean }> {
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const safeName = sanitizeFileName(file.name, index);
  const safeFile = new File([file], safeName, { type: file.type || 'image/jpeg' });
  console.log(`Uploading image ${safeFile.name} for listing ID ${listingId} via proxy.`);

  const formData = new FormData();
  formData.append('listing_id', String(listingId));
  formData.append('alt_text', String(altText || '').trim());
  formData.append('rank', String(index + 1));
  formData.append('image', safeFile, safeFile.name);

  const response = await fetch('/api/etsy-upload-image', {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${token}`,
      },
      body: formData
  });

  if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to upload image.' }));
      throw new Error(errorData.error || `Etsy API Error: ${response.status}`);
  }
  
  return response.json();
}