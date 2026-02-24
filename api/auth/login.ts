import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Generate PKCE Code Verifier
function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

// Generate PKCE Code Challenge
function generateCodeChallenge(verifier: string) {
  return base64URLEncode(crypto.createHash('sha256').update(verifier).digest());
}

function base64URLEncode(buffer: Buffer) {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);
  const state = crypto.randomBytes(16).toString('hex');

  // Store verifier and state in cookies (secure, httpOnly)
  res.setHeader('Set-Cookie', [
    `etsy_code_verifier=${codeVerifier}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`,
    `etsy_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=300`
  ]);

  const scopes = process.env.ETSY_SCOPES || 'listings_r listings_w listings_d';
  const redirectUri = process.env.ETSY_REDIRECT_URI;
  const clientId = process.env.ETSY_CLIENT_ID;

  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'Missing environment variables (ETSY_CLIENT_ID or ETSY_REDIRECT_URI)' });
  }

  const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

  console.log('Redirecting to Etsy:', authUrl);
  
  // DEBUG MODE: Print URLs instead of redirecting
  res.status(200).send(`
    <h1>OAuth Debugger 🕵️‍♂️</h1>
    <p><strong>Configured Redirect URI (from env):</strong> <code>${redirectUri}</code></p>
    <p><strong>Full Auth URL (sent to Etsy):</strong> <br><a href="${authUrl}">${authUrl}</a></p>
    <hr>
    <h3>Instructions:</h3>
    <ol>
      <li>Check if "Configured Redirect URI" matches EXACTLY what is in Etsy Developer Console.</li>
      <li>Click the "Full Auth URL" link above to test the redirect manually.</li>
    </ol>
  `);
}