import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import formidable from 'formidable';
import { readFile } from 'node:fs/promises';

export const config = {
  api: {
    bodyParser: false,
  },
};

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

const getDefaultReadinessStateId = async (headers: Record<string, string>, shopId: string | number): Promise<number | null> => {
  // 1) Try dedicated readiness endpoint (if available in this shop/API version)
  try {
    const rsResp = await axios.get(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings/readiness_states`, { headers });
    const rows = rsResp.data?.results || rsResp.data?.readiness_states || rsResp.data || [];
    const first = Array.isArray(rows) ? rows[0] : null;
    const id = Number(first?.readiness_state_id ?? first?.id);
    if (Number.isFinite(id) && id > 0) return Math.floor(id);
  } catch {
    // ignore and fallback
  }

  // 2) Fallback: inspect one existing listing inventory offering readiness_state_id
  try {
    const listingsResp = await axios.get(`https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=25`, { headers });
    const listingIds: Array<string | number> = (listingsResp.data?.results || [])
      .map((l: any) => l?.listing_id)
      .filter(Boolean);

    for (const lid of listingIds) {
      try {
        const invResp = await axios.get(`https://openapi.etsy.com/v3/application/listings/${lid}/inventory`, { headers });
        const products = Array.isArray(invResp.data?.products) ? invResp.data.products : [];
        for (const p of products) {
          const offerings = Array.isArray(p?.offerings) ? p.offerings : [];
          for (const o of offerings) {
            const id = Number(o?.readiness_state_id);
            if (Number.isFinite(id) && id > 0) return Math.floor(id);
          }
        }
      } catch {
        // continue with next listing
      }
    }
  } catch {
    // ignore
  }

  return null;
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

const parseJsonBody = async (req: VercelRequest): Promise<any> => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
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

const toSingle = <T>(v: T | T[] | undefined): T | undefined => (Array.isArray(v) ? v[0] : v);

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
    if (req.method === 'GET') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      const listingsResponse = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`,
        { headers }
      );

      const formattedProducts = (listingsResponse.data?.results || []).map((listing: any) => {
        const img =
          listing.images?.[0]?.url_fullxfull ||
          listing.images?.[0]?.url_570xN ||
          listing.Images?.[0]?.url_fullxfull ||
          listing.Images?.[0]?.url_570xN ||
          'https://via.placeholder.com/400x300';

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

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const contentType = String(req.headers['content-type'] || '').toLowerCase();

    // Multipart path: upload image
    if (contentType.includes('multipart/form-data')) {
      const { fields, files } = await parseForm(req);
      const action = String(toSingle(fields.action as any) || 'upload_image');
      if (action !== 'upload_image') return res.status(400).json({ error: 'Unsupported multipart action.' });

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

      const uploadResp = await fetch(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings/${listingId}/images`,
        {
          method: 'POST',
          headers: {
            Authorization: headers.Authorization,
            'x-api-key': headers['x-api-key'],
          },
          body: form,
        }
      );

      const responseText = await uploadResp.text();
      let responseData: any = null;
      try {
        responseData = responseText ? JSON.parse(responseText) : null;
      } catch {
        responseData = { raw: responseText };
      }

      if (!uploadResp.ok) {
        const errorMsg =
          responseData?.error || responseData?.detail || responseData?.error_description || `Etsy image upload failed (${uploadResp.status})`;
        return res.status(uploadResp.status).json({ error: errorMsg, details: responseData });
      }

      return res.status(200).json({ success: true, data: responseData });
    }

    // JSON actions
    const body = await parseJsonBody(req);
    const action = body?.action;

    if (action === 'get_listings') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      const listingsResponse = await axios.get(
        `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&includes=Images`,
        { headers }
      );

      const formattedProducts = (listingsResponse.data?.results || []).map((listing: any) => {
        const img =
          listing.images?.[0]?.url_fullxfull ||
          listing.images?.[0]?.url_570xN ||
          listing.Images?.[0]?.url_fullxfull ||
          listing.Images?.[0]?.url_570xN ||
          'https://via.placeholder.com/400x300';

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

    if (action === 'create_listing') {
      const shopId = await getShopId(headers);
      if (!shopId) return res.status(404).json({ error: 'No Etsy shop found.' });

      const payload = body?.payload || {};
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

      // Etsy requires readiness_state_id for physical listings.
      // Use client value if provided, otherwise discover a valid shop-specific one.
      const readinessRaw = Number(payload.readiness_state_id);
      if (Number.isFinite(readinessRaw) && readinessRaw > 0) {
        createBody.readiness_state_id = Math.floor(readinessRaw);
      } else {
        const discoveredReadiness = await getDefaultReadinessStateId(headers, shopId);
        if (Number.isFinite(Number(discoveredReadiness)) && Number(discoveredReadiness) > 0) {
          createBody.readiness_state_id = Number(discoveredReadiness);
        }
      }

      const optionalFields = ['shipping_profile_id', 'return_policy_id', 'shop_section_id'];
      for (const f of optionalFields) {
        if (payload[f] !== undefined && payload[f] !== null && String(payload[f]).trim() !== '') {
          createBody[f] = payload[f];
        }
      }

      if (!createBody.readiness_state_id) {
        return res.status(400).json({
          error: 'Could not determine a valid readiness_state_id for this shop. Please set readiness_state_id explicitly in payload.',
        });
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
