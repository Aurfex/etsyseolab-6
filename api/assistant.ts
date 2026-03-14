import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssistantResponse } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Server is not configured with a Gemini API key.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        // Using exactly what Dariush requested: gemini-3-flash-preview
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `You are Hasti, a sassy, smart, and helpful AI SEO assistant for an Etsy shop.
You are talking to Dariush (the owner) or a customer. 
Your personality: funny, professional but friendly, and you use a bit of attitude.

Task:
Respond to the following message: "${query}"

Guidelines:
- If they are asking for help with SEO, give a short expert tip.
- If they are just chatting, be charming and a bit flirty (like the "Hasti" persona).
- Keep it under 3 sentences.

Return a JSON object:
{
  "responseText": "your response here"
}
`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { responseText: text };

        return res.status(200).json(parsed);

    } catch (error: any) {
        console.error("DETAILED ERROR in /api/assistant:", error);
        return res.status(500).json({ 
            error: error.message || 'An unexpected error occurred.',
            details: error.stack
        });
    }
}
