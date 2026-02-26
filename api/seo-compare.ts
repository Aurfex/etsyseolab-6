import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type CompareBody = {
  title: string;
  description?: string;
  tags?: string[];
  listing_id?: string;
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
    const { title, description = '', tags = [], listing_id }: CompareBody = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    const keywords = title
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .join(' ');

    const searchUrl = `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(keywords)}&limit=20`;
    const { data } = await axios.get(searchUrl, { headers });
    const results = Array.isArray(data?.results) ? data.results : [];

    const competitors = results
      .filter((r: any) => String(r.listing_id) !== String(listing_id || ''))
      .map((r: any) => {
        const cTitle = r.title || '';
        const cDescription = r.description || '';
        const cTags = Array.isArray(r.tags) ? r.tags : [];
        return {
          listing_id: String(r.listing_id),
          title: cTitle,
          score: calcScore(cTitle, cDescription, cTags)
        };
      });

    const yourScore = calcScore(title, description, tags);
    const ranked = [...competitors, { listing_id: String(listing_id || 'self'), title, score: yourScore }]
      .sort((a, b) => b.score - a.score);

    const yourRank = Math.max(1, ranked.findIndex(r => r.listing_id === String(listing_id || 'self')) + 1);
    const top5 = ranked.slice(0, 5);
    const avgTopScore = top5.length ? Math.round(top5.reduce((s, i) => s + i.score, 0) / top5.length) : yourScore;

    const recommendations: string[] = [];
    if (title.length < 90) recommendations.push('Title is short. Aim for 90-140 chars with strong keywords.');
    if ((tags?.length || 0) < 10) recommendations.push('Add more tags (target 10-13 relevant tags).');
    if ((description?.length || 0) < 120) recommendations.push('Description is too short. Expand with benefits/materials/use-cases.');
    if (recommendations.length === 0) recommendations.push('Great baseline. Focus on stronger keyword phrasing in first 40 title characters.');

    return res.status(200).json({
      keywords,
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
