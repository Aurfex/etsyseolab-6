import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import axios from 'axios';
import { Product, OptimizationResult } from '../types';

type CompetitorInsights = {
    keywordSeed: string;
    yourRank: number;
    totalCompared: number;
    yourScore: number;
    avgTopScore: number;
    topCompetitorTitle: string;
    topKeywords: string[];
    commonTitleStarts: string[];
    recommendations: string[];
};

const OUNCE_TO_GRAM = 31.1034768;
const GOLD_14K_PURITY = 0.585;

type GoldApiResponse = {
    price?: number;
    price_gram_24k?: number;
    price_gram?: number;
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

const STOPWORDS = new Set([
    'the', 'and', 'for', 'with', 'ring', 'rings', 'jewelry', 'jewellery', 'gift', 'women', 'mens', 'men', 'of', 'in', 'to', 'a', 'an'
]);

const tokenize = (text: string): string[] =>
    String(text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 3 && !STOPWORDS.has(w));

const extractTopKeywords = (titles: string[], limit = 12): string[] => {
    const freq = new Map<string, number>();
    for (const t of titles) {
        for (const w of tokenize(t)) freq.set(w, (freq.get(w) || 0) + 1);
    }
    return [...freq.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k]) => k);
};

const getTitleStart = (title: string): string =>
    String(title || '').trim().split(/\s+/).slice(0, 2).join(' ').toLowerCase();

async function getCompetitorInsights(product: Product, token: string): Promise<CompetitorInsights | null> {
    const apiKey = process.env.ETSY_CLIENT_ID;
    const secret = process.env.ETSY_CLIENT_SECRET;
    if (!apiKey) return null;

    const xApiKey = secret ? `${apiKey}:${secret}` : apiKey;
    const headers = {
        Authorization: `Bearer ${token}`,
        'x-api-key': xApiKey,
        'Content-Type': 'application/json'
    };

    const keywordSeed = [product.title || '', ...(product.tags || [])]
        .join(' ')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 8)
        .join(' ');
    if (!keywordSeed) return null;

    const { data } = await axios.get(
        `https://openapi.etsy.com/v3/application/listings/active?keywords=${encodeURIComponent(keywordSeed)}&limit=20`,
        { headers }
    );

    const items = Array.isArray(data?.results) ? data.results : [];
    const competitors = items
        .filter((r: any) => String(r.listing_id) !== String((product as any).listing_id || product.id))
        .map((r: any) => {
            const title = r.title || '';
            const description = r.description || '';
            const tags = Array.isArray(r.tags) ? r.tags : [];
            return { listing_id: String(r.listing_id), title, score: calcScore(title, description, tags) };
        });

    const yourScore = calcScore(product.title || '', product.description || '', product.tags || []);
    const selfId = String((product as any).listing_id || product.id || 'self');
    const ranked = [...competitors, { listing_id: selfId, title: product.title || '', score: yourScore }].sort((a, b) => b.score - a.score);
    const yourRank = Math.max(1, ranked.findIndex((r) => r.listing_id === selfId) + 1);
    const top5 = ranked.slice(0, 5);
    const avgTopScore = top5.length ? Math.round(top5.reduce((acc, i) => acc + i.score, 0) / top5.length) : yourScore;

    const competitorTitles = competitors.map((c) => c.title).filter(Boolean);
    const topKeywords = extractTopKeywords(competitorTitles, 12);

    const startFreq = new Map<string, number>();
    for (const t of competitorTitles) {
        const s = getTitleStart(t);
        if (!s) continue;
        startFreq.set(s, (startFreq.get(s) || 0) + 1);
    }
    const commonTitleStarts = [...startFreq.entries()]
        .filter(([, v]) => v >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k]) => k);

    const recommendations: string[] = [];
    if ((product.title || '').length < 90) recommendations.push('Title is short. Aim for 90-140 chars with strong keywords.');
    if ((product.tags || []).length < 10) recommendations.push('Use 10-13 relevant tags (<=20 chars each).');
    if ((product.description || '').length < 120) recommendations.push('Description is too short. Add benefits, materials, use-case, and CTA.');
    if (recommendations.length === 0) recommendations.push('Great baseline. Improve keyword intent in the first 40 title chars.');

    return {
        keywordSeed,
        yourRank,
        totalCompared: ranked.length,
        yourScore,
        avgTopScore,
        topCompetitorTitle: ranked[0]?.title || '',
        topKeywords,
        commonTitleStarts,
        recommendations,
    };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    try {
        if (req.method === 'GET' && String(req.query?.action || '') === 'metal-prices') {
            const goldApiKey = process.env.GOLDAPI_KEY;
            if (!goldApiKey) {
                return res.status(500).json({ error: 'Missing GOLDAPI_KEY in environment variables' });
            }

            const [gold, silver, platinum] = await Promise.all([
                fetchMetal('XAU', goldApiKey),
                fetchMetal('XAG', goldApiKey),
                fetchMetal('XPT', goldApiKey),
            ]);

            const gold24kPricePerGram = perGram(gold, 'XAU');
            const gold14kPricePerGram = gold24kPricePerGram * GOLD_14K_PURITY;

            return res.status(200).json({
                currency: 'CAD',
                goldPricePerGram: gold14kPricePerGram,
                gold14kPricePerGram,
                gold24kPricePerGram,
                silverPricePerGram: perGram(silver, 'XAG'),
                platinumPricePerGram: perGram(platinum, 'XPT'),
                source: 'goldapi.io',
                fetchedAt: new Date().toISOString(),
                rawTimestamp: Math.max(gold.timestamp || 0, silver.timestamp || 0, platinum.timestamp || 0),
            });
        }

        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method Not Allowed' });
        }

        const { product, type = 'all' } = req.body as { product: Product; type?: 'all' | 'tags' | 'description' };

        const authHeader = req.headers.authorization;
        const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : '';
        
        // Use OpenAI API Key from environment variables
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            console.error("Server Error: Missing OPENAI_API_KEY environment variable.");
            return res.status(500).json({ error: 'Server is not configured with an OpenAI API key.' });
        }
        
        if (!product || !product.title) {
            return res.status(400).json({ error: 'Invalid product data provided. Title is required.' });
        }
        
        // Initialize OpenAI
        const openai = new OpenAI({ apiKey: apiKey });
        const model = "gpt-4o"; // Or "gpt-3.5-turbo" if needed for cost/speed

        let competitorInsights: CompetitorInsights | null = null;
        try {
            if (token) competitorInsights = await getCompetitorInsights(product, token);
        } catch (insightError: any) {
            console.warn('Competitor insight fetch failed, proceeding without it:', insightError?.message || insightError);
        }

        const competitorContext = competitorInsights
            ? `\nCOMPETITOR INSIGHTS:\n- Current rank: ${competitorInsights.yourRank}/${competitorInsights.totalCompared}\n- Current score: ${competitorInsights.yourScore}\n- Top average score: ${competitorInsights.avgTopScore}\n- Keyword seed: ${competitorInsights.keywordSeed}\n- Top competitor title: ${competitorInsights.topCompetitorTitle}\n- Top competitor keywords: ${competitorInsights.topKeywords.join(', ')}\n- Overused title starts to avoid: ${competitorInsights.commonTitleStarts.join(' | ') || 'none'}\n- Recommendations:\n${competitorInsights.recommendations.map((r, i) => `  ${i + 1}. ${r}`).join('\n')}\n\nOptimization priority: improve relative ranking vs competitors while staying natural and high-converting.\n`
            : '';

        const optimizeTitle = async (originalTitle: string): Promise<string> => {
            const avoidStarts = competitorInsights?.commonTitleStarts || [];
            const prompt = `Rewrite this Etsy title for better SEO and conversion, but keep it natural and product-specific.\n\nOriginal title: "${originalTitle}"\n\nRules:\n1) 90-140 chars.\n2) Do NOT always use the same formula. Avoid repetitive openings and robotic templates.\n3) Include material/stone/style/use-case only if truly relevant to this specific item.\n4) Use high-intent Etsy keywords from competitor context, but keep it unique and readable.\n5) Do not force the word "Handmade" unless strongly relevant from source context.\n6) Avoid these overused starts: ${avoidStarts.join(' | ') || 'none'}.\n7) No keyword stuffing, no emojis, no quotes.\n\n${competitorContext}\nReturn ONLY one final title.`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.85,
                });
                const generated = response.choices[0].message.content?.trim().replace(/^"|"$/g, '') || originalTitle;
                return generated.length > 140 ? generated.slice(0, 140) : generated;
            } catch (e) {
                console.error("Title optimization error:", e);
                return originalTitle;
            }
        };

        const generateTags = async (title: string, description: string): Promise<string[]> => {
            const prompt = `Based on the product title "${title}" and description "${description}", generate exactly 13 high-traffic, relevant Etsy SEO tags.${competitorContext}
            IMPORTANT CONSTRAINTS:
            1. EXACTLY 13 tags.
            2. Each tag MUST be 20 characters or LESS.
            3. No special characters except spaces.
            4. Multi-word tags are better (e.g., "gold ring" instead of "ring").
            5. Prefer intent hinted by keyword seed and competitor gaps.
            
            Return ONLY a valid JSON array of strings (e.g., ["tag1", "tag2"]). Do not include markdown formatting or explanations.`;
            
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                let text = response.choices[0].message.content?.trim() || "[]";
                // Clean up potential markdown code blocks
                text = text.replace(/```json/g, '').replace(/```/g, '').trim();
                const tags = JSON.parse(text);
                // Filter again to be safe
                return Array.isArray(tags) ? tags.filter((t: string) => t.length <= 20).slice(0, 13) : [];
            } catch (e) {
                console.warn("Tag generation error:", e);
                return [];
            }
        };

        const rewriteDescription = async (originalDescription: string): Promise<string> => {
            const prompt = `Rewrite this Etsy product description to be persuasive, keyword-rich, and structured for sales. Use an engaging opening, bullet points for features/materials, and a clear call to action. Keep the tone friendly and professional.${competitorContext} Original description: "${originalDescription}"`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                return response.choices[0].message.content?.trim() || originalDescription;
            } catch (e) {
                console.error("Description rewrite error:", e);
                return originalDescription;
            }
        };

        const generateAltText = async (title: string, description: string): Promise<string> => {
            const prompt = `Generate a descriptive and SEO-friendly alt text for an e-commerce product image. The product is: "${title}". Description: "${description}".${competitorContext} The alt text should be useful for visually impaired users and search engines, and be under 125 characters. Return ONLY the alt text.`;
            try {
                const response = await openai.chat.completions.create({
                    model: model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.7,
                });
                return response.choices[0].message.content?.trim() || title;
            } catch (e) {
                console.error("Alt text generation error:", e);
                return title;
            }
        };

        if (type === 'tags') {
            const tags = await generateTags(product.title, product.description || '');
            return res.status(200).json({ tags });
        }

        if (type === 'description') {
            const description = await rewriteDescription(product.description || product.title);
            return res.status(200).json({ description });
        }

        // Run optimizations in parallel for 'all'
        const [newTitle, newDescription, newAltText] = await Promise.all([
            optimizeTitle(product.title),
            rewriteDescription(product.description || product.title),
            generateAltText(product.title, product.description || '')
        ]);
        
        // Tags benefit from using the optimized title
        const newTags = await generateTags(newTitle, newDescription);

        const result: OptimizationResult = {
            title: newTitle,
            description: newDescription,
            tags: newTags,
            altText: newAltText,
        };

        return res.status(200).json(result);

    } catch (error: any) {
        console.error("Error in optimization endpoint:", error);
        return res.status(500).json({ 
            error: 'An unexpected error occurred while processing the optimization.',
            details: error.message 
        });
    }
}
