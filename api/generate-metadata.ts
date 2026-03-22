import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NewProductData } from '../types';

type VisionImageInput = {
  mimeType: string;
  data: string; // base64 without data: prefix
};

type GenerateMetadataPayload = {
  details: Pick<NewProductData, 'title' | 'description'> & { keywords?: string };
  images?: VisionImageInput[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { details, images } = req.body as GenerateMetadataPayload;
    
    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured.' });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
        const genAI = new GoogleGenerativeAI(apiKey);
        // Using gemini-1.5-flash-latest which is more standard than plain 1.5-flash in some environments
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
        
        let promptParts: any[] = [];
        
        // Add images if provided
        if (images && images.length > 0) {
            images.forEach(img => {
                promptParts.push({
                    inlineData: {
                        data: img.data,
                        mimeType: img.mimeType
                    }
                });
            });
        }

        const promptText = `Analyze these product images and the provided details.
Original Title: "${details.title || ''}"
Original Description: "${details.description || ''}"
User Keywords/Hints: "${details.keywords || ''}"

TASK:
1. Generate an optimized Etsy Title (90-140 chars).
2. Generate a compelling Etsy Description.
3. Generate exactly 13 tags (max 20 chars each).
4. Generate descriptive Alt Text for each image.
5. Suggest basic listing fields (suggestedBasics): price, quantity, who_made, when_made, is_supply, and a categoryHint for taxonomy lookup.

STRICT REQUIREMENTS:
- TITLE: 90-140 chars.
- TAGS: Exactly 13 tags, each max 20 chars.
- Return ONLY a valid JSON object with these keys: title, description, tags (array), imageAltTexts (array), suggestedBasics (object). Do not include markdown code blocks.`;

        promptParts.push(promptText);

        const result = await model.generateContent(promptParts);
        const response = await result.response;
        let text = response.text().trim();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const jsonResult = JSON.parse(text);

        // Sanitize tags: ensure each tag is max 20 chars
        if (Array.isArray(jsonResult.tags)) {
            jsonResult.tags = jsonResult.tags.map((tag: string) => tag.substring(0, 20)).slice(0, 13);
        }

        return res.status(200).json(jsonResult);

    } catch (error: any) {
        console.error("Metadata generation error:", error);
        return res.status(500).json({ error: error.message });
    }
}
