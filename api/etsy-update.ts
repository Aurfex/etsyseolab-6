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
  if (!ETSY_API_KEY) throw new Error('Server configuration error: Missing ETSY_CLIENT_ID.');
  
  return {
    Authorization: `Bearer ${token}`,
    'x-api-key': ETSY_API_KEY,
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
    
    // Etsy v3 Update Listing: PATCH /v3/application/listings/{listing_id}
    // We use the most direct URL first.
    console.log(`Updating listing: ${cleanId}`);

    const response = await axios({
        method: 'PATCH',
        url: `https://openapi.etsy.com/v3/application/listings/${cleanId}`,
        headers: headers,
        data: payload
    });

    return res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('❌ Etsy Update Error:', error.response?.status, error.response?.data || error.message);
    
    // If 404, the listing ID might be wrong or the endpoint structure is different for this app
    return res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || error.message,
      details: error.response?.data 
    });
  }
}
