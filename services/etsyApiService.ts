import { NewProductData } from '../types';

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

  const response = await fetch('/api/etsy-proxy', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
          action: 'create_listing',
          payload: data,
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
export async function updateListing(listingId: string | number, updates: Partial<NewProductData>): Promise<{ success: boolean }> {
  console.log(`Updating listing ${listingId} via proxy...`);
  
  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const response = await fetch('/api/etsy-proxy', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
          action: 'update_listing',
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
export async function uploadListingImage(listingId: string | number, file: File): Promise<{ success: boolean }> {
  console.log(`Uploading image ${file.name} for listing ID ${listingId} via proxy.`);

  const token = getAuthToken();
  if (!token) throw new Error("Authentication required.");

  const formData = new FormData();
  formData.append('action', 'upload_image');
  formData.append('listing_id', String(listingId));
  formData.append('image', file, file.name);

  const response = await fetch('/api/etsy-proxy', {
      method: 'POST',
      headers: {
          // Content-Type is set automatically by the browser for FormData
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