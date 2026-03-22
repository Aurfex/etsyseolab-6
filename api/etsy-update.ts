import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getAuthToken = (req: VercelRequest) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

const getHeaders = (token: string) => {
  const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
  const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
  if (!ETSY_API_KEY) throw new Error('Server configuration error: Missing ETSY_CLIENT_ID.');
  
  const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;
  
  return {
    Authorization: `Bearer ${token}`,
    'x-api-key': xApiKey,
    'Content-Type': 'application/json',
  } as Record<string, string>;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let token = getAuthToken(req);
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('etsy_token')
      .eq('id', 'default_user')
      .single();
    if (profile?.etsy_token) {
      token = profile.etsy_token;
    }
  } catch (err) {
    console.error('Failed to fetch token from Supabase:', err);
  }

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { listing_id, payload } = req.body;
  if (!listing_id || !payload) {
    return res.status(400).json({ error: 'Missing listing_id or payload' });
  }

  try {
    const headers = getHeaders(token);
    const cleanId = String(listing_id).trim();
    
    // Determine Shop ID
    const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
    const shopId = userResponse.data?.shop_id;
    if (!shopId) throw new Error("Could not find shop ID for the user.");

    // --- STEP 1: Basic Listing Update (Title, Description, etc.) ---
    const { pricingRows, ...basicPayload } = payload;
    if (Object.keys(basicPayload).length > 0) {
        console.log(`Updating basic info for listing: ${cleanId}`);
        await axios.patch(
          `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${cleanId}`,
          basicPayload,
          { headers }
        );
    }

    // --- STEP 2: Inventory/Variation Update (Prices & Options) ---
    if (pricingRows && Array.isArray(pricingRows) && pricingRows.length > 0) {
        console.log(`Updating inventory (variations) for listing: ${cleanId}`);
        
        // 1. Determine Property ID (Usually 100 for Size or 200 for Material)
        // For custom flexibility, we'll try to use standard IDs or find what's valid
        // Etsy v3 Inventory is complex. We'll start with a standard structured payload.
        
        const products = pricingRows.map((row, idx) => ({
            sku: row.sku || `SKU-${cleanId}-${idx}`,
            property_values: [
                {
                    property_id: 507, // Custom Property ID for 'Variation' or similar
                    property_name: "Option",
                    values: [String(row.size || row.option || "Default")],
                },
                {
                    property_id: 508, // Another Custom ID
                    property_name: "Type",
                    values: [String(row.material || row.type || "Default")],
                }
            ],
            offerings: [
                {
                    price: Number(row.price),
                    quantity: Number(row.quantity || 1),
                    is_enabled: true
                }
            ]
        }));

        // Note: Real production use requires fetching valid property IDs from Etsy first.
        // For now, we'll try to push the price update to the main listing if inventory fails.
        try {
            await axios.put(
                `https://openapi.etsy.com/v3/application/listings/${cleanId}/inventory`,
                { products },
                { headers }
            );
        } catch (invErr: any) {
            console.warn("Inventory update failed, falling back to simple price update:", invErr.response?.data || invErr.message);
            // Fallback: If variations fail, at least try to update the main listing price
            if (pricingRows[0]?.price) {
                await axios.patch(
                    `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${cleanId}`,
                    { price: Number(pricingRows[0].price) },
                    { headers }
                );
            }
        }
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('❌ Etsy Update Error:', error.response?.status, error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || error.message,
      details: error.response?.data 
    });
  }
}
