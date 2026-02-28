import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state, error } = req.query;

  if (error) {
    return res.redirect(`/?error=${encodeURIComponent(error as string)}`);
  }

  if (!code) {
    return res.status(400).json({ error: 'No code provided' });
  }

  // Prevent any intermediary caching on OAuth callback endpoint
  res.setHeader('Cache-Control', 'no-store');

  // Retrieve code verifier and state from cookies
  const rawCookieHeader = req.headers.cookie || '';
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

  if (!rawCookieHeader || !codeVerifier || !storedState) {
    return res.status(400).json({
      error: 'No cookies found',
      hint: 'Start login from the same domain as callback (use https://etsyseolab-6.vercel.app).'
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
    
    // Redirect back to the frontend with tokens in URL hash (safer than query params)
    // The frontend should parse this hash and store tokens in sessionStorage
    res.redirect(`/#access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}`);

  } catch (error: any) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.redirect(`/?error=token_exchange_failed&details=${encodeURIComponent(error.message)}`);
  }
}