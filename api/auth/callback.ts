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
    
    // DEBUG MODE: Show tokens instead of redirecting
    res.status(200).send(`
      <h1>OAuth Callback Debugger 🎉</h1>
      <p><strong>Status:</strong> Success! Tokens received.</p>
      <hr>
      <h3>Access Token:</h3>
      <textarea rows="3" cols="80">${access_token}</textarea>
      <h3>Refresh Token:</h3>
      <textarea rows="3" cols="80">${refresh_token}</textarea>
      <hr>
      <p><strong>Next Step:</strong> Since we are in debug mode, automatic redirect is disabled.</p>
      <p><a href="/#access_token=${access_token}&refresh_token=${refresh_token}&expires_in=${expires_in}">Click here to manually finish login</a></p>
    `);

  } catch (error: any) {
    console.error('Token exchange error:', error.response?.data || error.message);
    
    // DEBUG MODE: Show detailed error
    res.status(500).send(`
      <h1>OAuth Callback Debugger ❌</h1>
      <p><strong>Status:</strong> Token Exchange Failed.</p>
      <hr>
      <h3>Error Message:</h3>
      <pre>${error.message}</pre>
      <h3>Error Details:</h3>
      <pre>${JSON.stringify(error.response?.data || {}, null, 2)}</pre>
      <hr>
      <p><strong>Debug Info:</strong></p>
      <ul>
        <li>Code: ${code}</li>
        <li>Verifier: ${codeVerifier ? 'Present ✅' : 'Missing ❌'}</li>
        <li>State: ${state === storedState ? 'Matched ✅' : 'Mismatch ❌'}</li>
      </ul>
      <p><a href="/api/auth/login">Try Login Again</a></p>
    `);
  }
}