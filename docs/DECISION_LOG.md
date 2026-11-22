# Decision Log

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-22

---

## Purpose

This document tracks all architectural decisions, unresolved questions, and blockers for the team. Each entry includes:

- **Date** of decision/discussion
- **Status**: ✅ Decided | ⏳ Pending Coordinator Approval | ❌ Rejected | ⚠️ Blocked
- **Participants**: Who was involved
- **Decision**: The choice made
- **Rationale**: Why this choice
- **Consequences**: Impact on implementation
- **Next Review**: When to re-evaluate

---

## Resolved Decisions

### 001: Technology Stack Lock-In
- **Date:** 2026-11-15
- **Status:** ✅ Decided
- **Participants:** Team
- **Decision:** Fixed stack as documented:
  - Frontend: Next.js 16.4.6, React 19.3.0, Tailwind CSS 4.3.3, shadcn/ui (Base UI, Nova)
  - Backend: Convex 1.50.0
  - ML: Python 3.14.6, PyTorch 2.15.0+cu132, FastAPI 0.163.1, Transformers 5.23.0
  - Tooling: Bun 1.4.0, Biome 2.4.2, Git 2.55.0
- **Rationale:** Team consensus, free tier available
- **Consequences:** No further version proposals without team vote. Versions must be verified against actual repository and environment before production use.
- **Next Review:** N/A (locked until Phase 9 free-tier check)

### 002: Branch Strategy
- **Date:** 2026-11-15
- **Status:** ✅ Decided
- **Participants:** Team
- **Decision:**
  - `main` = Final integrated application only (protected)
  - `develop` = Integration branch
  - `feat/<developer-name>/<task-name>` = Feature branches from `develop`
  - PRs: feature → develop → main (main for final integration only)
- **Rationale:** Standard trunk-based development with phase-gated integration; feature branch naming uses developer name for ownership clarity
- **Consequences:** All work reviewed via PR, develop always merge-ready
- **Next Review:** N/A

### 003: Three-Developer Team Structure
- **Date:** 2026-11-22
- **Status:** ✅ Decided (confirmed)
- **Participants:** Coordinator (Dev 1), Akshay (Dev 2), Lucky (Dev 3)
- **Decision:** Three developers with clear ownership:
  - **Dev 1 (Coordinator):** Core backend (Convex, auth, APIs, ML integration, knowledge graph, risk engine, mitigation analysis, prioritisation, integration testing)
  - **Dev 2 (Akshay):** ML/Python workstream (datasets, experiments, training, ML service, inference)
  - **Dev 3 (Lucky):** Frontend development only (Next.js, UI, dashboard, project screens, integration)
- **Rationale:** Balanced workload, clear expertise areas, enables parallel development
- **Consequences:** Dev 3 cannot own Convex, ML training, knowledge graph, or risk engine
- **Next Review:** N/A

### 004: Lucky's Ownership Boundaries (Confirmed)
- **Date:** 2026-11-22
- **Status:** ✅ Decided
- **Participants:** Team
- **Decision:** Lucky must NOT own:
  - Convex backend or schema
  - ML model training or experimentation
  - Knowledge graph implementation
  - Risk engine implementation
  - Mitigation analysis or prioritisation
- **Rationale:** Prevents ownership overlap, enables parallel development
- **Consequences:** Dev 3 uses contracts only; cannot modify backend/ML
- **Next Review:** N/A

### 005: Language Support
- **Date:** 2026-11-15
- **Status:** ✅ Decided
- **Participants:** Team
- **Decision:** Support 5 language variants:
  - English (en)
  - Telugu (te - native script)
  - Romanized Telugu (te-Latn)
  - Kannada (kn - native script)
  - Romanized Kannada (kn-Latn)
- **Rationale:** Project goals require processing citizen feedback in native script and Romanized forms
- **Consequences:** ML models and tokenizers must handle all 5; may need transliteration preprocessing for Romanized forms
- **Next Review:** Phase 4 classification accuracy by language

---

## Pending Coordinator Approval

### 006: Convex Deployment Sharing Model
- **Date:** 2026-11-22
- **Status:** ⏳ Pending Coordinator Approval
- **Participants:** Dev 1 (Coordinator), All
- **Decision:** TBD
- **Rationale:** Need to decide before Phase 1 starts. All developers work within one shared Convex project. Each developer uses their own personal development deployment. A shared integration deployment is added for testing and staging.
- **Options:**

| Option | Description | Advantages | Disadvantages |
|--------|-------------|------------|---------------|
| **One shared dev deployment** | All 3 devs use same Convex project | Simple setup, real collaboration, no sync issues | Potential data conflicts, schema change coordination required |
| **Separate deployment per developer** | Each dev has own Convex project | Complete isolation, safe to experiment, no coordination needed | Sync overhead, need to merge data between dev environments |
| **Shared integration deployment** | Dedicated deployment for integration testing | Real integration testing, mirrors production | Requires coordination for data setup |
- **Technical Implications:**
  - One shared: All mutations/queries hit same DB; need coordination protocol
  - Separate: Need sync script or manual export/import for integration testing
  - Shared integration: One deployment serves as integration/staging environment
- **Free-tier Limitations:** Convex free/Starter plan includes 40 deployments per project/organization (shared limit across all developers) [[Convex Pricing](https://www.convex.dev/pricing)]. Each developer has their own dev deployment by default. Preview deployments are temporary (5-day expiry, auto-cleaned). [[Convex Multiple Deployments](https://docs.convex.dev/production/multiple-deployments)]
- **Recommendation:** All developers use one shared Convex project. Each developer uses their own personal development deployment. Add one shared integration deployment for testing and staging. Schema changes require coordination protocol.
- **Next Review:** Phase 1 kickoff

---

### 007: Authentication Provider Selection
- **Date:** 2026-11-22
- **Status:** ⏳ Pending Coordinator Approval
- **Participants:** Dev 1 (Coordinator), All
- **Decision:** TBD
- **Rationale:** Required for Phase 1; must be free tier only
- **Options:**

| Option | Description | Advantages | Disadvantages |
|--------|-------------|------------|---------------|
| **Convex Auth v2** | Built-in authentication for Convex (officially recommended for new projects) | Seamless integration, automatic user table, free tier, no external service, officially recommended | Limited providers (Apple, Google, GitHub OAuth only), less customization |
| **Clerk free tier** | Clerk's free tier with sign-in/up | Mature UX, extensive provider support, good docs | Free tier limits (50,000 MRUs/app, 3 dashboard seats), requires separate setup, vendor lock-in risk |
| **BetterAuth** | Open-source authentication framework with Convex integration | Full control, no vendor lock-in, extensible plugins, supports 50+ providers | Self-hosted, requires @convex-dev/better-auth integration package, more initial setup, requires working proof of concept before approval |
| **Custom Convex-based** | Email/password stored in Convex | Full control, no external dependencies, fits free tier | More work, security implementation needed, need to handle emails/verification |
- **Technical Implications:**
  - Convex Auth v2: Auto-generates `users` table; integrates with Convex queries. Supports: email/password, username/password, passkeys, OAuth (Apple, Google, GitHub). Officially recommended by Convex for new projects. [[Convex Auth Docs](https://docs.convex.dev/auth/convex-auth)]
  - Clerk: Requires separate provider setup, webhooks to sync users. Free tier: 50,000 Monthly Retained Users, 3 dashboard seats, 1,000 API key creations/month, 100,000 verifications/month. [[Clerk Pricing](https://clerk.com/pricing)]
  - BetterAuth: Self-hosted TypeScript framework, supports 50+ providers including OAuth, email, passkeys, social logins. Integrates via @convex-dev/better-auth package. More complex than Convex Auth v2 because it requires separate server setup and custom configuration, but offers more flexibility. Requires a working proof of concept before final approval. [[BetterAuth Docs](https://www.betterauth.com/)]
  - Custom: Need to implement hashing, email verification, password reset
- **Free-tier Limitations:**
  - Convex Auth v2: Included in free tier, 40 deployments per project/organization
  - Clerk: 50,000 MRUs per app, 3 dashboard seats, no SMS/authentication limits
- **Recommendation:** BetterAuth is the coordinator's preferred option - open-source, extensible, supports multiple providers, aligns with free tools only constraint. Requires @convex-dev/better-auth integration package and more setup than Convex Auth v2. Convex officially recommends Convex Auth v2 for new projects. A working proof of concept is required before final approval.
- **Next Review:** Phase 1 start (Week 1)

---

### 008: Evidence Corpus Source
- **Date:** 2026-11-22
- **Status:** ⏳ Pending Coordinator Approval
- **Participants:** Dev 1, Dev 2 (Akshay)
- **Decision:** TBD
- **Rationale:** Historical evidence needed for Phase 4 knowledge graph; must be free/open-source only
- **Options:**

| Option | Description | Advantages | Disadvantages |
|--------|-------------|------------|---------------|
| **Genuine open government datasets** | Real infrastructure reports, public records | Realistic data, authentic evidence, production-quality | Hard to find, may have licensing restrictions, quality varies |
| **Synthetic fixtures** | Clearly labelled placeholder data | Fast to create, fully controllable, good for testing | Not real evidence, may not reflect real patterns, must label clearly |
| **Combination** | Both synthetic (dev) and genuine (staging/production) | Flexible, realistic where available, reliable for testing | More work, need clear separation, maintenance overhead |
- **Technical Implications:**
  - Open data: Need to find, parse, and index from PDFs/CSV/HTML
  - Synthetic: Generate JSON/CSV with known patterns
  - Combination: Use env var to switch data source
- **Free-tier Limitations:** None direct; data download must be from free sources
- **Recommendation:** Combination - synthetic fixtures for development/testing, genuine open data for staging when available
- **Next Review:** Phase 4 (Knowledge Graph)

**Note:** Convex free/Starter plan provides 40 deployments per project/organization, sufficient for dev and potential staging environments. [[Convex Pricing](https://www.convex.dev/pricing)]

---

### 009: Romanized Language Handling
- **Date:** 2026-11-22
- **Status:** ⏳ Pending Coordinator Approval
- **Participants:** Dev 2 (Akshay), Dev 1
- **Decision:** TBD
- **Rationale:** Romanized Telugu/Kannada users may type in Latin script; performance unknown
- **Options:**

| Option | Description | Advantages | Disadvantages |
|--------|-------------|------------|---------------|
| **Direct classification** | Run models on Romanized input directly | Simple, no preprocessing, uses existing model capabilities | May have lower accuracy, model trained on native scripts |
| **Transliteration to native script** | Convert Latin to native before inference | Potentially higher accuracy, matches training data | Additional preprocessing step, transliteration errors could compound |
| **Experimental comparison** | Build both, evaluate on test set | Data-driven decision, best performance | More development time, need labeled Romanized test set |
- **Technical Implications:**
  - Direct: Test mBERT/XLM-R on Romanized input, measure F1 per language variant
  - Transliteration: Need transliteration library (e.g., Indic transliteration)
  - Comparison: Parallel pipeline, metrics collection, A/B testing setup
- **Free-tier Limitations:** Transliteration libraries must be open-source (all options are)
- **Recommendation:** Experimental comparison - build both approaches with small test set, measure accuracy separately for Romanized vs native
- **Next Review:** Phase 4 (Classification accuracy review)

**Note:** Models: mBERT (`google-bert/bert-base-multilingual-cased`) and XLM-R (`FacebookAI/xlm-roberta-base`) are correctly specified. Hardware verification (CUDA, PyTorch) has been moved to development environment documentation.

---

### 010: Testing Framework Selection
- **Date:** 2026-11-22
- **Status:** ⏳ Pending Coordinator Approval
- **Participants:** Dev 3 (Lucky), All
- **Decision:** TBD
- **Rationale:** Need unit tests, E2E tests (Phase 8); must integrate with existing stack
- **Options:**

| Option | Frontend (Next.js) | Python (ML) | Advantages | Disadvantages |
|--------|-------------------|-------------|------------|---------------|
| **Vitest** | Unit/Component | Run in parallel | Fast, same config as Vite, built-in mocking, TS support | Limited ecosystem vs Jest |
| **Jest** | Unit/Component | Run in parallel | Mature ecosystem, extensive plugins, snapshot testing | Slower, separate from Vite, config complexity for Next.js |
- **Python ML Service:**
  - **pytest**: Industry standard, rich fixtures, good FastAPI integration
  - **unittest**: Built-in, no dependencies, verbose configuration needed
- **Technical Implications:**
  - Vitest: Works with Vite/Tailwind config. Does not support async Server Components. [[Next.js Vitest Guide](https://nextjs.org/docs/app/guides/testing/vitest)]
  - Jest: Separate runner, need to configure for Next.js, does not support async Server Components. [[Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)]
  - pytest: Best integration with FastAPI testclient
- **Free-tier Limitations:** All are open-source, no limits
- **Recommendation:** Vitest for frontend unit/component tests, pytest for Python ML tests, Playwright for browser-based E2E tests including async Server Component flows
- **Next Review:** Phase 8 (Testing phase)

---

## Open Blockers

### B001: Smart App Control (Windows 11)
- **Date:** 2026-11-15
- **Status:** ⚠️ Blocked (Windows-only issue)
- **Impact:** High - prevents PyTorch from loading on some Windows machines (WinError 4551: Application Control policy has blocked this file)
- **Owner:** All Windows developers
- **Workaround:** Diagnostic-first approach:
  1. Verify the specific DLL loading error occurs
  2. Check if the error is specifically Smart App Control related (WinError 4551)
  3. If confirmed, document the exact error and environment
  4. Evaluate turning off Smart App Control as a last resort (Windows Security → App and browser control → Smart App Control settings)
  5. Only apply on personal devices; install software from official sources only
- **Resolution needed:** Document diagnostic steps in SETUP_GUIDE.md; test on all machines before applying workaround

### B002: Second Team Member Setup Not Reproducible
- **Date:** 2026-11-15
- **Status:** ⏳ Pending
- **Impact:** Medium - team onboarding risk
- **Owner:** Not yet identified — coordinator confirmation required
- **Action:** The specific team member whose setup remains unverified must complete SETUP_GUIDE.md steps independently and confirm success
- **Next Review:** Before Phase 1 start

### B003: Production Build Verification Missing
- **Date:** 2026-11-22
- **Status:** ⏳ Pending
- **Impact:** Medium - potential deployment issues
- **Owner:** Dev 1, Dev 3 (Lucky)
- **Action:** Run `bun run build` in Phase 1, document any issues
- **Note:** Report says "configured and verified" on 2026-11-15, but should re-verify on fresh environment
- **Next Review:** Phase 1 (before starting work)

---

## Notes

- **Updated per phase** - Each Phase 1-9 must update this log
- **Decisions require team discussion** - No unilateral technical decisions
- **Blocked items are risks** - Document workarounds and action owners
- **Free tier constraints apply** - all services must fit within free limits
- **Developer ownership boundaries are firm** - Lucky cannot touch backend/ML internals