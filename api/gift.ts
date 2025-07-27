import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Product, GiftFinderResponse, GiftFinderQuiz, RecommendedProduct } from '../types';
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


const findGiftRecommendations = async (quiz: GiftFinderQuiz, products: Product[], apiKey: string): Promise<GiftFinderResponse> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    const productListForPrompt = products.map(p => `- ${p.title} (ID: ${p.id}, Tags: ${p.tags.join(', ')}, Description: ${p.description})`).join('\n');
    
    const prompt = `You are an expert gift recommender for a handmade jewelry store called 'dxbJewellery'.
Your task is to find the perfect gift based on the following criteria:
- Occasion: ${quiz.occasion}
- Recipient: ${quiz.recipient}
- Budget: ${quiz.budget} (Interpret this as a soft preference, not a hard filter)
- Preferred Style: ${quiz.style}

Here is a list of available products:
${productListForPrompt}

Based on the criteria, please perform the following steps:
1.  Analyze the criteria to understand the user's needs. For example, an 'Anniversary' gift for a 'Partner' should be romantic, while a 'Birthday' gift for a 'Friend' can be more fun and trendy. 'Minimalist' style prefers delicate items, 'Statement' prefers bold ones.
2.  Select up to 3 of the most suitable product IDs from the list above that best match the user's request. For each product, provide a short, specific reason why it's a great choice.
3.  Write a friendly, encouraging, and personalized general response to the user explaining your approach. For example: "For an anniversary, something timeless is always a great choice. I've found a few items that match the classic style you're looking for."
4.  If you cannot find any good matches, respond with a polite message suggesting they try different options, and return an empty array of recommendations.

Return ONLY a JSON object with the following structure. Do not add any other text, just the JSON.
`;
    
    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            recommendations: {
                type: Type.ARRAY,
                description: "An array of up to 3 product recommendations.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        productId: {
                            type: Type.STRING,
                            description: "The ID of the recommended product."
                        },
                        reason: {
                            type: Type.STRING,
                            description: "A short, personalized reason why this specific product is a good gift choice based on the quiz."
                        }
                    },
                    required: ["productId", "reason"]
                }
            },
            responseText: {
                type: Type.STRING,
                description: "The complete, natural language response to say back to the user, explaining the choices in general."
            }
        },
        required: ["recommendations", "responseText"]
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 0.5,
        }
    });

    const parsed = JSON.parse(response.text);
    
    const foundProducts: RecommendedProduct[] = parsed.recommendations.map((rec: { productId: string, reason: string }) => {
        const product = products.find(p => p.id === rec.productId);
        if (!product) return null;
        return {
            ...product,
            reason: rec.reason,
        };
    }).filter(Boolean); // Filter out nulls
    
    return {
        responseText: parsed.responseText,
        products: foundProducts
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
        const { quiz } = await req.json();
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
        }

        if (!quiz || !quiz.occasion || !quiz.recipient || !quiz.budget || !quiz.style) {
            return new Response(JSON.stringify({ error: 'Quiz data is incomplete.' }), { status: 400, headers });
        }
        const result = await findGiftRecommendations(quiz, MOCK_PRODUCTS, apiKey);
        return new Response(JSON.stringify(result), { status: 200, headers });
    } catch (error: any) {
        console.error("Error in POST /api/gift:", error);
        return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
    }
}