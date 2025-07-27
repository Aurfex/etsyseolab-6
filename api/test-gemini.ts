import { GoogleGenAI } from "@google/genai";

export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };
    if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
    }

    try {
        const { apiKey } = await req.json();
        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key is missing.' }), { status: 400, headers });
        }

        const ai = new GoogleGenAI({ apiKey });
        
        // Use a simple, low-cost call to test the API key.
        await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: 'test',
        });

        return new Response(JSON.stringify({ success: true, message: 'Gemini API key is valid.' }), { status: 200, headers });

    } catch (error: any) {
        console.error("Gemini API test failed:", error);
        
        let errorMessage = 'An unknown error occurred.';
        if (error.message && error.message.includes('API key not valid')) {
            errorMessage = 'The provided API key is not valid. Please check and try again.';
        } else if (error.message) {
            errorMessage = `Connection failed: ${error.message}`;
        }
        
        return new Response(JSON.stringify({ success: false, error: errorMessage }), { status: 400, headers });
    }
}