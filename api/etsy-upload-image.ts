import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import formidable from 'formidable';
import { readFile } from 'node:fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = async (req: VercelRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> => {
  const form = formidable({ multiples: false, keepExtensions: true });
  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

const toSingle = <T>(v: T | T[] | undefined): T | undefined => Array.isArray(v) ? v[0] : v;

const getShopId = async (headers: Record<string, string>) => {
  const userResponse = await axios.get('https://openapi.etsy.com/v3/application/users/me', { headers });
  let shopId = userResponse.data?.shop_id;
  if (!shopId) {
    const userId = userResponse.data?.user_id;
    const shopResponse = await axios.get(`https://openapi.etsy.com/v3/application/users/${userId}/shops`, { headers });
    if (shopResponse.data?.shops?.[0]) shopId = shopResponse.data.shops[0].shop_id;
  }
  return shopId;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });
  }
  const token = authHeader.split(' ')[1];

  const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
  const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
  if (!ETSY_API_KEY) return res.status(500).json({ error: 'Server configuration error: Missing ETSY_CLIENT_ID.' });

  const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'x-api-key': xApiKey,
  };

  try {
    const { fields, files } = await parseForm(req);
    const listingId = String(toSingle(fields.listing_id as any) || '').trim();
    const altText = String(toSingle(fields.alt_text as any) || '').trim();
    const rankRaw = String(toSingle(fields.rank as any) || '').trim();
    const rank = Number(rankRaw);

    const image = toSingle(files.image as any);
    if (!listingId) return res.status(400).json({ error: 'Missing listing_id.' });
    if (!image?.filepath) return res.status(400).json({ error: 'Missing image file.' });
    if (!altText) return res.status(400).json({ error: 'Missing alt_text.' });

    const shopId = await getShopId(headers);
    if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

    const bytes = await readFile(image.filepath);
    const blob = new Blob([bytes], { type: image.mimetype || 'image/jpeg' });
    const form = new FormData();
    form.append('image', blob, image.originalFilename || 'image.jpg');
    form.append('alt_text', altText);
    if (Number.isFinite(rank) && rank > 0) form.append('rank', String(Math.floor(rank)));

    const uploadResp = await fetch(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}/images`, {
      method: 'POST',
      headers,
      body: form,
    });

    const responseText = await uploadResp.text();
    let responseData: any = null;
    try { responseData = responseText ? JSON.parse(responseText) : null; } catch { responseData = { raw: responseText }; }

    if (!uploadResp.ok) {
      const errorMsg = responseData?.error || responseData?.detail || responseData?.error_description || `Etsy image upload failed (${uploadResp.status})`;
      return res.status(uploadResp.status).json({ error: errorMsg, details: responseData });
    }

    return res.status(200).json({ success: true, data: responseData });
  } catch (error: any) {
    console.error('❌ Etsy image upload proxy error:', error?.response?.data || error?.message || error);
    const status = error?.response?.status || 500;
    const details = error?.response?.data || null;
    return res.status(status).json({ error: error?.message || 'Image upload failed.', details });
  }
}
