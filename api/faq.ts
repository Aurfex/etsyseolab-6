import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { FAQ, SuggestedQuestion } from '../types';
import { MOCK_SUGGESTED_QUESTIONS } from '../utils/mockFaqs';

// --- In-memory Database Simulation ---
let faqsDb: FAQ[] = [];
let suggestionsDb: SuggestedQuestion[] = [];
let nextSuggId = 1;

// --- Security Middleware (Simulated) ---
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    return { authorized: true };
};

// --- Gemini AI Service ---
const generateFaqAnswerAI = async (question: string, apiKey: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const prompt = `You are a helpful and professional customer support assistant for a handmade jewelry store called 'dxbJewellery'.
A customer is asking the following question: "${question}"

Generate a clear, concise, and friendly answer suitable for an FAQ page.
- Start with a direct answer.
- If applicable, provide details or steps.
- Maintain a positive and helpful tone.
- Keep the answer focused on the question.
- Do not greet the user or sign off. Just provide the answer text.`;

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: { temperature: 0.6 }
    });

    return response.text.trim();
};


// --- Main Endpoint Logic ---
export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method === 'GET') {
        return new Response(JSON.stringify({ faqs: faqsDb, suggestedQuestions: suggestionsDb }), { headers, status: 200 });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { action, payload } = body;

            switch (action) {
                case 'scan_for_questions': {
                    // In a real app, this would scan a database of messages.
                    // Here, we simulate by adding mock questions if they don't already exist as a suggestion or published FAQ.
                    const existingQuestions = new Set([...faqsDb.map(f => f.question), ...suggestionsDb.map(s => s.questionText)]);
                    MOCK_SUGGESTED_QUESTIONS.forEach(mockSugg => {
                        if (!existingQuestions.has(mockSugg.questionText)) {
                            suggestionsDb.push({ ...mockSugg, id: `sugg_${nextSuggId++}` });
                        }
                    });
                    return new Response(JSON.stringify({ success: true, newCount: suggestionsDb.length }), { status: 200, headers });
                }

                case 'generate_answer': {
                    const apiKey = process.env.API_KEY;
                    if (!apiKey) {
                        return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
                    }
                    const { questionText } = payload;
                    const answer = await generateFaqAnswerAI(questionText, apiKey);
                    return new Response(JSON.stringify({ answer }), { status: 200, headers });
                }

                case 'publish_faq': {
                    const { suggestionId, question, answer } = payload;
                    const newFaq: FAQ = {
                        id: `faq_${Date.now()}`,
                        question,
                        answer,
                        status: 'published',
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    };
                    faqsDb.unshift(newFaq);
                    // Remove from suggestions
                    suggestionsDb = suggestionsDb.filter(s => s.id !== suggestionId);
                    return new Response(JSON.stringify(newFaq), { status: 201, headers });
                }
                
                case 'update_faq': {
                    const { faqId, question, answer } = payload;
                    faqsDb = faqsDb.map(f => f.id === faqId ? { ...f, question, answer, updatedAt: new Date() } : f);
                    const updatedFaq = faqsDb.find(f => f.id === faqId);
                    return new Response(JSON.stringify(updatedFaq), { status: 200, headers });
                }
                
                case 'delete_faq': {
                    const { faqId } = payload;
                    faqsDb = faqsDb.filter(f => f.id !== faqId);
                    return new Response(JSON.stringify({ success: true }), { status: 200, headers });
                }

                default:
                    return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400, headers });
            }

        } catch (error: any) {
            console.error("Error in POST /api/faq:", error);
            return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
}