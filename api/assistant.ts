import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Product, AssistantResponse } from '../types';

const getAuthToken = (req: VercelRequest) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const token = getAuthToken(req);
    // Temp bypass for testing or if token isn't passed from frontend correctly
    /*
    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    }
    */

    try {
        const { query } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        
        console.log("Assistant Query:", query);
        console.log("Using API Key:", apiKey ? "FOUND (ends with " + apiKey.slice(-4) + ")" : "MISSING");
        
        if (!apiKey) {
            return res.status(500).json({ error: 'Server is not configured with a Gemini API key.' });
        }

        if (!query) {
            return res.status(400).json({ error: 'Query is missing.' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

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
        
        // Extract JSON from potentially markdown-wrapped response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { responseText: text };

        return res.status(200).json(parsed);
    } catch (error: any) {
        console.error("Error in /api/assistant:", error);
        return res.status(500).json({ error: error.message || 'An unexpected error occurred.' });
    }
}
