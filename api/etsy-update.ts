import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

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

  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  const { listing_id, payload } = req.body;
  if (!listing_id || !payload) {
    return res.status(400).json({ error: 'Missing listing_id or payload' });
  }

  try {
    const headers = getHeaders(token);
    
    // Etsy v3 Update Listing endpoint
    const response = await axios.patch(
      `https://openapi.etsy.com/v3/application/listings/${listing_id}`,
      payload,
      { headers }
    );

    return res.status(200).json({ success: true, data: response.data });
  } catch (error: any) {
    console.error('❌ Etsy update error:', error?.response?.data || error.message);
    return res.status(error?.response?.status || 500).json({ 
      error: error?.response?.data?.error || error.message,
      details: error?.response?.data 
    });
  }
}
