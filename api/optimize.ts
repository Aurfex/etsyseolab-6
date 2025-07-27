import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Product, OptimizationResult } from '../types';

export default async function endpoint(req: Request): Promise<Response> {
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers: { 'Content-Type': 'application/json' } });
    }

    try {
        const { product } = await req.json() as { product: Product; };
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
        }
        
        if (!product || !product.title || !product.description) {
            return new Response(JSON.stringify({ error: 'Invalid product data provided.' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        
        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash';

        const optimizeTitle = async (originalTitle: string): Promise<string> => {
            const prompt = `Transform "${originalTitle}" into a highly optimized Etsy product title for a jewelry shop named 'dxbJewellery'. It should be long, descriptive, and include keywords like 'Handmade', material type, style (e.g., 'Minimalist'), and benefits (e.g., 'Hypoallergenic'). Target audience is women looking for jewelry gifts. Example transformation: "Gold Hoop Earrings" becomes "Handmade 14k Gold Hoop Earrings – Minimalist Jewelry for Women – Hypoallergenic – Lightweight Dangle Earrings".`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.7, topP: 0.9, topK: 40 } });
            return response.text.trim().replace(/^"|"$/g, '');
        };

        const generateTags = async (title: string, description: string): Promise<string[]> => {
            const prompt = `Based on the product title "${title}" and description "${description}", generate exactly 13 SEO-optimized Etsy tags for a jewelry item. Include a mix of broad and long-tail keywords relevant for handmade jewelry. Return only a JSON array of strings.`;
            const responseSchema = { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "An array of 13 SEO-optimized tags." } }, required: ["tags"] };
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema: responseSchema } });
            const jsonResponse = JSON.parse(response.text);
            return (jsonResponse.tags || []).slice(0, 13);
        };

        const rewriteDescription = async (originalDescription: string): Promise<string> => {
            const prompt = `Rewrite this Etsy product description to be more customer-focused, keyword-rich, and structured for high ranking and conversion. Use bullet points for key features and a narrative style. Original description: "${originalDescription}"`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { temperature: 0.8 } });
            return response.text.trim();
        };

        const generateAltText = async (title: string, description: string): Promise<string> => {
            const prompt = `Generate a descriptive and SEO-friendly alt text for an e-commerce product image. The product is: "${title}". Description: "${description}". The alt text should be useful for visually impaired users and search engines, and be under 125 characters.`;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt });
            return response.text.trim();
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

        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        console.error("Error in optimization endpoint:", error);
        // Avoid sending detailed internal errors to the client
        return new Response(JSON.stringify({ error: 'An unexpected error occurred while processing the optimization.' }), {
            headers: { 'Content-Type': 'application/json' },
            status: 500,
        });
    }
}