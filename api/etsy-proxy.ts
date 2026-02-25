import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

// --- Helper Functions ---
const getEtsyHeaders = (token: string, apiKey: string) => ({
    'Authorization': `Bearer ${token}`,
    'x-api-key': apiKey, // Just CLIENT_ID for v3
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
    const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;

    if (!ETSY_API_KEY) {
        return res.status(500).json({ error: 'Server configuration error: Missing ETSY_CLIENT_ID.' });
    }
    
    // For V3 calls, x-api-key is usually just the CLIENT_ID
    const xApiKey = ETSY_API_KEY;

    try {
        const headers = getEtsyHeaders(token, xApiKey);

        // --- GET Request: Fetch Listings ---
        if (req.method === 'GET' || (req.method === 'POST' && req.body.action === 'get_listings')) {
            console.log("📥 Fetching Etsy Listings...");

            // Step 1: Get User ID and Shop ID
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
            const userId = userResponse.data.user_id;
            let shopId = userResponse.data.shop_id;
            
            console.log(`👤 User ID: ${userId}, Shop ID: ${shopId}`);

            if (!shopId) {
                console.log("⚠️ Shop ID not found in user profile, fetching shops...");
                try {
                    const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
                    const shop = shopResponse.data.shops?.[0];
                    if (shop) shopId = shop.shop_id;
                } catch (e) {
                    console.warn("Failed to fetch shop list:", e.message);
                }
            }
            
            if (!shopId) return res.status(404).json({ error: `No Etsy shop found for user ${userId}.` });

            // Step 2: Get Listings
            let listingsResponse = await axios.get(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`, 
                { headers }
            );
            
            const rawListings = listingsResponse.data.results;
            const count = listingsResponse.data.count;
            console.log(`📦 Found ${count} listings.`);

            // Step 3: Format for Frontend
            const formattedProducts = rawListings.map((listing: any) => {
                let img = '';
                if (listing.images && listing.images.length > 0) {
                    img = listing.images[0].url_fullxfull || listing.images[0].url_570xN || '';
                } else if (listing.Images && listing.Images.length > 0) {
                    img = listing.Images[0].url_fullxfull || listing.Images[0].url_570xN || '';
                }

                return {
                    id: listing.listing_id.toString(),
                    listing_id: listing.listing_id.toString(), // Explicitly include listing_id
                    title: listing.title,
                    description: listing.description,
                    price: listing.price.amount / listing.price.divisor,
                    currency: listing.price.currency_code,
                    quantity: listing.quantity,
                    tags: listing.tags || [],
                    url: listing.url,
                    imageUrl: img || 'https://via.placeholder.com/400x300?text=No+Image',
                    seoScore: Math.floor(Math.random() * 40) + 50,
                    views: listing.views,
                    num_favorers: listing.num_favorers
                };
            });

            return res.status(200).json({ 
                products: formattedProducts,
                shop: { id: shopId }
            });
        }

        // --- UPDATE Request: Update Listing ---
        if (req.method === 'POST' && req.body.action === 'update_listing') {
            const { listing_id, payload } = req.body;

            if (!listing_id || !payload) {
                console.error("❌ Missing listing_id or payload for update.");
                return res.status(400).json({ error: 'Missing listing_id or payload.' });
            }

            console.log(`📝 Updating Listing ID: ${listing_id}...`);

            // Need Shop ID first
            const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
            let shopId = userResponse.data.shop_id;
            if (!shopId) {
                 const userId = userResponse.data.user_id;
                 const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
                 if (shopResponse.data.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
            }

            if (!shopId) return res.status(404).json({ error: 'Shop ID not found.' });

            // Construct Update Payload
            const updateBody: any = {};
            if (payload.title) updateBody.title = payload.title;
            if (payload.description) updateBody.description = payload.description;
            if (payload.tags) updateBody.tags = payload.tags;

            console.log(`📤 Sending update to Etsy Shop ${shopId}:`, JSON.stringify(updateBody));

            const updateResponse = await axios.put(
                `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listing_id}`,
                updateBody,
                { headers }
            );

            console.log("✅ Etsy Update Success:", updateResponse.status);
            return res.status(200).json({ success: true, data: updateResponse.data });
        }

        return res.status(405).json({ error: 'Method Not Allowed' });

    } catch (error: any) {
        console.error("❌ Etsy API Error:", error.response?.data || error.message);
        if (error.response?.data) {
             console.error("Details:", JSON.stringify(error.response.data, null, 2));
        }
        return res.status(error.response?.status || 500).json({ 
            error: error.response?.data?.error || error.message,
            details: error.response?.data 
        });
    }
}
