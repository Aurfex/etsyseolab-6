Etsyseolab (Hasti AI) – Technical R&D Roadmap for IRAP Support
Date: March 19, 2026
Project Duration: 12 months (April 2026 – March 2027)
Requested IRAP Contribution: $140,000 (70% of total $200,000 project cost)
Goal: Scale from current MVP to production-ready platform supporting 10,000+ active users with proprietary AI and fully autonomous backend.
Phase 1: Q2 2026 (Months 1–3) – Foundation & Queue System
Milestones & Deliverables:

Implement Redis + BullMQ queue system for async AI tasks
Build cron scheduler for true Autopilot (daily/weekly runs)
Rate-limit handling + retry logic for Etsy API & Gemini
Success KPIs:
95% task success rate under 5x load simulation
Average optimization time reduced from 8s to <2s
Deliverable: Production-ready background job system (deployed on Vercel)

Phase 2: Q3 2026 (Months 4–6) – Data Lake & Model Fine-tuning
Milestones & Deliverables:

Build secure anonymized Data Lake (Supabase + S3) with 50k+ historical listings
Fine-tune Llama-3-8B on proprietary e-commerce SEO dataset
Vision-powered scoring model (A+ to C-) fully custom
Success KPIs:
AI operational cost per optimization reduced by ≥65%
Keyword/tag accuracy improved by ≥25% vs Gemini baseline
Deliverable: First version of proprietary “Hasti Model” (internal API)

Phase 3: Q4 2026 (Months 7–9) – Advanced Backend & Security
Milestones & Deliverables:

Keyword clustering + internal linking engine
Full admin panel, logging, error monitoring (Sentry), rate limiting
Team accounts + review/editor workflow (from mock to real)
Success KPIs:
System handles 10k concurrent optimizations/day
Zero critical security incidents in penetration test

Phase 4: Q1 2027 (Months 10–12) – Scaling & Validation
Milestones & Deliverables:

Full production rollout + A/B testing with beta users
Comprehensive documentation + handover to new developer
Commercialization report (impact on Canadian SMEs)
Success KPIs:
10,000+ active users capability confirmed
Waitlist conversion rate ≥15%

Total Budget Breakdown (12 months):

Founder + 1 new developer salary: $140,000
Cloud/Subcontractor (S3, Redis, testing): $60,000
IRAP ask: $140,000 (70%)

Risks & Mitigation: Rate-limit changes → multi-LLM fallback; Data privacy → full anonymization + RLS.
Conclusion:
This milestone-driven roadmap transforms our live MVP into a scalable, proprietary AI platform that directly empowers thousands of Canadian SMEs. IRAP support will enable original R&D that no off-the-shelf solution can provide.