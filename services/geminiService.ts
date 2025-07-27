import { Product, OptimizationResult } from '../types';

/**
 * Calls the secure backend API to perform a full SEO optimization.
 * @param product The product to optimize.
 * @returns A promise that resolves to the optimization results.
 */
export const runFullOptimization = async (product: Product): Promise<OptimizationResult> => {
    const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ product }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred during optimization.' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }

    return response.json();
};