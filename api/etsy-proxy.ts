import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// --- Helper Functions ---
const getEtsyHeaders = (token: string, apiKey: string) => ({
    'Authorization': `Bearer ${token}`,
    // 'x-api-key': apiKey, // Not needed or causes issues with Bearer token sometimes
    'Content-Type': 'application/json'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Get API Key and Secret from Environment
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
    const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;

    if (!ETSY_API_KEY || !ETSY_SHARED_SECRET) {
        return res.status(500).json({ error: 'Server configuration error: Missing ETSY_CLIENT_ID or ETSY_CLIENT_SECRET.' });
    }
    
    // Construct the combined API key for V3 access
    const xApiKey = `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}`;

    try {
        // --- GET Request: Fetch Listings ---
        if (req.method === 'GET' || (req.method === 'POST' && req.body.action === 'get_listings')) {
            console.log("📥 Fetching Etsy Listings...");

            // Use combined key in headers
            const headers = {
                'Authorization': `Bearer ${token}`,
                'x-api-key': xApiKey,
                'Content-Type': 'application/json'
            };

            // Step 1: Get User ID and Shop ID directly
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
            const userId = userResponse.data.user_id;
            let shopId = userResponse.data.shop_id;
            let shop: any = null;
            
            console.log(`👤 User ID: ${userId}, Shop ID: ${shopId}`);

            // Fallback: If shop_id wasn't in users/me, try to fetch it
            if (!shopId) {
                console.log("⚠️ Shop ID not found in user profile, fetching shops...");
                try {
                    const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
                    shop = shopResponse.data.shops?.[0];
                    if (shop) {
                        shopId = shop.shop_id;
                        console.log(`🏪 Found Shop via list: ${shopId}`);
                    }
                } catch (e) {
                    console.warn("Failed to fetch shop list:", e.message);
                }
            }
            
            if (!shopId) {
                return res.status(404).json({ 
                    error: `No Etsy shop found for user ${userId}.`,
                    debug_user_data: userResponse.data
                });
            }

            // Step 2: Fetch Shop Details (Optional, for debugging/UI)
            let shopDetails: any = {};
            try {
                const shopDetailsResponse = await axios.get(`https://openapi.etsy.com/v3/application/shops/${shopId}`, { headers });
                shopDetails = shopDetailsResponse.data;
            } catch (e) {
                console.warn("Failed to fetch shop details:", e.message);
            }

            // Step 3: Get Listings
            // We fetch ALL listings (no state filter) because 'active' filter hides Developer Mode listings
            let listingsResponse = await axios.get(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`, 
                { headers }
            );
            
            const rawListings = listingsResponse.data.results;
            const count = listingsResponse.data.count;
            console.log(`📦 Found ${count} listings. (Active Count in Shop: ${shopDetails.listing_active_count})`);

            // Step 4: Format for Frontend
            const formattedProducts = rawListings.map((listing: any) => {
                // Robust image extraction
                let img = '';
                if (listing.images && listing.images.length > 0) {
                    img = listing.images[0].url_fullxfull || listing.images[0].url_570xN || '';
                } else if (listing.Images && listing.Images.length > 0) {
                    // Sometimes Etsy returns capitalized 'Images'
                    img = listing.Images[0].url_fullxfull || listing.Images[0].url_570xN || '';
                }

                return {
                    id: listing.listing_id.toString(),
                    title: listing.title,
                    description: listing.description,
                    price: listing.price.amount / listing.price.divisor,
                    currency: listing.price.currency_code,
                    quantity: listing.quantity,
                    tags: listing.tags || [],
                    url: listing.url,
                    imageUrl: img || 'https://via.placeholder.com/400x300?text=No+Image',
                    seoScore: Math.floor(Math.random() * 40) + 50, // Mock SEO Score
                    views: listing.views,
                    num_favorers: listing.num_favorers
                };
            });

            return res.status(200).json({ 
                products: formattedProducts,
                shop: {
                    id: shopId,
                    name: shopDetails.shop_name || shop?.shop_name || `Shop ${shopId}`,
                    url: shopDetails.url || shop?.url || '',
                    active_count: shopDetails.listing_active_count
                }
            });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error: any) {
        console.error("❌ Etsy API Error:", error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({ 
            error: error.response?.data?.error || error.message,
            details: error.response?.data 
        });
    }
}