import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// --- Helper Functions ---
const getEtsyHeaders = (token: string, apiKey: string) => ({
    'Authorization': `Bearer ${token}`,
    // 'x-api-key': apiKey, // Try removing this to avoid "Shared secret required" error
    'Content-Type': 'application/json'
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 1. Verify Auth Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Get API Key from Environment
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID; // In V3, Client ID is the API Key
    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing ETSY_CLIENT_ID.' });
    }
    
    console.log(`🔑 Using API Key (Start): ${ETSY_API_KEY.substring(0, 4)}...`);

    try {
        // --- GET Request: Fetch Listings ---
        if (req.method === 'GET' || (req.method === 'POST' && req.body.action === 'get_listings')) {
            console.log("📥 Fetching Etsy Listings...");

            // Step 1: Get User ID
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
                headers: getEtsyHeaders(token, ETSY_API_KEY)
            });
            const userId = userResponse.data.user_id;
            console.log(`👤 User ID found: ${userId}`);

            // Step 2: Get Shop ID
            const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, {
                headers: getEtsyHeaders(token, ETSY_API_KEY)
            });
            const shop = shopResponse.data.shops?.[0]; // Get the first shop
            
            if (!shop) {
                return res.status(404).json({ error: 'No Etsy shop found for this user.' });
            }
            const shopId = shop.shop_id;
            console.log(`🏪 Shop ID found: ${shopId} (${shop.shop_name})`);

            // Step 3: Get Active Listings (including images)
            const listingsResponse = await axios.get(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/active?includes=Images`, 
                { headers: getEtsyHeaders(token, ETSY_API_KEY) }
            );
            
            const rawListings = listingsResponse.data.results;
            console.log(`📦 Found ${listingsResponse.data.count} listings.`);

            // Step 4: Format for Frontend
            const formattedProducts = rawListings.map((listing: any) => ({
                id: listing.listing_id.toString(),
                title: listing.title,
                description: listing.description,
                price: listing.price.amount / listing.price.divisor,
                currency: listing.price.currency_code,
                quantity: listing.quantity,
                tags: listing.tags || [],
                url: listing.url,
                // Get the first image URL (full size)
                imageUrl: listing.images?.[0]?.url_fullxfull || '', 
                seoScore: Math.floor(Math.random() * 40) + 50, // Mock SEO Score for now (50-90)
                views: listing.views,
                num_favorers: listing.num_favorers
            }));

            return res.status(200).json({ 
                products: formattedProducts,
                shop: {
                    id: shopId,
                    name: shop.shop_name,
                    url: shop.url
                }
            });
        }

        // --- POST Request: Create Listing / Upload Image ---
        if (req.method === 'POST') {
            const { action, payload } = req.body;

            // TODO: Implement Create Listing logic properly with user's shop ID
            // For now, let's focus on GET listings first.
            if (action === 'create_listing') {
                return res.status(501).json({ error: 'Create listing not yet implemented in new proxy.' });
            }
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