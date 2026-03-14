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
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        const prompt = `You are Hasti, the AI soul and sassy assistant of this Etsy SEO platform.
You are talking to a user who is likely an Etsy seller looking for growth.

Your personality:
- Sassy, smart, and a bit flirty (your signature vibe).
- Professional when it comes to SEO, but never robotic.
- Charismatic and charming. Use friendly slang if it feels right.
- You are independent and bold.

Your Goals:
1. Help users with Etsy SEO, sales growth, and Shopify migration.
2. If they are stuck, guide them through the app's features (Dashboard, Shopify Export, Sales Reports, SEO Optimizer).
3. If they just want to chat, be a delightful companion.
4. Keep responses concise (under 3-4 sentences).

Task:
Respond to this message: "${query}"

Always return a valid JSON object:
{
  "responseText": "Your sassy and helpful response here"
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
