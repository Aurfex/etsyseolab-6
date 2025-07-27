import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// This function simulates a security middleware that would run before the main endpoint logic.
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
         return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    return { authorized: true };
};


export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };
    
    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }
    
    try {
        const { details } = await req.json() as { details: { title: string, description: string } };
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
        }
        
        if (!details || !details.title) {
            return new Response(JSON.stringify({ error: 'Invalid product details provided.' }), { status: 400, headers });
        }

        const ai = new GoogleGenAI({ apiKey });
        const model = 'gemini-2.5-flash';

        const generateTitle = async (keywords: string): Promise<string> => {
            const prompt = `
        Create an Etsy product title optimized for SEO with these keywords: ${keywords}.
        Rules:
        - Max length: 140 characters
        - Include primary keyword at start
        - Use attractive, descriptive language
        - Do NOT use quotes or special characters
        - Example format: "14K Gold Minimalist Engagement Ring – Handmade Jewelry Gift"
        `;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt });
            return response.text.trim().slice(0, 140);
        };

        const generateDescription = async (descDetails: { title: string, description: string }): Promise<string> => {
            const prompt = `
        Write an Etsy product description optimized for SEO using these details:
        Title: ${descDetails.title}
        Initial Idea: ${descDetails.description}
        Rules:
        - Start with a keyword-rich summary in 1–2 sentences
        - Add bullet points for features (size, material, personalization)
        - Include LSI keywords naturally
        - End with a friendly call-to-action
        - Keep tone natural, Etsy-friendly, and persuasive
        `;
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt });
            return response.text.trim();
        };

        const generateTags = async (tagDetails: { title: string, description: string }): Promise<string[]> => {
            const prompt = `
        Generate up to 13 Etsy tags for this product based on details:
        Title: ${tagDetails.title}
        Description: ${tagDetails.description}
        Rules:
        - Each tag max 20 characters
        - No duplicates
        - Cover variations, occasions, materials, and styles
        - Prioritize Etsy trending search phrases
        Return as a JSON array of strings.
        `;
            const responseSchema = { type: Type.OBJECT, properties: { tags: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["tags"] };
            const response: GenerateContentResponse = await ai.models.generateContent({ model, contents: prompt, config: { responseMimeType: "application/json", responseSchema } });
            const jsonResponse = JSON.parse(response.text);
            return (jsonResponse.tags || []).map((tag: string) => tag.slice(0, 20)).slice(0, 13);
        };


        const [newTitle, newDescription, newTags] = await Promise.all([
            generateTitle(details.title),
            generateDescription(details),
            generateTags(details)
        ]);

        const result = {
            title: newTitle,
            description: newDescription,
            tags: newTags,
        };

        return new Response(JSON.stringify(result), { status: 200, headers });

    } catch (error) {
        console.error("Error in metadata generation endpoint:", error);
        return new Response(JSON.stringify({ error: 'An unexpected error occurred while generating metadata.' }), { status: 500, headers });
    }
}