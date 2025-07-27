import { NewProductData } from '../types';

/**
 * Calls the secure backend API to generate SEO metadata for a new product.
 * @param details The basic product details (title, description).
 * @returns A promise that resolves to the generated title, description, and tags.
 */
export const generateSeoMetadata = async (
  details: Pick<NewProductData, 'title' | 'description'>
): Promise<Pick<NewProductData, 'title' | 'description' | 'tags'>> => {
  // In a real application, you'd get the token from your auth context/store.
  const token = sessionStorage.getItem('auth') ? JSON.parse(sessionStorage.getItem('auth')!).token : null;
  if (!token) {
    throw new Error("Authentication token not found.");
  }
  
  const response = await fetch('/api/generate-metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ details }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred while generating metadata.' }));
    throw new Error(errorData.error || `Request failed with status ${response.status}`);
  }

  return response.json();
};