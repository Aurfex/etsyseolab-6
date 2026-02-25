import { Product, OptimizationResult } from '../types';

const getAuthToken = (): string | null => {
    const authData = sessionStorage.getItem('auth');
    if (!authData) return null;
    return JSON.parse(authData).token;
};

const API_ENDPOINT = '/api/optimize';

async function callOptimizeApi<T>(product: Product, type: 'all' | 'tags' | 'description' = 'all'): Promise<T> {
    const token = getAuthToken();
    if (!token) throw new Error("Authentication required.");

    const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ product, type }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Optimization failed.' }));
        throw new Error(errorData.error || `API Error: ${response.status}`);
    }

    return response.json();
}

export const runFullOptimization = async (product: Product): Promise<OptimizationResult> => {
    return callOptimizeApi<OptimizationResult>(product, 'all');
};

export const generateOptimizedTags = async (product: Product): Promise<string[]> => {
    const result = await callOptimizeApi<{ tags: string[] }>(product, 'tags');
    return result.tags;
};

export const generateOptimizedDescription = async (product: Product): Promise<string> => {
    const result = await callOptimizeApi<{ description: string }>(product, 'description');
    return result.description;
};
