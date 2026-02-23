const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const crypto = require("crypto");
const cookieParser = require("cookie-parser"); // Added cookie-parser
const { generateCodeVerifier, generateCodeChallenge } = require("./pkceUtil");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cookieParser()); // Use cookie-parser middleware

// Home
app.get("/", (req, res) => {
  res.send(`<h1>Etsy OAuth Server Running ✅</h1><a href="/auth/etsy">Connect to Etsy</a>`);
});

// Step 1: Redirect to Etsy
app.get("/auth/etsy", (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Generate a random state string for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Store codeVerifier and state in cookies (httpOnly for security)
  res.cookie("etsy_code_verifier", codeVerifier, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production", // Secure only in production (HTTPS)
    sameSite: "lax", 
    maxAge: 300000 // 5 minutes expiration
  });
  
  res.cookie("etsy_oauth_state", state, { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", 
    maxAge: 300000 
  });

  const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&client_id=${process.env.ETSY_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.ETSY_REDIRECT_URI)}&scope=${encodeURIComponent(process.env.ETSY_SCOPES)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${state}`;

  console.log("🔗 Redirecting to:", authUrl);
  console.log("🔗 EXPECTED REDIRECT URI:", process.env.ETSY_REDIRECT_URI); // Debug log
  console.log("Generated State:", state);
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get("/auth/callback", async (req, res) => {
  console.log("✅ Callback query:", req.query);

  const { code, state, error } = req.query;
  
  // Retrieve stored values from cookies
  const codeVerifier = req.cookies.etsy_code_verifier;
  const storedState = req.cookies.etsy_oauth_state;

  if (error) {
    return res.send(`❌ OAuth Error: ${error}`);
  }
  if (!code) {
    return res.status(400).send("❌ Error: No code provided in callback");
  }

  // Validate state (CSRF Protection)
  if (!storedState || state !== storedState) {
    return res.status(400).send("❌ Invalid state parameter. Possible CSRF detected or cookie missing/expired.");
  }
  
  if (!codeVerifier) {
    return res.status(400).send("❌ Code verifier missing from cookies. Please try again.");
  }

  // Clear cookies after use
  res.clearCookie("etsy_code_verifier");
  res.clearCookie("etsy_oauth_state");

  res.write(`<h2>✅ Got Authorization Code!</h2><p>Code: ${code}</p><p>State Verified ✅</p><p>Exchanging for token...</p>`);

  try {
    const tokenResponse = await axios.post(
      "https://api.etsy.com/v3/public/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.ETSY_CLIENT_ID,
        redirect_uri: process.env.ETSY_REDIRECT_URI,
        code,
        code_verifier: codeVerifier
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const { access_token, refresh_token } = tokenResponse.data;
    console.log("✅ ACCESS TOKEN:", access_token);
    console.log("✅ REFRESH TOKEN:", refresh_token);
    
    // In a real app, save these to your DB!
    res.write(`<p>✅ Token Exchange Success!</p><pre>${JSON.stringify(tokenResponse.data, null, 2)}</pre>`);
    res.end();
    
  } catch (err) {
    console.error("❌ Token exchange failed:", err.response?.data || err.message);
    res.write(`<p style="color:red">❌ Token exchange failed: ${JSON.stringify(err.response?.data || err.message)}</p>`);
    res.end();
  }
});

// Refresh token route
app.get("/auth/refresh", async (req, res) => {
  const { refresh_token } = req.query;
  if (!refresh_token) return res.send("Provide refresh_token as query param");

  try {
    const refreshResponse = await axios.post(
      "https://api.etsy.com/v3/public/oauth/token",
      new URLSearchParams({
        grant_type: "refresh_token",
        client_id: process.env.ETSY_CLIENT_ID,
        refresh_token
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    res.json(refreshResponse.data);
  } catch (err) {
    res.status(500).send(err.response?.data || err.message);
  }
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
