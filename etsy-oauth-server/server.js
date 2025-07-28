const express = require("express");
const dotenv = require("dotenv");
const axios = require("axios");
const crypto = require("crypto");
const { generateCodeVerifier, generateCodeChallenge } = require("./pkceUtil");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

let codeVerifier = "";
let storedState = "";

// Home
app.get("/", (req, res) => {
  res.send(`<h1>Etsy OAuth Server Running ✅</h1><a href="/auth/etsy">Connect to Etsy</a>`);
});

// Step 1: Redirect to Etsy
app.get("/auth/etsy", (req, res) => {
  codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Generate a random state string for CSRF protection
  storedState = crypto.randomBytes(16).toString("hex");

  const authUrl = `https://www.etsy.com/oauth/connect?response_type=code&client_id=${process.env.ETSY_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.ETSY_REDIRECT_URI)}&scope=${encodeURIComponent(process.env.ETSY_SCOPES)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${storedState}`;

  console.log("🔗 Redirecting to:", authUrl);
  console.log("Generated State:", storedState);
  res.redirect(authUrl);
});

// Step 2: Handle callback
app.get("/auth/callback", async (req, res) => {
  console.log("✅ Callback query:", req.query);

  const { code, state, error } = req.query;
  if (error) {
    return res.send(`❌ OAuth Error: ${error}`);
  }
  if (!code) {
    return res.status(400).send("❌ Error: No code provided in callback");
  }

  // Validate state
  if (state !== storedState) {
    return res.status(400).send("❌ Invalid state parameter. Possible CSRF detected.");
  }

  res.send(`<h2>✅ Got Authorization Code!</h2><p>Code: ${code}</p><p>State Verified ✅</p><p>Check console for token exchange...</p>`);

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
  } catch (err) {
    console.error("❌ Token exchange failed:", err.response?.data || err.message);
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
