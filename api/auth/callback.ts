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

  // Retrieve code verifier and state from cookies
  const cookies = req.headers.cookie;
  if (!cookies) return res.status(400).json({ error: 'No cookies found' });

  const codeVerifier = cookies.split(';').find(c => c.trim().startsWith('etsy_code_verifier='))?.split('=')[1];
  const storedState = cookies.split(';').find(c => c.trim().startsWith('etsy_oauth_state='))?.split('=')[1];

  if (state !== storedState) {
    return res.status(400).json({ error: 'Invalid state parameter' });
  }

  if (!codeVerifier) {
    return res.status(400).json({ error: 'Missing code verifier in cookies' });
  }

  // Clear cookies
  res.setHeader('Set-Cookie', [
    'etsy_code_verifier=; Path=/; Max-Age=0',
    'etsy_oauth_state=; Path=/; Max-Age=0'
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