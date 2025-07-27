# AI Review Analyzer & Respond Module

**Purpose:**  
A comprehensive system to manage the entire lifecycle of customer reviews. It automates collection, sentiment analysis, and response generation, with a strong focus on a human-in-the-loop workflow for quality control. This module is architected with a production-ready, service-oriented backend.

## How It Works
1.  **Service-Oriented Backend:**
    - **Database Abstraction (`databaseService.ts`):** All data operations are handled by a dedicated service, making it easy to swap the current in-memory simulation with a real database like MongoDB or PostgreSQL.
    - **Etsy Integration (`etsyService.ts`):** Publishing replies is delegated to a specific service, providing a clear integration point for the real Etsy API.
    - **Notification Service (`notificationService.ts`):** Sending alerts for flagged reviews is handled by a dedicated service, ready to be connected to Slack, email (SendGrid), or other platforms.
2.  **AI Analysis & Generation:** Fetches new reviews and uses AI to:
    -   Run sentiment/emotion analysis (Positive, Negative, Neutral).
    -   Detect the review's language and generate a reply in the same language.
    -   Auto-flag negative or sensitive reviews, triggering alerts via the notification service.
3.  **Human-in-the-Loop Dashboard:** Displays all reviews in a central dashboard. For each review, an admin can:
    -   Generate an AI response.
    -   **Edit** the AI's suggestion directly in the UI.
    -   **Approve** the final response, making it ready for posting.
    -   **Reject** the response if it's unsuitable.
    -   Use pre-defined **Quick Replies** to speed up responses.
4.  **Publishing Workflow:** Once a response is approved, it can be published. The system calls the `etsyService` to handle the actual API communication.
5.  **Analytics & Trends:** An integrated analytics panel shows trends in customer satisfaction, including average ratings and sentiment distribution over time.
6.  **Audit Log:** Every action (generation, edit, approval, rejection, posting) is timestamped and recorded for full traceability.

## API & Architecture
The module is built with a secure, modular REST API.

-   `GET /api/reviews`: Fetches a list of all reviews with their current status and response data.
-   `POST /api/reviews`: Handles AI response generation, status updates, and text editing.

**Security:** The API now includes a simulated JWT authentication layer. All requests must include a valid `Authorization: Bearer <token>` header. The endpoint is ready for a real JWT validation library (like `jsonwebtoken`).

---

# Dynamic FAQ & Auto-Suggested Answers

**Purpose:**  
Builds and updates the FAQ section based on real customer queries, support tickets, and search trends.

## Features
- Scans incoming messages and top search terms to identify repeated or new question topics.
- Auto-generates FAQ entries with AI-generated answers.
- Allows staff to review, edit, and publish new FAQs from a dedicated dashboard.
- Uses the same secure, service-oriented architecture as the Review module.

## API
- `GET /api/faq`: Lists all current FAQs and suggested questions.
- `POST /api/faq`: Triggers actions like scanning for new questions, generating answers, and publishing FAQs.
---

# Voice/Video Shopping Assistant

**Purpose:**  
Enables users to interact with the shop via voice or video, enhancing the shopping experience.

## Features
- Voice-to-text and text-to-voice Q&A.
- Real-time product recommendations.
- (Optional) Video call with shop expert.

## API
- `POST /api/assistant` – submit and process voice/text queries
- `GET /api/assistant/video` – (Placeholder) initiate video session

## Setup
- Integrate with WebRTC for video (if used).
- Configure language support.
---

# Personalized Gift Recommendation Engine

**Purpose:**  
AI-powered engine to suggest the perfect gift for every occasion, based on user inputs and trends.

## Features
- Quick quiz to identify recipient profile and preferences.
- Dynamic product recommendations.
- Gift wrapping and note customization options.

## API
- `POST /api/gift/quiz` – process user quiz and return best-fit gifts
- `GET /api/gift/trends` – show trending gifts by occasion/season

## Setup
- Set up quiz questions/logic.
- Enable/disable specific occasions or price brackets.

---

# Deployment

This application is configured to run in a production environment (e.g., Docker) and requires server-side environment variables for its backend services.

## Environment Variables
Create a `.env` file in the root of your server environment and add the following variables:

```
# The API key for Google Gemini AI services.
API_KEY=your-gemini-api-key

# Etsy Application Credentials
ETSY_API_KEY=your-etsy-app-key
ETSY_OAUTH_TOKEN=your-generated-oauth-token-for-your-shop
ETSY_SHOP_ID=your-numeric-etsy-shop-id

# Server configuration
NODE_ENV=production
PORT=4173
```
- **`API_KEY`**: Your secret key for the Gemini API. All AI-powered features rely on this.
- **`ETSY_API_KEY`**: The key associated with your Etsy application.
- **`ETSY_OAUTH_TOKEN`**: The OAuth token required for making authenticated requests on behalf of your shop.
- **`ETSY_SHOP_ID`**: The unique numeric ID of your Etsy shop.

These variables are read by the backend API proxies and are **never exposed to the client**, ensuring a secure deployment.