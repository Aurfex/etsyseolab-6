import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Get API Key and Secret
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
    const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;

    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing ETSY_CLIENT_ID.' });
    }

    // Construct the combined API key (REQUIRED based on your logs)
    // If secret is missing, it falls back to just ID, but ideally both are needed if the error says so.
    const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;

    const headers = {
        'Authorization': `Bearer ${token}`,
        'x-api-key': xApiKey,
        'Content-Type': 'application/json'
    };

    try {
        if (req.method === 'GET' || (req.method === 'POST' && req.body.action === 'get_listings')) {
            console.log("📥 Fetching Etsy Listings (With Secret)...");

            // Step 1: Get User & Shop
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
            const userId = userResponse.data.user_id;
            let shopId = userResponse.data.shop_id;

            if (!shopId) {
                const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
                if (shopResponse.data.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
            }

            if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

            // Step 2: Get Listings
            const listingsResponse = await axios.get(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`, 
                { headers }
            );

            // Step 3: Format
            const formattedProducts = listingsResponse.data.results.map((listing: any) => {
                let img = '';
                if (listing.images?.[0]) img = listing.images[0].url_fullxfull || listing.images[0].url_570xN;
                else if (listing.Images?.[0]) img = listing.Images[0].url_fullxfull || listing.Images[0].url_570xN;

                return {
                    id: listing.listing_id.toString(),
                    listing_id: listing.listing_id.toString(),
                    title: listing.title,
                    description: listing.description,
                    price: listing.price.amount / listing.price.divisor,
                    currency: listing.price.currency_code,
                    quantity: listing.quantity,
                    tags: listing.tags || [],
                    url: listing.url,
                    imageUrl: img || 'https://via.placeholder.com/400x300',
                    seoScore: Math.floor(Math.random() * 40) + 50,
                    views: listing.views,
                    num_favorers: listing.num_favorers
                };
            });

            return res.status(200).json({ products: formattedProducts, shop: { id: shopId } });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error: any) {
        console.error("❌ Etsy API Error:", error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({ error: error.message });
    }
}
