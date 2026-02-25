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
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
    
    if (!ETSY_API_KEY) return res.status(500).json({ error: 'Server Config Error' });

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-api-key': ETSY_API_KEY,
        'Content-Type': 'application/json'
    };

    try {
        const { listing_id, payload } = req.body;
        console.log(`📝 Updating Listing ID: ${listing_id}`);

        // Get Shop ID
        const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
        let shopId = userResponse.data.shop_id;
        if (!shopId) {
             const userId = userResponse.data.user_id;
             const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
             if (shopResponse.data.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
        }

        if (!shopId) return res.status(404).json({ error: 'Shop ID not found' });

        // Update Body
        const updateBody: any = {};
        if (payload.title) updateBody.title = payload.title;
        if (payload.description) updateBody.description = payload.description;
        if (payload.tags) updateBody.tags = payload.tags;

        const updateResponse = await axios.put(
            `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}`,
            updateBody,
            { headers }
        );

        return res.status(200).json({ success: true, data: updateResponse.data });

    } catch (error: any) {
        console.error("❌ Update Error:", error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({ error: error.message, details: error.response?.data });
    }
}
