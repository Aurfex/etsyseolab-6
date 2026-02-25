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

        // Update Body
        const updateBody: any = {};
        if (payload.title) updateBody.title = payload.title;
        if (payload.description) updateBody.description = payload.description;
        if (payload.tags) updateBody.tags = payload.tags;

        console.log(`📤 Sending PUT to Etsy...`);

        const updateResponse = await axios.put(
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
            return res.status(error.response.status).json({ 
                error: error.response.data.error || 'Etsy API Error', 
                details: error.response.data 
            });
        }
        return res.status(500).json({ error: error.message });
    }
}
