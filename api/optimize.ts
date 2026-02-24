import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Product, OptimizationResult } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Enable CORS manually if needed, but Vercel usually handles same-origin
    res.setHeader('Content-Type', 'application/json');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // In Vercel Node functions, body is already parsed
        const { product } = req.body as { product: Product; };
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'Server is not configured with an API key.' });
        }
        
        if (!product || !product.title || !product.description) {
            return res.status(400).json({ error: 'Invalid product data provided. Title and description are required.' });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        // Use specific version to avoid "not found" errors
        const model = 'gemini-1.5-flash-001';

        const optimizeTitle = async (originalTitle: string): Promise<string> => {
            const prompt = `Transform "${originalTitle}" into a highly optimized Etsy product title for a jewelry shop named 'dxbJewellery'. It should be long, descriptive, and include keywords like 'Handmade', material type, style (e.g., 'Minimalist'), and benefits (e.g., 'Hypoallergenic'). Target audience is women looking for jewelry gifts. Example transformation: "Gold Hoop Earrings" becomes "Handmade 14k Gold Hoop Earrings – Minimalist Jewelry for Women – Hypoallergenic – Lightweight Dangle Earrings".`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.7, topP: 0.9, topK: 40 } });
            return response.text()?.trim().replace(/^"|"$/g, '') || originalTitle;
        };

        const generateTags = async (title: string, description: string): Promise<string[]> => {
            const prompt = `Based on the product title "${title}" and description "${description}", generate exactly 13 SEO-optimized Etsy tags for a jewelry item. Include a mix of broad and long-tail keywords relevant for handmade jewelry. Return only a JSON array of strings.`;
            // Using JSON mode properly
            const response: GenerateContentResponse = await ai.models.generateContent({ 
                model, 
                contents: prompt, 
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }
                    }
                } 
            });
            
            try {
                const jsonText = response.text();
                const jsonResponse = JSON.parse(jsonText);
                return (jsonResponse.tags || []).slice(0, 13);
            } catch (e) {
                console.warn("Failed to parse tags JSON", e);
                return [];
            }
        };

        const rewriteDescription = async (originalDescription: string): Promise<string> => {
            const prompt = `Rewrite this Etsy product description to be more customer-focused, keyword-rich, and structured for high ranking and conversion. Use bullet points for key features and a narrative style. Original description: "${originalDescription}"`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
            return response.text()?.trim() || originalDescription;
        };

        const generateAltText = async (title: string, description: string): Promise<string> => {
            const prompt = `Generate a descriptive and SEO-friendly alt text for an e-commerce product image. The product is: "${title}". Description: "${description}". The alt text should be useful for visually impaired users and search engines, and be under 125 characters.`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt });
            return response.text()?.trim() || title;
        };

        // Run optimizations in parallel for efficiency
        const [newTitle, newDescription, newAltText] = await Promise.all([
            optimizeTitle(product.title),
            rewriteDescription(product.description),
            generateAltText(product.title, product.description)
        ]);
        
        // Tags depend on the new title and description for best results
        const newTags = await generateTags(newTitle, newDescription);

        const result: OptimizationResult = {
            title: newTitle,
            description: newDescription,
            tags: newTags,
            altText: newAltText,
        };

        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Error in optimization endpoint:", error);
        return res.status(500).json({ 
            error: 'An unexpected error occurred while processing the optimization.',
            details: error.message 
        });
    }
}