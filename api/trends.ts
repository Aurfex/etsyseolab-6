import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { niche = 'E-commerce' } = req.query;
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const prompt = `Analyze current 2026 Etsy market trends for the "${niche}" niche. Return a strict JSON response containing:
    1. "trends": An array of exactly 4 objects. Each object must have:
      - "keyword" (string): A highly specific, trending long-tail keyword (e.g., "Art Deco 14K Gold").
      - "volume" (string): The competition/volume level (e.g., "High Volume", "Low Competition", "Rising Trend", "Seasonal Spike").
      - "growth" (string): The percentage growth (e.g., "+156%", "+89%").
    2. "insight" (string): A single powerful sentence (under 25 words) analyzing competitor tactics in this niche right now.

    Return ONLY the raw JSON object, without any markdown formatting or backticks.`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    let textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error('Failed to parse Gemini response.');
    }

    const result = JSON.parse(textContent);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error('Trends API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}