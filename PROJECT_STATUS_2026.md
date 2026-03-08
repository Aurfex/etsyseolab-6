# ETSY SEOLAB - Project Status & Roadmap
*Last Updated: 2026-03-08*

## Current State (What we just did)
We added a **Store Health Dashboard** on the `DashboardPage.tsx` to act as the primary "Wow Factor" for investor and immigration pitches. 

### ⚠️ IMPORTANT: Dashboard is currently a UI MOCK (Smoke & Mirrors)
The "Store Health Score" and the "✨ Fix All with AI" button on the Dashboard are currently **frontend UI mocks**. 
- When the user clicks "Fix All", it plays a 3-second loading animation and changes the score from C- to A+.
- **It does NOT actually connect to the Etsy API or OpenAI to bulk-update the live store.**
- This was done intentionally to have a safe, impressive demo for pitches without risking API rate limits or accidentally ruining the user's live Etsy store.

## Working Modules (Real Functionality)
The following modules have real, working logic connected to their respective APIs (though some may still use mocked local state depending on the `.env` setup):
- **Add Product:** Image upload, AI text generation (via OpenAI Vision/Gemini), variations, pricing CSV import, and direct Etsy API publish.
- **Autopilot AI (Phase 1.5):** Scans for issues, allows user to review AI suggestions, and requires manual "Save" (Human-in-the-loop).
- **Competitor Radar:** Keyword tracking and competitor listing comparison.
- **Image SEO:** WEBP conversion, 2000x2000 resizing, and AI-based file naming.
- **Pricing Calculator:** Calculates complex variations (Size x Material) and exports CSV.

## Next Steps (To-Do List)
To evolve this project from an MVP/Demo into a fully scalable product:

### 1. Pitch Prep (Business Side)
- Finalize the company name (`dXb Tech`).
- Create a "Coming Soon / Join Waitlist" landing page.
- Draft the Pitch Deck for IRAP/SUV, highlighting the "AI Co-pilot" feature and the need for a CTO (Dariush's brother) to scale the backend architecture.

### 2. Technical Roadmap (Engineering Side)
- **Make the Dashboard Real:** Connect the Dashboard's "Store Health" to an actual backend service that securely fetches Etsy listings, runs an AI audit in the background, and returns real scores.
- **Backend Scaling:** Move heavy AI operations (like bulk image processing and bulk SEO updates) to background queues (e.g., Redis/Celery or Vercel background functions) to prevent frontend timeouts.
- **API Resilience:** Implement robust error handling, retry logic, and queueing to respect Etsy and OpenAI's strict rate limits.
- **Database:** Replace local/mock states with a real database (PostgreSQL/Supabase) to store user profiles, scan histories, and AI generation credits.
