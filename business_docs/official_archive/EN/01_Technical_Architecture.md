# dXb Tech Inc. - Technical Architecture & Infrastructure
**Project:** Hasti AI (Etsyseolab-6) | **Date:** March 2026

## 1. System Overview
Hasti AI is a modern SaaS application built on a serverless architecture designed for high scalability, real-time data processing, and AI-driven insights. The platform acts as a bridge between Etsy's v3 API and advanced Large Language Models (LLMs).

## 2. Core Stack
- **Frontend:** React (Vite), Tailwind CSS, Lucide Icons.
- **Backend & Cloud:** Vercel (Serverless Functions), Node.js.
- **Database & Auth:** Supabase (PostgreSQL), Row Level Security (RLS).
- **Payment Gateway:** Stripe (Live Production Environment).
- **AI Engine:** Google Gemini (gemini-3-flash-preview / gemini-3.1-pro-preview).

## 3. Proprietary Technology: "Deep Fetch" & AI SEO
Our core IP lies in the custom `api/optimize.ts` and proxy functions. We bypass standard rate limits and unstructured data chaos by:
1.  **Batch Processing:** Fetching up to 200 listings via Etsy API pagination.
2.  **Vision-Powered Scoring:** Evaluating current listing health (A+ to C-) based on 2026 Etsy SEO algorithms (13 tags, title density, material specificity).
3.  **Contextual Generation:** The AI doesn't just generate text; it analyzes the specific niche (e.g., Jewelry) and generates occasion-aware, material-specific metadata that strictly adheres to Etsy's 20-character tag limits.

## 4. Security & Data Compliance
- **Token Management:** Etsy OAuth 2.0 tokens are securely synced and encrypted within Supabase `profiles` table.
- **Data Privacy:** User data is strictly isolated. AI models are explicitly prohibited from using customer data for public training. All proxy requests pass through secured Vercel backend routes using Shared Secrets to prevent unauthorized API access.