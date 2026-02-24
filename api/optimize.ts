import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
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
        const { product } = req.body as { product: Product; };
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            console.error("Server Error: Missing API_KEY environment variable.");
            return res.status(500).json({ error: 'Server is not configured with an API key.' });
        }
        
        if (!product || !product.title || !product.description) {
            return res.status(400).json({ error: 'Invalid product data provided. Title and description are required.' });
        }
        
        // Initialize Gemini AI with standard library
        const genAI = new GoogleGenerativeAI(apiKey);
        // Use gemini-1.5-flash as a reliable, fast model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const optimizeTitle = async (originalTitle: string): Promise<string> => {
            const prompt = `Transform "${originalTitle}" into a highly optimized Etsy product title for a jewelry shop named 'dxbJewellery'. It should be long, descriptive, and include keywords like 'Handmade', material type, style (e.g., 'Minimalist'), and benefits (e.g., 'Hypoallergenic'). Target audience is women looking for jewelry gifts. Example transformation: "Gold Hoop Earrings" becomes "Handmade 14k Gold Hoop Earrings – Minimalist Jewelry for Women – Hypoallergenic – Lightweight Dangle Earrings". Return ONLY the title.`;
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim().replace(/^"|"$/g, '') || originalTitle;
            } catch (e) {
                console.error("Title optimization error:", e);
                return originalTitle;
            }
        };

        const generateTags = async (title: string, description: string): Promise<string[]> => {
            const prompt = `Based on the product title "${title}" and description "${description}", generate exactly 13 SEO-optimized Etsy tags for a jewelry item. Include a mix of broad and long-tail keywords relevant for handmade jewelry. Return ONLY a valid JSON array of strings (e.g., ["tag1", "tag2"]). Do not include markdown formatting.`;
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text().trim();
                // Clean up potential markdown code blocks
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(text);
                return Array.isArray(tags) ? tags.slice(0, 13) : [];
            } catch (e) {
                console.warn("Tag generation error:", e);
                return [];
            }
        };

        const rewriteDescription = async (originalDescription: string): Promise<string> => {
            const prompt = `Rewrite this Etsy product description to be more customer-focused, keyword-rich, and structured for high ranking and conversion. Use bullet points for key features and a narrative style. Original description: "${originalDescription}"`;
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim() || originalDescription;
            } catch (e) {
                console.error("Description rewrite error:", e);
                return originalDescription;
            }
        };

        const generateAltText = async (title: string, description: string): Promise<string> => {
            const prompt = `Generate a descriptive and SEO-friendly alt text for an e-commerce product image. The product is: "${title}". Description: "${description}". The alt text should be useful for visually impaired users and search engines, and be under 125 characters. Return ONLY the alt text.`;
            try {
                const result = await model.generateContent(prompt);
                const response = await result.response;
                return response.text().trim() || title;
            } catch (e) {
                console.error("Alt text generation error:", e);
                return title;
            }
        };

        // Run optimizations in parallel
        const [newTitle, newDescription, newAltText] = await Promise.all([
            optimizeTitle(product.title),
            rewriteDescription(product.description),
            generateAltText(product.title, product.description)
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
