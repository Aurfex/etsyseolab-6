# Technical Architecture & AI Manifesto
**Product:** Hasti AI (Etsyseolab)
**Context:** For Technical Reviewers, IRAP, and SUV Incubators

## 1. High-Level Architecture Overview
Hasti AI is built as a modern, decoupled web application utilizing a serverless architecture to ensure high availability, rapid scaling, and low operational overhead. 

### Core Tech Stack:
- **Frontend:** React 19 / Next.js (via Vite for initial rapid prototyping, transitioning to full Next.js for SSR/SEO).
- **Styling:** Tailwind CSS (providing the custom "Hasti AI" design system with fluid animations, glassmorphism, and responsive layouts).
- **Hosting/Deployment:** Vercel (Edge network deployment for sub-50ms latency globally).
- **State Management:** React Context API (handling complex OAuth session states, product caches, and user preferences).
- **Data Visualization:** Recharts (for the Competitor Radar and Sales Intelligence modules).

## 2. Artificial Intelligence Integration
The "brain" of Hasti AI relies on integrating foundational Large Language Models (LLMs) with specific, proprietary e-commerce prompt engineering.

- **Primary Models:** OpenAI (GPT-4o) and Google GenAI (Gemini 2.5).
- **Implementation Strategy:** 
  We do not rely on generic API calls. Hasti AI uses "Context-Injected Prompting." When a user asks to optimize a listing, the system bundles:
  1. The current Etsy Title & Description.
  2. The current Tags.
  3. Competitor keyword density (from Radar).
  4. Platform-specific constraints (e.g., Etsy's 140-character title limit, 20-character tag limit).
- **Result:** The LLM returns structured JSON data containing highly targeted, platform-compliant SEO metadata which is then parsed and pushed directly to the user's store.

## 3. Data Flow & Third-Party APIs
Hasti AI acts as an intelligent middleware between the seller, the marketplace, and the AI.

1. **Authentication (Etsy API v3):** 
   - Implementation of secure OAuth 2.0 flow with PKCE (Proof Key for Code Exchange).
   - Secures specific read/write scopes (`listings_r`, `listings_w`, `shops_r`).
2. **Data Ingestion:**
   - Fetching active, draft, and expired listings securely via REST.
   - Normalizing Etsy's complex nested JSON structures into a flat, fast `Product` interface for the frontend.
3. **The "Fix All" Loop (Write Operations):**
   - User clicks "Fix All".
   - App batches products needing attention.
   - Node.js serverless functions (Vercel Functions) handle API rate-limiting and send payloads to the LLM.
   - LLM responses are validated (ensuring no tag exceeds 20 characters).
   - Validated data is sent via `PUT/PATCH` requests back to the Etsy API to update the live listings.

## 4. Cross-Platform Module: Shopify Migration Engine
To facilitate the CSV export feature:
- The system maps the normalized Etsy `Product` interface against Shopify's rigid CSV schema.
- Handles complex string escaping for HTML descriptions.
- Generates dynamic "Handles" (slugs) from Etsy titles.
- Maps image URLs to the `Image Src` column, allowing Shopify's servers to pull media directly during import, bypassing the need to download/upload gigabytes of image data locally.

## 5. Security & Privacy
- **Stateless Architecture (Current Phase):** To maximize privacy during the MVP phase, user data and OAuth tokens are handled primarily in secure `sessionStorage` and passed directly to API endpoints. No proprietary store data is permanently stored on our servers.
- **Future Database Phase (Supabase/PostgreSQL):** As we scale to background "Autopilot" features, we will implement Row Level Security (RLS) to ensure user data is isolated at the database level, encrypted at rest.

## 6. Scalability Plan (IRAP / SUV Focus)
The current architecture is designed to validate product-market fit. To scale to 10,000+ active users, the technical roadmap includes:
1. **Queueing Systems:** Implementing Redis/RabbitMQ to handle background "Autopilot" optimizations without hitting Etsy/OpenAI rate limits during peak usage.
2. **Proprietary Data Lake:** Scraping and anonymizing successful Etsy listings to fine-tune our own smaller, specialized models (e.g., Llama 3) to reduce dependency on expensive OpenAI calls and increase margin.