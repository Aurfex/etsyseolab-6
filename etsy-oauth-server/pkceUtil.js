const crypto = require("crypto");

function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

function generateCodeChallenge(verifier) {
  return base64URLEncode(crypto.createHash("sha256").update(verifier).digest());
}

function base64URLEncode(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

module.exports = { generateCodeVerifier, generateCodeChallenge };
