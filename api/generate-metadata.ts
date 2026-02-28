import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

const verifyAuth = (req: VercelRequest): { authorized: boolean; error?: string } => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { authorized: false, error: 'Unauthorized: Missing or invalid token.' };
  }
  return { authorized: true };
};

type VisionImageInput = {
  mimeType: string;
  data: string;
};

export default async function endpoint(req: VercelRequest, res: VercelResponse) {
  const authCheck = verifyAuth(req);
  if (!authCheck.authorized) {
    return res.status(401).json({ error: authCheck.error });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const body = (req.body || {}) as { details?: { title?: string; description?: string }; images?: VisionImageInput[] };
    const details = body?.details || {};
    const images = Array.isArray(body?.images) ? body.images.slice(0, 5) : [];

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server is not configured with an API key.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const imageAwarePrompt = `You are an Etsy SEO + listing setup expert.
Generate optimized metadata and practical listing defaults using provided images and optional seller notes.

Rules:
- Return STRICT JSON with keys: title, description, tags, imageAltTexts, suggestedBasics
- title: <= 140 chars
- tags: array up to 13 unique tags, each <= 20 chars
- imageAltTexts: one alt text per image, each <= 140 chars
- description: persuasive, natural, include materials/style/use-cases inferred from images
- suggestedBasics must include: categoryHint, price, quantity, who_made, when_made, is_supply
- categoryHint should be a short taxonomy-like text (example: "Jewelry > Rings > Statement Rings")
- who_made in ["i_did","collective","someone_else"]
- when_made in ["made_to_order","2020_2024","2010_2019","before_2010"]
- is_supply boolean
- Avoid fake claims. If unsure, stay generic and safe.

Seller notes:
- current title idea: ${String(details.title || '').trim() || 'N/A'}
- current description idea: ${String(details.description || '').trim() || 'N/A'}`;

    const textOnlyPrompt = `Create Etsy SEO metadata from seller notes.
Rules:
- Return STRICT JSON with keys: title, description, tags, suggestedBasics
- title <= 140 chars
- tags: max 13, each <= 20 chars, no duplicates
- suggestedBasics must include: categoryHint, price, quantity, who_made, when_made, is_supply

Seller notes:
- title: ${String(details.title || '').trim()}
- description: ${String(details.description || '').trim()}`;

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

    const responseSchema: any = images.length
      ? {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageAltTexts: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedBasics: basicsSchema,
          },
          required: ['title', 'description', 'tags', 'imageAltTexts', 'suggestedBasics'],
        }
      : {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            suggestedBasics: basicsSchema,
          },
          required: ['title', 'description', 'tags', 'suggestedBasics'],
        };

    const contents: any = images.length
      ? [
          {
            role: 'user',
            parts: [
              { text: imageAwarePrompt },
              ...images.map((img) => ({
                inlineData: {
                  mimeType: img.mimeType || 'image/jpeg',
                  data: img.data,
                },
              })),
            ],
          },
        ]
      : textOnlyPrompt;

    let response: GenerateContentResponse;
    try {
      response = await ai.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema,
        },
      });
    } catch (primaryErr: any) {
      console.error('Primary image-aware generation failed, falling back to text-only:', primaryErr?.message || primaryErr);
      response = await ai.models.generateContent({
        model,
        contents: textOnlyPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              tags: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedBasics: basicsSchema,
            },
            required: ['title', 'description', 'tags', 'suggestedBasics'],
          },
        },
      });
    }

    const parsed = JSON.parse(response.text || '{}');

    const title = String(parsed.title || details.title || '').trim().slice(0, 140);
    const description = String(parsed.description || details.description || '').trim();
    const tags = Array.isArray(parsed.tags)
      ? [...new Set(parsed.tags.map((t: any) => String(t || '').trim()).filter(Boolean))]
          .map((t) => t.slice(0, 20))
          .slice(0, 13)
      : [];

    const imageAltTexts = Array.isArray(parsed.imageAltTexts)
      ? parsed.imageAltTexts.map((a: any) => String(a || '').trim().slice(0, 140))
      : undefined;

    const suggested = parsed?.suggestedBasics || {};
    const suggestedBasics = {
      categoryHint: String(suggested.categoryHint || '').trim(),
      price: Number.isFinite(Number(suggested.price)) ? Number(suggested.price) : 29.99,
      quantity: Number.isFinite(Number(suggested.quantity)) ? Math.max(1, Math.floor(Number(suggested.quantity))) : 1,
      who_made: ['i_did', 'collective', 'someone_else'].includes(String(suggested.who_made))
        ? String(suggested.who_made)
        : 'i_did',
      when_made: ['made_to_order', '2020_2024', '2010_2019', 'before_2010'].includes(String(suggested.when_made))
        ? String(suggested.when_made)
        : 'made_to_order',
      is_supply: Boolean(suggested.is_supply),
    };

    return res.status(200).json({ title, description, tags, imageAltTexts, suggestedBasics });
  } catch (error: any) {
    console.error('Error in metadata generation endpoint:', error?.message || error, error?.stack || '');
    return res.status(500).json({ error: error?.message || 'An unexpected error occurred while generating metadata.' });
  }
}
