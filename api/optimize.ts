import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import { Product, OptimizationResult } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { product, type = 'all' } = req.body as { product: Product; type?: 'all' | 'tags' | 'description' };
        
        // Use OpenAI API Key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error("Server Error: Missing OPENAI_API_KEY environment variable.");
            return res.status(500).json({ error: 'Server is not configured with an OpenAI API key.' });
        }
        
        if (!product || !product.title) {
            return res.status(400).json({ error: 'Invalid product data provided. Title is required.' });
        }
        
        // Initialize OpenAI
        const openai = new OpenAI({ apiKey: apiKey });
        const model = "gpt-4o"; // Or "gpt-3.5-turbo" if needed for cost/speed

        const optimizeTitle = async (originalTitle: string): Promise<string> => {
            const prompt = `Transform "${originalTitle}" into a highly optimized Etsy product title for a jewelry shop named 'dxbJewellery'. It should be long, descriptive, and include keywords like 'Handmade', material type, style (e.g., 'Minimalist'), and benefits (e.g., 'Hypoallergenic'). Target audience is women looking for jewelry gifts. Example transformation: "Gold Hoop Earrings" becomes "Handmade 14k Gold Hoop Earrings – Minimalist Jewelry for Women – Hypoallergenic – Lightweight Dangle Earrings". Return ONLY the title.`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                return response.choices[0].message.content?.trim().replace(/^"|"$/g, '') || originalTitle;
            } catch (e) {
                console.error("Title optimization error:", e);
                return originalTitle;
            }
        };

        const generateTags = async (title: string, description: string): Promise<string[]> => {
            const prompt = `Based on the product title "${title}" and description "${description}", generate exactly 13 high-traffic, relevant Etsy SEO tags. 
            IMPORTANT CONSTRAINTS:
            1. EXACTLY 13 tags.
            2. Each tag MUST be 20 characters or LESS.
            3. No special characters except spaces.
            4. Multi-word tags are better (e.g., "gold ring" instead of "ring").
            
            Return ONLY a valid JSON array of strings (e.g., ["tag1", "tag2"]). Do not include markdown formatting or explanations.`;
            
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                let text = response.choices[0].message.content?.trim() || "[]";
                // Clean up potential markdown code blocks
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(text);
                // Filter again to be safe
                return Array.isArray(tags) ? tags.filter((t: string) => t.length <= 20).slice(0, 13) : [];
            } catch (e) {
                console.warn("Tag generation error:", e);
                return [];
            }
        };

        const rewriteDescription = async (originalDescription: string): Promise<string> => {
            const prompt = `Rewrite this Etsy product description to be persuasive, keyword-rich, and structured for sales. Use an engaging opening, bullet points for features/materials, and a clear call to action. Keep the tone friendly and professional. Original description: "${originalDescription}"`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                return response.choices[0].message.content?.trim() || originalDescription;
            } catch (e) {
                console.error("Description rewrite error:", e);
                return originalDescription;
            }
        };

        const generateAltText = async (title: string, description: string): Promise<string> => {
            const prompt = `Generate a descriptive and SEO-friendly alt text for an e-commerce product image. The product is: "${title}". Description: "${description}". The alt text should be useful for visually impaired users and search engines, and be under 125 characters. Return ONLY the alt text.`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                return response.choices[0].message.content?.trim() || title;
            } catch (e) {
                console.error("Alt text generation error:", e);
                return title;
            }
        };

        if (type === 'tags') {
            const tags = await generateTags(product.title, product.description || '');
            return res.status(200).json({ tags });
        }

        if (type === 'description') {
            const description = await rewriteDescription(product.description || product.title);
            return res.status(200).json({ description });
        }

        // Run optimizations in parallel for 'all'
        const [newTitle, newDescription, newAltText] = await Promise.all([
            optimizeTitle(product.title),
            rewriteDescription(product.description || product.title),
            generateAltText(product.title, product.description || '')
        ]);
        
        // Tags benefit from using the optimized title
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
