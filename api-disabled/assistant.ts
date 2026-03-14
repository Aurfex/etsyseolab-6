import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Product, AssistantResponse } from '../types';
import { MOCK_PRODUCTS } from '../utils/mockData';

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


const interpretQuery = async (query: string, products: Product[], apiKey: string): Promise<AssistantResponse> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const productListForPrompt = products.map(p => `- ${p.title} (ID: ${p.id}, Tags: ${p.tags.join(', ')})`).join('\n');
    
    const prompt = `You are a shopping assistant for a handmade jewelry store.
Your name is Optimo. You are friendly, helpful, and concise.
You can answer general questions about the store (shipping, materials, etc.) or help find products.

Here is a list of available products:
${productListForPrompt}

The user said: "${query}"

Your task is to:
1.  Determine the user's intent: is it a 'product_search' or a 'general_question'?
2.  If it's a 'product_search', identify relevant product IDs from the list. The search should be fuzzy. For example, if the user asks for "gold rings", you should find products with "gold" and "ring" in their title or tags. Match materials, product types, styles.
3.  If it's a 'general_question', formulate a helpful answer. Assume standard store policies (e.g., "shipping takes 3-5 business days", "we use high-quality, hypoallergenic materials").
4.  Formulate a single, natural language response to the user.
    - If finding products, say something like "I found a few items for you:" or "Here is a beautiful piece you might like:".
    - If not finding products, say "I'm sorry, I couldn't find anything like that. Maybe try describing it differently?".
    - If answering a question, just provide the answer.

Return ONLY a JSON object with the following structure. Do not add any other text.
`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            intent: {
                type: Type.STRING,
                enum: ['product_search', 'general_question']
            },
            matchingProductIds: {
                type: Type.ARRAY,
                description: "An array of product IDs that match the user's search query. Should be empty if intent is 'general_question' or no products match.",
                items: { type: Type.STRING }
            },
            responseText: {
                type: Type.STRING,
                description: "The complete, natural language response to say back to the user."
            }
        },
        required: ["intent", "matchingProductIds", "responseText"]
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.3,
        }
    });

    const parsed = JSON.parse(response.text);
    
    const foundProducts = products.filter(p => parsed.matchingProductIds.includes(p.id));
    
    return {
        responseText: parsed.responseText,
        products: foundProducts.length > 0 ? foundProducts : undefined
    };
}


export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    try {
        const { query } = await req.json();
        const apiKey = process.env.API_KEY;
        
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
        }

        if (!query) {
            return new Response(JSON.stringify({ error: 'Query is missing.' }), { status: 400, headers });
        }
        const result = await interpretQuery(query, MOCK_PRODUCTS, apiKey);
        return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (error: any) {
        console.error("Error in POST /api/assistant:", error);
        return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
    }
}