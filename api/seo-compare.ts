import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type CompareBody = {
  action?: 'compare' | 'rank_track';
  title?: string;
  description?: string;
  tags?: string[];
  listing_id?: string;
  keywords?: string[];
};

const calcScore = (title: string, description: string, tags: string[]) => {
  let score = 30;
  if (title.length >= 90 && title.length <= 140) score += 25;
  else if (title.length >= 60) score += 15;
  else if (title.length >= 30) score += 8;

  if (description.length >= 300) score += 20;
  else if (description.length >= 120) score += 12;
  else if (description.length >= 60) score += 6;

  score += Math.min(tags.length, 13) * 1.8;
  if (tags.length >= 10) score += 5;
  return Math.max(20, Math.min(99, Math.round(score)));
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
    const { action = 'compare', title = '', description = '', tags = [], listing_id, keywords = [] }: CompareBody = req.body || {};

    if (action === 'rank_track') {
      if (!listing_id) return res.status(400).json({ error: 'listing_id is required' });
      const cleanKeywords = (Array.isArray(keywords) ? keywords : [])
        .map((k) => String(k || '').trim())
        .filter(Boolean)
        .slice(0, 10);
      if (cleanKeywords.length === 0) return res.status(400).json({ error: 'At least one keyword is required' });

      // Check listing state first: rank tracking only makes sense for active listings
      let listingState: string | null = null;
      try {
        const listingResp = await axios.get(`https://openapi.etsy.com/v3/application/listings/${listing_id}`, { headers });
        listingState = String(listingResp.data?.state || '').toLowerCase() || null;
      } catch {
        // keep null state if endpoint fails
      }

      const tracked: Array<{ keyword: string; rank: number | null; found: boolean }> = [];
      for (const keyword of cleanKeywords) {
        let foundRank: number | null = null;
        const pageSize = 48;
        const maxPages = 5; // up to top ~240 results for better approximation

        for (let page = 0; page < maxPages; page++) {
          const offset = page * pageSize;
          const url = `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(keyword)}&limit=${pageSize}&offset=${offset}`;
          const { data } = await axios.get(url, { headers });
          const results = Array.isArray(data?.results) ? data.results : [];
          const idx = results.findIndex((r: any) => String(r.listing_id) === String(listing_id));
          if (idx >= 0) {
            foundRank = offset + idx + 1;
            break;
          }

          // fallback: title similarity on the same shop can indicate approximate presence
          const sameShop = results.find((r: any) => String(r.shop_id) === String((results[0] || {}).shop_id || ''));
          void sameShop;

          if (results.length < pageSize) break;
        }

        tracked.push({ keyword, rank: foundRank, found: foundRank !== null });
      }

      const foundCount = tracked.filter((x) => x.found).length;
      const rankedOnly = tracked.filter((x) => x.rank != null).map((x) => Number(x.rank));
      const avgRank = rankedOnly.length ? Number((rankedOnly.reduce((a, b) => a + b, 0) / rankedOnly.length).toFixed(1)) : null;

      let note = 'Approximate Etsy rank via active listing search API (not guaranteed absolute SERP position).';
      if (listingState && listingState !== 'active') {
        note = `Listing state is '${listingState}'. Rank tracking targets active listings; publish first for reliable rank results.`;
      } else if (foundCount === 0) {
        note = `${note} No matches in top ~240 results for provided keywords; try longer product-specific keywords.`;
      }

      return res.status(200).json({
        listing_id: String(listing_id),
        listingState,
        tracked,
        foundCount,
        total: tracked.length,
        avgRank,
        note,
      });
    }

    if (!title) return res.status(400).json({ error: 'title is required' });

    const seedKeywords = title.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');

    const searchUrl = `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(seedKeywords)}&limit=20`;
    const { data } = await axios.get(searchUrl, { headers });
    const results = Array.isArray(data?.results) ? data.results : [];

    const competitors = results
      .filter((r: any) => String(r.listing_id) !== String(listing_id || ''))
      .map((r: any) => {
        const cTitle = r.title || '';
        const cDescription = r.description || '';
        const cTags = Array.isArray(r.tags) ? r.tags : [];
        return { listing_id: String(r.listing_id), title: cTitle, score: calcScore(cTitle, cDescription, cTags) };
      });

    const yourScore = calcScore(title, description, tags);
    const ranked = [...competitors, { listing_id: String(listing_id || 'self'), title, score: yourScore }].sort((a, b) => b.score - a.score);

    const yourRank = Math.max(1, ranked.findIndex(r => r.listing_id === String(listing_id || 'self')) + 1);
    const top5 = ranked.slice(0, 5);
    const avgTopScore = top5.length ? Math.round(top5.reduce((s, i) => s + i.score, 0) / top5.length) : yourScore;

    const recommendations: string[] = [];
    if (title.length < 90) recommendations.push('Title is short. Aim for 90-140 chars with strong keywords.');
    if ((tags?.length || 0) < 10) recommendations.push('Add more tags (target 10-13 relevant tags).');
    if ((description?.length || 0) < 120) recommendations.push('Description is too short. Expand with benefits/materials/use-cases.');
    if (recommendations.length === 0) recommendations.push('Great baseline. Focus on stronger keyword phrasing in first 40 title characters.');

    return res.status(200).json({
      keywords: seedKeywords,
      yourScore,
      yourRank,
      totalCompared: ranked.length,
      avgTopScore,
      topCompetitorTitle: ranked[0]?.title || null,
      recommendations
    });
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: error?.response?.data?.error || error.message || 'Compare failed'
    });
  }
}
