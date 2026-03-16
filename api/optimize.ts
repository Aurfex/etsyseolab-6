import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from 'axios';
import { Product, OptimizationResult } from '../types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

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

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        
        let promptParts: any[] = [];
        
        // Add image if available
        if (product.imageUrl) {
            const imageData = await fetchImageAsBase64(product.imageUrl);
            if (imageData) promptParts.push(imageData);
        }

        const promptText = "Analyze this Etsy product and its image (if provided).\n" +
"Original Title: \"" + product.title + "\"\n" +
"Original Description: \"" + (product.description || '') + "\"\n" +
"Original Tags: " + JSON.stringify(product.tags || []) + "\n\n" +
"TASK:\n" +
"1. Optimize the Title (90-140 chars) using high-traffic Etsy SEO keywords based on what you see in the image and metadata.\n" +
"2. Rewrite the Description to be persuasive and structured (bullet points for features, materials).\n" +
"3. Generate exactly 13 tags (each < 20 chars).\n" +
"4. Generate a descriptive Alt Text (< 125 chars).\n\n" +
"REQUIREMENTS:\n" +
"- The title MUST be different from the original and significantly improved.\n" +
"- Focus on high-intent buyer keywords.\n" +
"- Preserve technical keywords like '14K Gold', 'Handmade', or specific brands/characters mentioned.\n\n" +
"Return ONLY a valid JSON object with these keys: title, description, tags (array), altText. Do not include markdown code blocks.";

        promptParts.push(promptText);

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        let text = response.text().trim();
        
        // Strip markdown if AI included it
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResult = JSON.parse(text);

        const optimization: OptimizationResult = {
            title: jsonResult.title || product.title,
            description: jsonResult.description || product.description,
            tags: Array.isArray(jsonResult.tags) ? jsonResult.tags.slice(0, 13) : product.tags,
            altText: jsonResult.altText || product.title
        };

        return res.status(200).json(optimization);

    } catch (error: any) {
        console.error("Optimization error:", error);
        return res.status(500).json({ error: error.message });
    }
}
