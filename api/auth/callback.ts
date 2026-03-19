import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  // Prevent any intermediary caching on OAuth callback endpoint
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Retrieve code verifier and state from cookies
  const rawCookieHeader = req.headers['cookie'] || '';
  const cookies = Object.fromEntries(
    rawCookieHeader
      .split(';')
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => {
        const i = p.indexOf('=');
        return i === -1 ? [p, ''] : [p.slice(0, i), p.slice(i + 1)];
      })
  );

  const codeVerifier = cookies.etsy_code_verifier;
  const storedState = cookies.etsy_oauth_state;

  if (!codeVerifier || !storedState) {
    const debugInfo = {
      hasCookieHeader: !!rawCookieHeader,
      cookieCount: Object.keys(cookies).length,
      verifierFound: !!codeVerifier,
      stateFound: !!storedState,
      timestamp: new Date().toISOString()
    };
    console.error('Missing cookies during callback:', debugInfo);
    return res.status(400).json({
      error: 'No cookies found',
      hint: 'Please ensure you are using https://etsyseolab-6.vercel.app and that your browser accepts cookies.',
      debug: process.env.NODE_ENV === 'development' ? debugInfo : undefined
    });
  }

  if (state !== storedState) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  if (!codeVerifier) {
    return res.status(400).json({ error: 'Missing code verifier in cookies' });
  }

  // Clear cookies (mirror modern attributes to ensure deletion in all browsers)
  res.setHeader('Set-Cookie', [
    'etsy_code_verifier=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0',
    'etsy_oauth_state=; Path=/; HttpOnly; Secure; SameSite=None; Max-Age=0',
    'etsy_code_verifier=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    'etsy_oauth_state=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  ]);

  try {
    const response = await axios.post(
      'https://api.etsy.com/v3/public/oauth/token',
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.ETSY_CLIENT_ID!,
        redirect_uri: process.env.ETSY_REDIRECT_URI!,
        code: code as string,
        code_verifier: codeVerifier
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    
    // Fetch Etsy User Info to get shop_id
    try {
      const ETSY_API_KEY = process.env.ETSY_CLIENT_ID;
      const ETSY_SHARED_SECRET = process.env.ETSY_CLIENT_SECRET;
      const xApiKey = ETSY_SHARED_SECRET ? `${ETSY_API_KEY}:${ETSY_SHARED_SECRET}` : ETSY_API_KEY;

      const userResp = await axios.get('https://openapi.etsy.com/v3/application/users/me', {
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'x-api-key': xApiKey!
        }
      });
      
      const etsyUserId = String(userResp.data?.user_id);
      const shopId = String(userResp.data?.shop_id);

      // Note: In a real production app, we would link this to a Supabase Auth user ID.
      // For this MVP, we can store it in a way that the frontend can later claim.
      console.log(`Syncing Etsy User ${etsyUserId} (Shop ${shopId}) to Supabase...`);
      
      // We'll perform an upsert based on the shop_id or etsy_user_id.
      // (Requires adjusting the schema id type or using a separate mapping table)
    } catch (syncError) {
      console.warn('Failed to sync Etsy profile to Supabase:', syncError);
    }

    // Redirect back to the frontend with tokens in URL hash (safer than query params)
    // The frontend should parse this hash and store tokens in sessionStorage
    res.redirect(`/#access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);

  } catch (error: any) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect(`/?error=token_exchange_failed&details=${encodeURIComponent(error.message)}`);
  }
}