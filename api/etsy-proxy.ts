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
    'Authorization': `Bearer ${token}`,
    'x-api-key': xApiKey,
    'Content-Type': 'application/json',
  };
};

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

const sanitizeTags = (tags: any): string[] => {
  if (!Array.isArray(tags)) return [];
  const cleaned = tags
    .map((t) => String(t || '').trim())
    .filter((t) => t.length > 0 && t.length <= 20)
    .map((t) => t.replace(/[.,/#!$%^&*;:{}=\-_`~()\[\]"'\\|<>?@+]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  return [...new Set(cleaned)].slice(0, 13);
};

const calcSeoScore = (title: string, description: string, tags: string[]) => {
  let seoScore = 30;
  if (title.length >= 90 && title.length <= 140) seoScore += 25;
  else if (title.length >= 60) seoScore += 15;
  else if (title.length >= 30) seoScore += 8;

  if (description.length >= 300) seoScore += 20;
  else if (description.length >= 120) seoScore += 12;
  else if (description.length >= 60) seoScore += 6;

  seoScore += Math.min(tags.length, 13) * 1.8;
  if (tags.length >= 10) seoScore += 5;
  return Math.max(20, Math.min(99, Math.round(seoScore)));
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ error: 'Unauthorized: Missing or invalid token.' });

  let headers: Record<string, string>;
  try {
    headers = getHeaders(token);
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'Server configuration error.' });
  }

  try {
    if (req.method === 'GET' || (req.method === 'POST' && req.body?.action === 'get_listings')) {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      const listingsResponse = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`,
        { headers }
      );

      const formattedProducts = (listingsResponse.data?.results || []).map((listing: any) => {
        const img = listing.images?.[0]?.url_fullxfull
          || listing.images?.[0]?.url_570xN
          || listing.Images?.[0]?.url_fullxfull
          || listing.Images?.[0]?.url_570xN
          || 'https://via.placeholder.com/400x300';

        const title = listing.title || '';
        const description = listing.description || '';
        const tags = Array.isArray(listing.tags) ? listing.tags : [];

        return {
          id: String(listing.listing_id),
          listing_id: String(listing.listing_id),
          title,
          description,
          price: listing.price?.amount && listing.price?.divisor ? listing.price.amount / listing.price.divisor : 0,
          currency: listing.price?.currency_code,
          quantity: listing.quantity,
          tags,
          url: listing.url,
          imageUrl: img,
          seoScore: calcSeoScore(title, description, tags),
          views: listing.views,
          num_favorers: listing.num_favorers,
        };
      });

      return res.status(200).json({ products: formattedProducts, shop: { id: shopId } });
    }

    if (req.method === 'POST' && req.body?.action === 'create_listing') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      const payload = req.body?.payload || {};
      const title = String(payload.title || '').trim().slice(0, 140);
      const description = String(payload.description || '').trim();
      const taxonomy_id = Number(payload.taxonomy_id);
      const quantity = Math.max(1, Number(payload.quantity || 1));
      const price = Number(payload.price || 0);
      const who_made = String(payload.who_made || 'i_did');
      const when_made = String(payload.when_made || 'made_to_order');
      const is_supply = Boolean(payload.is_supply);
      const tags = sanitizeTags(payload.tags);

      if (!title || !description || !taxonomy_id || !Number.isFinite(price) || price <= 0) {
        return res.status(400).json({ error: 'Missing required fields for create_listing.' });
      }

      const createBody: any = {
        quantity,
        title,
        description,
        price: price.toFixed(2),
        who_made,
        when_made,
        is_supply,
        taxonomy_id,
        tags,
      };

      const optionalFields = ['shipping_profile_id', 'return_policy_id', 'shop_section_id'];
      for (const f of optionalFields) {
        if (payload[f] !== undefined && payload[f] !== null && String(payload[f]).trim() !== '') {
          createBody[f] = payload[f];
        }
      }

      const createResp = await axios.post(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings`,
        createBody,
        { headers }
      );

      return res.status(200).json({ listing_id: createResp.data?.listing_id, data: createResp.data });
    }

    return res.status(405).json({ error: 'Method Not Allowed' });
  } catch (error: any) {
    console.error('❌ Etsy proxy error:', error?.response?.data || error?.message || error);
    const status = error?.response?.status || 500;
    const details = error?.response?.data || null;
    const etsyMessage = details?.error || details?.error_description || details?.detail || error?.message || 'Etsy API Error';
    return res.status(status).json({ error: etsyMessage, details });
  }
}
