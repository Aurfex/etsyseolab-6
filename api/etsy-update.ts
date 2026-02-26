import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    // 1. Auth
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const token = authHeader.split(' ')[1];
    
    // 2. Keys
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
    const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
    
    if (!ETSY_API_KEY) return res.status(500).json({ error: 'Server Config Error' });

    // Combine keys if secret exists (Critical Fix)
    const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-api-key': xApiKey,
        'Content-Type': 'application/json'
    };

    try {
        const { listing_id, payload } = req.body;
        console.log(`📝 START Update Listing ID: ${listing_id}`);

        // Get Shop ID
        let shopId;
        try {
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
            shopId = userResponse.data.shop_id;
            if (!shopId) {
                 const userId = userResponse.data.user_id;
                 const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
                 if (shopResponse.data.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
            }
        } catch (fetchError: any) {
            console.error("❌ Failed to fetch Shop ID for update:", fetchError.message);
            // If fetching shop ID fails, we can't proceed with update
            throw new Error(`Could not verify Shop ID: ${fetchError.response?.data?.error || fetchError.message}`);
        }

        if (!shopId) return res.status(404).json({ error: 'Shop ID not found' });

        console.log(`✅ Shop ID found: ${shopId}. Preparing update payload...`);

        // Update Body (partial, safe)
        const updateBody: any = {};
        if (payload?.title && typeof payload.title === 'string') {
            const trimmedTitle = payload.title.trim();
            updateBody.title = trimmedTitle.length > 140 ? trimmedTitle.slice(0, 140) : trimmedTitle;
        }
        if (payload?.description && typeof payload.description === 'string') updateBody.description = payload.description;
        if (Array.isArray(payload?.tags)) {
            updateBody.tags = payload.tags
                .map((t: string) => String(t).trim())
                .filter((t: string) => t.length > 0 && t.length <= 20)
                .slice(0, 13);
        }

        // No-op if nothing changed (prevents noisy failures)
        if (Object.keys(updateBody).length === 0) {
            return res.status(200).json({ success: true, skipped: true, reason: 'No fields to update.' });
        }

        console.log(`📤 Sending PATCH to Etsy with fields:`, Object.keys(updateBody));

        const updateResponse = await axios.patch(
            `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}`,
            updateBody,
            { headers }
        );

        console.log("✅ Etsy Update Response Status:", updateResponse.status);
        return res.status(200).json({ success: true, data: updateResponse.data });

    } catch (error: any) {
        console.error("❌ Update Request FAILED:", error.message);
        if (error.response) {
            console.error("❌ Etsy Response Data:", JSON.stringify(error.response.data, null, 2));
            const etsyData = error.response.data || {};
            const etsyMessage = etsyData.error || etsyData.error_description || etsyData.detail || 'Etsy API Error';
            return res.status(error.response.status).json({ 
                error: etsyMessage,
                details: etsyData
            });
        }
        return res.status(500).json({ error: error.message });
    }
}
