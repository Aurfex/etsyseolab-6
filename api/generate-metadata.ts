import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

const verifyAuth = (req: VercelRequest): { authorized: boolean; error?: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized: Missing or invalid token.' };
  }
  return { authorized: true };
};

type VisionImageInput = { mimeType: string; data: string };

type OutputShape = {
  title: string;
  description: string;
  tags: string[];
  imageAltTexts?: string[];
  suggestedBasics: {
    categoryHint: string;
    price: number;
    quantity: number;
    who_made: 'i_did' | 'collective' | 'someone_else';
    when_made: 'made_to_order' | '2020_2024' | '2010_2019' | 'before_2010';
    is_supply: boolean;
  };
  warning?: string;
};

const normalizeOutput = (parsed: any, details: { title?: string; description?: string }, images: VisionImageInput[]): OutputShape => {
  let title = String(parsed?.title || details.title || 'Handmade Jewelry Listing').trim().slice(0, 140);
  const description = String(parsed?.description || details.description || '').trim();
  const tags = Array.isArray(parsed?.tags)
    ? [...new Set(parsed.tags.map((t: any) => String(t || '').trim()).filter(Boolean))].map((t) => t.slice(0, 20)).slice(0, 13)
    : [];

  if (!title || /^handmade jewelry listing$/i.test(title)) {
    const seed = Array.isArray(parsed?.tags) ? parsed.tags.slice(0, 3).join(' ') : '';
    const hint = String(parsed?.suggestedBasics?.categoryHint || 'Handmade Gift').trim();
    title = `${seed || 'Handmade'} ${hint} - Unique Etsy Item`.replace(/\s+/g, ' ').trim().slice(0, 140);
  }

  const imageAltTexts = Array.isArray(parsed?.imageAltTexts)
    ? parsed.imageAltTexts.map((a: any) => String(a || '').trim().slice(0, 140))
    : images.map((_, i) => `${title} image ${i + 1}`.slice(0, 140));

  const suggested = parsed?.suggestedBasics || {};
  const suggestedBasics = {
    categoryHint: String(suggested.categoryHint || 'Jewelry').trim(),
    price: Number.isFinite(Number(suggested.price)) ? Number(suggested.price) : 29.99,
    quantity: Number.isFinite(Number(suggested.quantity)) ? Math.max(1, Math.floor(Number(suggested.quantity))) : 1,
    who_made: ['i_did', 'collective', 'someone_else'].includes(String(suggested.who_made)) ? String(suggested.who_made) as any : 'i_did',
    when_made: ['made_to_order', '2020_2024', '2010_2019', 'before_2010'].includes(String(suggested.when_made)) ? String(suggested.when_made) as any : 'made_to_order',
    is_supply: Boolean(suggested.is_supply),
  };

  return { title, description, tags, imageAltTexts, suggestedBasics };
};

export default async function endpoint(req: VercelRequest, res: VercelResponse) {
  const authCheck = verifyAuth(req);
  if (!authCheck.authorized) return res.status(401).json({ error: authCheck.error });
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const body = (req.body || {}) as { details?: { title?: string; description?: string }; images?: VisionImageInput[] };
    const details = body?.details || {};
    const images = Array.isArray(body?.images) ? body.images.slice(0, 5) : [];

    const prompt = `You are an Etsy SEO + listing setup expert.
Return STRICT JSON with keys: title, description, tags, imageAltTexts, suggestedBasics.
Rules:
- title <= 140 chars (target 90-140)
- title must start with primary keyword and include product type + style/material + gift/use-case if relevant
- title must NOT include price, shipping, discount terms, emoji, excessive repetition, or clickbait
- avoid generic titles like "Handmade Jewelry Listing"
- tags up to 13, each <= 20 chars, unique, no punctuation spam
- imageAltTexts one per image, each <= 140 chars
- suggestedBasics keys: categoryHint, price, quantity, who_made, when_made, is_supply
- who_made in ["i_did","collective","someone_else"]
- when_made in ["made_to_order","2020_2024","2010_2019","before_2010"]
- avoid fake claims
Seller notes:
- title: ${String(details.title || '').trim() || 'N/A'}
- description: ${String(details.description || '').trim() || 'N/A'}`;

    // Prefer OpenAI when available (user preference)
    const openAiKey = process.env.OPENAI_API_KEY;
    let openAiError: string | null = null;
    if (openAiKey) {
      try {
        const content: any[] = [{ type: 'text', text: prompt }];
        for (const img of images) {
          content.push({
            type: 'image_url',
            image_url: {
              url: `data:${img.mimeType || 'image/jpeg'};base64,${img.data}`,
            },
          });
        }

        const oaiResp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openAiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || 'gpt-4o',
            temperature: 0.2,
            messages: [
              {
                role: 'user',
                content,
              },
            ],
          }),
        });

        const oaiData: any = await oaiResp.json().catch(() => ({}));
        if (!oaiResp.ok) {
          throw new Error(oaiData?.error?.message || `OpenAI request failed (${oaiResp.status})`);
        }

        const txt = String(oaiData?.choices?.[0]?.message?.content || '{}');
        const start = txt.indexOf('{');
        const end = txt.lastIndexOf('}');
        const jsonText = start >= 0 && end > start ? txt.slice(start, end + 1) : '{}';
        const parsed = JSON.parse(jsonText);
        return res.status(200).json(normalizeOutput(parsed, details, images));
      } catch (err: any) {
        openAiError = err?.message || 'OpenAI analyze failed';
        console.error('OpenAI analyze failed, falling back:', openAiError);
      }
    }

    // Secondary path: Gemini (legacy compatibility)
    const geminiKey = process.env.API_KEY;
    if (geminiKey) {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const model = 'gemini-2.5-flash';

      const basicsSchema = {
        type: Type.OBJECT,
        properties: {
          categoryHint: { type: Type.STRING },
          price: { type: Type.NUMBER },
          quantity: { type: Type.NUMBER },
          who_made: { type: Type.STRING },
          when_made: { type: Type.STRING },
          is_supply: { type: Type.BOOLEAN },
        },
        required: ['categoryHint', 'price', 'quantity', 'who_made', 'when_made', 'is_supply'],
      };

      const responseSchema: any = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          imageAltTexts: { type: Type.ARRAY, items: { type: Type.STRING } },
          suggestedBasics: basicsSchema,
        },
        required: ['title', 'description', 'tags', 'suggestedBasics'],
      };

      const contents: any = images.length
        ? [{ role: 'user', parts: [{ text: prompt }, ...images.map((img) => ({ inlineData: { mimeType: img.mimeType || 'image/jpeg', data: img.data } }))] }]
        : prompt;

      const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents,
        config: { responseMimeType: 'application/json', responseSchema },
      });
      const parsed = JSON.parse(response.text || '{}');
      const normalized = normalizeOutput(parsed, details, images);
      if (openAiError) normalized.warning = `OpenAI fallback: ${openAiError}`;
      return res.status(200).json(normalized);
    }

    // Last resort fallback when no AI key present
    return res.status(200).json({
      ...normalizeOutput({}, details, images),
      warning: openAiError
        ? `OpenAI fallback: ${openAiError}`
        : 'No AI key configured (OPENAI_API_KEY/API_KEY). Fallback metadata used.',
    });
  } catch (error: any) {
    console.error('Error in metadata generation endpoint:', error?.message || error, error?.stack || '');
    return res.status(500).json({ error: error?.message || 'An unexpected error occurred while generating metadata.' });
  }
}
