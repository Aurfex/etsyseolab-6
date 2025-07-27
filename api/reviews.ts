import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { Review, ReviewResponse } from '../types';
import * as db from './services/databaseService';
import * as etsyService from './services/etsyService';
import * as notificationService from './services/notificationService';

// This function simulates a security middleware that would run before the main endpoint logic.
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    // In a real app, you would use a library like 'jsonwebtoken' to verify the token's signature and expiration.
    // Here, we just check for its presence.
    const token = authHeader.split(' ')[1];
    if (!token) {
         return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    return { authorized: true };
};


const generateAiResponse = async (review: Review, apiKey: string): Promise<Omit<ReviewResponse, 'reviewId' | 'status' | 'lastUpdated'>> => {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';
    
    const prompt = `You are a customer service manager for a high-quality handmade jewelry shop named 'dxbJewellery'. Your tone is professional, empathetic, and friendly.
A customer left the following review for the product "${review.productTitle}":
- Customer: ${review.customerName}
- Rating: ${review.rating} out of 5 stars
- Review Language: ${review.language === 'fa' ? 'Farsi' : 'English'}
- Review: "${review.reviewText}"

Your task is to:
1. Analyze the sentiment of the review ('positive', 'neutral', 'negative', or 'mixed').
2. Write a personalized and helpful reply IN THE SAME LANGUAGE AS THE REVIEW.
    - If positive (4-5 stars): Thank the customer warmly and mention a specific detail from their review if possible.
    - If neutral (3 stars): Thank them for their feedback, acknowledge their points (e.g., "smaller than expected"), and maintain a positive and helpful tone.
    - If negative (1-2 stars): Apologize sincerely for their negative experience, show empathy, and offer a solution (e.g., "Please contact us directly at [email] so we can make this right..."). Do not be defensive.

Return the result as a JSON object.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            sentiment: {
                type: Type.STRING,
                enum: ['positive', 'neutral', 'negative', 'mixed'],
                description: "The sentiment of the customer's review."
            },
            responseText: {
                type: Type.STRING,
                description: "The generated response to the customer's review in the same language as the review."
            }
        },
        required: ["sentiment", "responseText"]
    };

    const response: GenerateContentResponse = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.5,
        }
    });
    
    const parsed = JSON.parse(response.text);
    return {
        ...parsed,
        generatedResponseText: parsed.responseText, // Save original
    };
};


export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    // --- Authentication Check ---
    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) {
        return authCheck.error!;
    }

    // --- GET Request Handling ---
    if (req.method === 'GET') {
        try {
            const data = await db.getFullReviewData();
            return new Response(JSON.stringify(data), { headers, status: 200 });
        } catch(error) {
            console.error("Error in GET /api/reviews:", error);
            return new Response(JSON.stringify({ error: 'An unexpected error occurred while fetching reviews.' }), { status: 500, headers });
        }
    }

    // --- POST Request Handling (for all write operations) ---
    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { action, reviewId, payload } = body;

            switch (action) {
                case 'generate_response': {
                    const apiKey = process.env.API_KEY;
                    if (!apiKey) {
                        return new Response(JSON.stringify({ error: 'Server is not configured with an API key.' }), { status: 500, headers });
                    }
                    const review = await db.getReviewById(reviewId);
                    if (!review) return new Response(JSON.stringify({ error: 'Review not found.' }), { status: 404, headers });
                    
                    const aiResult = await generateAiResponse(review, apiKey);
                    const newResponse = await db.createOrUpdateResponse(review.id, aiResult);
                    await db.addAuditLog(review.id, 'AI Response Generated', `Sentiment: ${newResponse.sentiment}.`, 'System (AI)');
                    
                    // Trigger notification for flagged reviews
                    if (review.isFlagged) {
                        await notificationService.sendSlackAlert(`New AI response generated for a flagged review (ID: ${review.id}) from ${review.customerName}. Please review.`);
                        await db.addAuditLog(review.id, 'Notification Sent', `Slack alert sent for flagged review.`, 'System (Automation)');
                    }

                    return new Response(JSON.stringify(newResponse), { status: 201, headers });
                }

                case 'update_status': {
                    const { status } = payload;
                    const updatedResponse = await db.updateResponseStatus(reviewId, status);
                    await db.addAuditLog(reviewId, 'Status Changed', `Status set to ${status}.`);

                    if (status === 'posting') {
                        // This is an async operation that doesn't block the response
                        etsyService.postReply(reviewId, updatedResponse.responseText).then(async (success) => {
                            const finalStatus = success ? 'posted' : 'failed_to_post';
                            await db.updateResponseStatus(reviewId, finalStatus);
                            const logAction = success ? 'Etsy Post Succeeded' : 'Etsy Post Failed';
                            const logDetails = success ? 'Reply successfully posted to Etsy.' : 'Failed to post reply to Etsy via API.';
                             await db.addAuditLog(reviewId, logAction, logDetails, 'System (Etsy API)');
                        });
                    }
                    
                    return new Response(JSON.stringify(updatedResponse), { status: 200, headers });
                }

                case 'update_text': {
                    const { responseText } = payload;
                    const updatedResponse = await db.updateResponseText(reviewId, responseText);
                    await db.addAuditLog(reviewId, 'Response Edited', `Response text was manually updated.`);
                    return new Response(JSON.stringify(updatedResponse), { status: 200, headers });
                }

                default:
                    return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400, headers });
            }

        } catch (error: any) {
            console.error("Error in POST /api/reviews:", error);
            return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
}