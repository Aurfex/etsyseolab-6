import type { VercelRequest, VercelResponse } from '@vercel/node';

const OUNCE_TO_GRAM = 31.1034768;

type GoldApiResponse = {
  price?: number;
  price_gram_24k?: number;
  price_gram?: number;
  metal?: string;
  currency?: string;
  timestamp?: number;
};

async function fetchMetal(symbol: 'XAU' | 'XAG' | 'XPT', apiKey: string): Promise<GoldApiResponse> {
  const response = await fetch(`https://www.goldapi.io/api/${symbol}/CAD`, {
    headers: {
      'x-access-token': apiKey,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GoldAPI ${symbol} failed: ${response.status} ${text}`);
  }

  return response.json();
}

function perGram(data: GoldApiResponse, symbol: 'XAU' | 'XAG' | 'XPT'): number {
  if (symbol === 'XAU' && typeof data.price_gram_24k === 'number') return data.price_gram_24k;
  if (typeof data.price_gram === 'number') return data.price_gram;
  if (typeof data.price === 'number') return data.price / OUNCE_TO_GRAM;
  return 0;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOLDAPI_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing GOLDAPI_KEY in environment variables' });
  }

  try {
    const [gold, silver, platinum] = await Promise.all([
      fetchMetal('XAU', apiKey),
      fetchMetal('XAG', apiKey),
      fetchMetal('XPT', apiKey),
    ]);

    return res.status(200).json({
      currency: 'CAD',
      goldPricePerGram: perGram(gold, 'XAU'),
      silverPricePerGram: perGram(silver, 'XAG'),
      platinumPricePerGram: perGram(platinum, 'XPT'),
      source: 'goldapi.io',
      fetchedAt: new Date().toISOString(),
      rawTimestamp: Math.max(gold.timestamp || 0, silver.timestamp || 0, platinum.timestamp || 0),
    });
  } catch (error: any) {
    console.error('metal-prices error:', error);
    return res.status(500).json({ error: error?.message || 'Failed to fetch metal prices' });
  }
}
