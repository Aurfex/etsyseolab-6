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

    const { product, targetEvent } = req.body as { product: Product; targetEvent?: string };
    if (!product || !product.title) {
        return res.status(400).json({ error: 'Invalid product data.' });
    }

    // Determine the niche
    const userNiche = product.description?.toLowerCase().includes('jewelry') || product.title.toLowerCase().includes('jewelry') 
        ? 'Jewelry' 
        : 'Handmade Crafts';

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured in Vercel environment variables.' });
    }

    try {
        console.log('Starting Gemini optimization for:', product.id, 'Niche:', userNiche, 'Target Event:', targetEvent);
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

        const eventInstruction = targetEvent 
            ? `CRITICAL: This optimization is SPECIFICALLY for the upcoming "${targetEvent}" sales event.
- Infuse the Title and Description with keywords related to ${targetEvent} (e.g., if Mother's Day, use "Gift for Mom", "Mother's Day Jewelry").
- Make the hook in the description appeal to someone looking for a ${targetEvent} gift.
- Ensure at least 3-4 tags are directly related to ${targetEvent}.`
            : "Optimize for general year-round high-performance Etsy SEO.";

        const promptText = `Analyze this Etsy product and its image (if provided).
Niche: ${userNiche}
Target Event Context: ${targetEvent || 'General SEO'}
Original Title: "${product.title}"
Original Description: "${product.description || ''}"
Original Tags: ${JSON.stringify(product.tags || [])}

TASK (ETSY SEO 2026 STRATEGY):
${eventInstruction}
1. Optimize the Title (Target: 90-140 chars). Put the most important ${userNiche} ${targetEvent ? 'and ' + targetEvent : ''} keywords in the first 40 characters for mobile visibility. Use '|' or commas to separate keyword phrases.
2. Rewrite the Description: Start with a powerful hook relevant to ${userNiche} buyers, use bullet points for benefits and materials (e.g., 14K Gold, Sterling Silver if applicable), and end with a Call to Action.
3. Generate EXACTLY 13 tags: Use high-volume long-tail keywords specifically for the ${userNiche} market. EACH TAG MUST BE 20 CHARACTERS OR LESS. 
4. Generate Alt Text: Descriptive and under 125 chars.

STRICT REQUIREMENTS (CRITICAL):
- TITLE LENGTH: 90-140 characters. NO EXCEPTIONS.
- TAG COUNT: Exactly 13 tags. NO EXCEPTIONS.
- TAG LENGTH: MAXIMUM 20 CHARACTERS PER TAG.
- If it's Jewelry, focus on materials (Gold, Silver), occasion (Wedding, Anniversary), and style (Minimalist, Art Deco).
- Return ONLY a valid JSON object with these keys: title, description, tags (array), altText. Do not include markdown code blocks.`;

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
