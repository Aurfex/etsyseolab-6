import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { AssistantResponse } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { query } = req.body;
        const apiKey = process.env.OPENAI_API_KEY;
        
        console.log("Assistant Query (OpenAI):", query);
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Server is not configured with an OpenAI API key.' });
        }

        if (!query) {
            return res.status(400).json({ error: 'Query is missing.' });
        }

        const openai = new OpenAI({
            apiKey: apiKey,
        });

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

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant that always responds in valid JSON format." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("Empty response from OpenAI");

        const parsed = JSON.parse(content);
        return res.status(200).json(parsed);

    } catch (error: any) {
        console.error("DETAILED ERROR in /api/assistant (OpenAI):", error);
        return res.status(500).json({ 
            error: error.message || 'An unexpected error occurred.',
            details: error.stack
        });
    }
}
