import { GoogleGenAI, GenerateContentResponse, Type } from '@google/genai';

const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    };
  }
  return { authorized: true };
};

type VisionImageInput = {
  mimeType: string;
  data: string;
};

export default async function endpoint(req: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };

  const authCheck = verifyAuth(req);
  if (!authCheck.authorized) return authCheck.error!;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
  }

  try {
    const body = (await req.json()) as { details?: { title?: string; description?: string }; images?: VisionImageInput[] };
    const details = body?.details || {};
    const images = Array.isArray(body?.images) ? body.images.slice(0, 5) : [];

    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
    }

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const imageAwarePrompt = `You are an Etsy SEO expert.
Generate optimized metadata for an Etsy listing using provided images and optional seller notes.

Rules:
- Return STRICT JSON with keys: title, description, tags, imageAltTexts
- title: <= 140 chars
- tags: array up to 13 unique tags, each <= 20 chars
- imageAltTexts: provide one alt text per image, each <= 140 chars
- description: persuasive, natural, include materials/style/use-cases inferred from images
- Avoid fluff and avoid fake claims. If unsure, stay generic and safe.

Seller notes:
- current title idea: ${String(details.title || '').trim() || 'N/A'}
- current description idea: ${String(details.description || '').trim() || 'N/A'}`;

    const textOnlyPrompt = `Create Etsy SEO metadata from seller notes.
Rules:
- Return STRICT JSON with keys: title, description, tags
- title <= 140 chars
- tags: max 13, each <= 20 chars, no duplicates

Seller notes:
- title: ${String(details.title || '').trim()}
- description: ${String(details.description || '').trim()}`;

    const responseSchema: any = images.length
      ? {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            imageAltTexts: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'description', 'tags', 'imageAltTexts'],
        }
      : {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['title', 'description', 'tags'],
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

    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });

    const parsed = JSON.parse(response.text || '{}');

    const title = String(parsed.title || details.title || '').trim().slice(0, 140);
    const description = String(parsed.description || details.description || '').trim();
    const tags = Array.isArray(parsed.tags)
      ? [...new Set(parsed.tags.map((t: any) => String(t || '').trim()).filter(Boolean))].map((t) => t.slice(0, 20)).slice(0, 13)
      : [];

    const imageAltTexts = Array.isArray(parsed.imageAltTexts)
      ? parsed.imageAltTexts.map((a: any) => String(a || '').trim().slice(0, 140))
      : undefined;

    return new Response(JSON.stringify({ title, description, tags, imageAltTexts }), { status: 200, headers });
  } catch (error) {
    console.error('Error in metadata generation endpoint:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred while generating metadata.' }), {
      status: 500,
      headers,
    });
  }
}
