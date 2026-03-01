import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type Body = {
  listing_id: string | number;
  keywords: string[];
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
  const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
  if (!ETSY_API_KEY) return res.status(500).json({ error: 'Missing ETSY_CLIENT_ID' });

  const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;
  const headers = {
    Authorization: authHeader,
    'x-api-key': xApiKey,
    'Content-Type': 'application/json'
  };

  try {
    const { listing_id, keywords }: Body = req.body || {};
    if (!listing_id) return res.status(400).json({ error: 'listing_id is required' });
    const cleanKeywords = (Array.isArray(keywords) ? keywords : [])
      .map((k) => String(k || '').trim())
      .filter(Boolean)
      .slice(0, 10);

    if (cleanKeywords.length === 0) {
      return res.status(400).json({ error: 'At least one keyword is required' });
    }

    const out: Array<{ keyword: string; rank: number | null; found: boolean }> = [];

    for (const keyword of cleanKeywords) {
      const url = `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(keyword)}&limit=48`;
      const { data } = await axios.get(url, { headers });
      const results = Array.isArray(data?.results) ? data.results : [];
      const idx = results.findIndex((r: any) => String(r.listing_id) === String(listing_id));
      out.push({ keyword, rank: idx >= 0 ? idx + 1 : null, found: idx >= 0 });
    }

    const foundCount = out.filter((x) => x.found).length;
    const avgRank = out.filter((x) => x.rank).length
      ? Number((out.filter((x) => x.rank).reduce((s, x) => s + Number(x.rank || 0), 0) / out.filter((x) => x.rank).length).toFixed(1))
      : null;

    return res.status(200).json({
      listing_id: String(listing_id),
      tracked: out,
      foundCount,
      total: out.length,
      avgRank,
      note: 'Approximate Etsy rank via active listing search API (not guaranteed absolute SERP position).'
    });
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data?.error || error.message || 'Rank tracking failed'
    });
  }
}
