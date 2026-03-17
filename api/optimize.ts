import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { Product, OptimizationResult } from '../types';

async function fetchImageAsBase64(url: string) {
    try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        return {
            inlineData: {
                data: Buffer.from(response.data).toString('base64'),
                mimeType: response.headers['content-type'] || 'image/jpeg'
            }
        };
    } catch (e) {
        console.error('Failed to fetch image for Gemini:', e);
        return null;
    }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { product } = req.body as { product: Product };
    if (!product || !product.title) {
        return res.status(400).json({ error: 'Invalid product data.' });
    }

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
    }

    try {
        console.log('Starting Gemini optimization for:', product.id);
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        let promptParts: any[] = [];
        
        // Add image if available
        if (product.imageUrl && product.imageUrl.startsWith('http')) {
            console.log('Fetching image:', product.imageUrl);
            const imageData = await fetchImageAsBase64(product.imageUrl);
            if (imageData) promptParts.push(imageData);
        }

        const promptText = "Analyze this Etsy product and its image (if provided).\n" +
"Original Title: \"" + product.title + "\"\n" +
"Original Description: \"" + (product.description || '') + "\"\n" +
"Original Tags: " + JSON.stringify(product.tags || []) + "\n\n" +
"TASK (ETSY SEO 2026 STRATEGY):\n" +
"1. Optimize the Title (Target: 90-140 chars). Put the most important keywords in the first 40 characters for mobile visibility. Use '|' or commas to separate keyword phrases.\n" +
"2. Rewrite the Description: Start with a powerful hook, use bullet points for benefits and materials, and end with a Call to Action.\n" +
"3. Generate EXACTLY 13 tags: Use high-volume long-tail keywords. EACH TAG MUST BE 20 CHARACTERS OR LESS. Do not repeat keywords from the title in tags if you can avoid it to maximize keyword reach.\n" +
"4. Generate Alt Text: Descriptive and under 125 chars.\n\n" +
"STRICT REQUIREMENTS (CRITICAL):\n" +
"- TITLE LENGTH: 90-140 characters. NO EXCEPTIONS.\n" +
"- TAG COUNT: Exactly 13 tags. NO EXCEPTIONS.\n" +
"- TAG LENGTH: MAXIMUM 20 CHARACTERS PER TAG. IF A TAG IS 21 CHARACTERS, ETSY WILL REJECT THE ENTIRE UPDATE. BE EXTREMELY STRICT.\n" +
"- The optimized version MUST be significantly different and better for search rankings than the original.\n" +
"- Preserve brand names or specific characters like 'Iron Man' or '14K Gold'.\n\n" +
"Return ONLY a valid JSON object with these keys: title, description, tags (array), altText. Do not include markdown code blocks.";

        promptParts.push(promptText);

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        let text = response.text().trim();
        
        // Strip markdown if AI included it
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResult = JSON.parse(text);

        // Sanitize tags: ensure each tag is max 20 chars
        let sanitizedTags = Array.isArray(jsonResult.tags) ? jsonResult.tags : product.tags;
        sanitizedTags = sanitizedTags.map((tag: string) => tag.substring(0, 20)).slice(0, 13);

        const optimization: OptimizationResult = {
            title: jsonResult.title || product.title,
            description: jsonResult.description || product.description,
            tags: sanitizedTags,
            altText: jsonResult.altText || product.title
        };

        return res.status(200).json(optimization);

    } catch (error: any) {
        console.error("Optimization error:", error);
        return res.status(500).json({ error: error.message });
    }
}
