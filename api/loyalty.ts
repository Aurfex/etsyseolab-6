import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { LoyaltyData, LoyaltyStatus, Reward, AIRecommendedReward, LoyaltyActivity } from '../types';

// --- In-memory Database Simulation ---
let loyaltyStatusDb: LoyaltyStatus = {
    currentPoints: 1250,
    referralCode: 'REF-DXB-ADMIN',
    referrals: [
        { name: 'Alice', status: 'first_purchase' },
        { name: 'Bob', status: 'signed_up' },
    ],
    history: [
        { id: 'act_1', type: 'purchase', tKey: 'loyalty_activity_tkey_purchase', tKeyOptions: { orderId: 78912 }, points: 500, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
        { id: 'act_2', type: 'referral_purchase', tKey: 'loyalty_activity_tkey_referral_purchase', tKeyOptions: { name: 'Alice' }, points: 1000, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { id: 'act_3', type: 'referral_signup', tKey: 'loyalty_activity_tkey_referral_signup', tKeyOptions: { name: 'Bob' }, points: 100, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
        { id: 'act_4', type: 'review_left', tKey: 'loyalty_activity_tkey_review_left', points: 150, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    ],
    availableRewards: [
        { id: 'rew_1', tKey: 'loyalty_reward_tkey_10_percent', pointsRequired: 1000, discountPercentage: 10 },
        { id: 'rew_2', tKey: 'loyalty_reward_tkey_free_shipping', pointsRequired: 2000, freeShipping: true },
        { id: 'rew_3', tKey: 'loyalty_reward_tkey_20_percent', pointsRequired: 3500, discountPercentage: 20 },
    ],
};

// --- Security Middleware (Simulated) ---
const verifyAuth = (req: Request): { authorized: boolean; error?: Response } => {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { authorized: false, error: new Response(JSON.stringify({ error: 'Unauthorized: Missing or invalid token.' }), { status: 401, headers: { 'Content-Type': 'application/json' } }) };
    }
    return { authorized: true };
};

// --- Gemini AI Service ---
const getAiRecommendation = async (status: LoyaltyStatus, apiKey: string): Promise<AIRecommendedReward | null> => {
    if (!apiKey) return null;

    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-2.5-flash';

    const rewardsListForPrompt = status.availableRewards.map(r => `- ${r.tKey} (ID: ${r.id}, Cost: ${r.pointsRequired} points)`).join('\n');
    const historySummary = status.history.slice(0, 3).map(h => `- ${h.tKey} (${h.points} pts)`).join('\n');

    const prompt = `You are a marketing AI for a jewelry store. Your goal is to encourage a user to redeem their loyalty points.
Based on the user's current status, recommend the single best reward for them to redeem right now.

User Status:
- Current Points: ${status.currentPoints}
- Recent Activity:
${historySummary}
- Available Rewards:
${rewardsListForPrompt}

Your task is:
1.  Analyze the user's points. Find a reward they can afford but is also valuable. The best recommendation is often a reward they just became eligible for.
2.  Consider their recent activity. If they make many purchases, a discount is valuable.
3.  Choose the ONE best reward ID.
4.  Write a short, compelling reason why they should redeem it now. Make it personal. Example: "You just earned enough points for this! Treat yourself." or "Since you shop with us often, this discount will be very useful."

Return ONLY a JSON object with the following structure.
`;

    const responseSchema = {
        type: Type.OBJECT,
        properties: {
            recommendedRewardId: {
                type: Type.STRING,
                description: "The ID of the single best reward to recommend."
            },
            reason: {
                type: Type.STRING,
                description: "The short, compelling reason for the user to redeem this reward."
            }
        },
        required: ["recommendedRewardId", "reason"]
    };

    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema,
            }
        });
        
        const parsed = JSON.parse(response.text);
        const recommendedReward = status.availableRewards.find(r => r.id === parsed.recommendedRewardId);

        if (!recommendedReward) return null;

        return {
            reward: recommendedReward,
            reason: parsed.reason,
        };
    } catch (error) {
        console.error("Error getting AI recommendation:", error);
        return null;
    }
}

// --- Main Endpoint Logic ---
export default async function endpoint(req: Request): Promise<Response> {
    const headers = { 'Content-Type': 'application/json' };

    const authCheck = verifyAuth(req);
    if (!authCheck.authorized) return authCheck.error!;

    if (req.method === 'GET') {
        const apiKey = process.env.API_KEY;
        const aiRecommendation = await getAiRecommendation(loyaltyStatusDb, apiKey || '');
        const responseData: LoyaltyData = {
            status: loyaltyStatusDb,
            aiRecommendation
        };
        return new Response(JSON.stringify(responseData), { status: 200, headers });
    }

    if (req.method === 'POST') {
        try {
            const body = await req.json();
            const { action, payload } = body;

            if (action === 'redeem') {
                const { rewardId } = payload;
                const reward = loyaltyStatusDb.availableRewards.find(r => r.id === rewardId);

                if (!reward) {
                    return new Response(JSON.stringify({ error: "Reward not found." }), { status: 404, headers });
                }
                if (loyaltyStatusDb.currentPoints < reward.pointsRequired) {
                    return new Response(JSON.stringify({ error: "Not enough points." }), { status: 400, headers });
                }

                // Simulate DB update
                loyaltyStatusDb.currentPoints -= reward.pointsRequired;
                const newActivity: LoyaltyActivity = {
                    id: `act_${Date.now()}`,
                    type: 'purchase', // Simplified for log
                    tKey: 'log_loyalty_reward_redeemed',
                    tKeyOptions: { reward: reward.tKey },
                    points: -reward.pointsRequired,
                    timestamp: new Date(),
                }
                loyaltyStatusDb.history.unshift(newActivity);
                
                return new Response(JSON.stringify({ success: true, newPoints: loyaltyStatusDb.currentPoints }), { status: 200, headers });
            }

            return new Response(JSON.stringify({ error: 'Invalid action.' }), { status: 400, headers });

        } catch (error: any) {
            console.error("Error in POST /api/loyalty:", error);
            return new Response(JSON.stringify({ error: error.message || 'An unexpected error occurred.' }), { status: 500, headers });
        }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), { status: 405, headers });
}