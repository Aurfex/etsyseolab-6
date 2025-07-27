/*
📂 Module: loyalty-referral.ts
Purpose:
سیستم اتوماتیک وفاداری و معرفی مشتری (Referral) با مدیریت جوایز و پیشنهادات هوشمند.

What it does:
اختصاص امتیاز/هدیه به مشتریان بر اساس خرید، معرفی دوستان، یا فعالیت در شبکه‌های اجتماعی.

پیشنهاد پاداش اتوماتیک.

داشبورد پیگیری و تاریخچه امتیازات.
*/

// README: # Loyalty & Referral Program

/**
 * **Purpose:**  
 * Rewards loyal customers and incentivizes referrals with automated, personalized offers.
 *
 * ## Features
 * - AI recommends tailored rewards based on activity.
 * - Manages referral codes and tracks sign-ups/purchases.
 * - Real-time leaderboard and reward status for users.
 *
 * ## API
 * - `POST /api/loyalty/track` – log activity and assign points
 * - `POST /api/loyalty/redeem` – handle reward redemption
 * - `GET /api/loyalty/status` – view user point/reward status
 *
 * ## Setup
 * - Set earning and redemption rules.
 * - Define notification settings for rewards and new referrals.
 */
