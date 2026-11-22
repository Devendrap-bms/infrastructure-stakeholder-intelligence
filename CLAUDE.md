# CLAUDE.md - Infrastructure Stakeholder Intelligence Project Instructions

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-22

---

## Fixed Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui | Next.js 16.4.6, React 19.3.0 |
| Application Backend | Next.js Route Handlers | — |
| Database & Backend Platform | Convex | 1.50.0 |
| ML Service | Python, PyTorch, Hugging Face Transformers, FastAPI | Python 3.14.6, PyTorch 2.15.0+cu132 |
| Models | `google-bert/bert-base-multilingual-cased`, `FacebookAI/xlm-roberta-base` | — |
| Tooling | Bun, Biome, Git, GitHub | Bun 1.4.0, Biome 2.4.2, Git 2.55.0 |

**Constraints:**
- Only free/open-source tools and services
- Backend and ML development before full frontend integration
- Exactly two transformer models: mBERT and XLM-R
- Supported languages: English, Telugu, Romanized Telugu, Kannada, Romanized Kannada

---

## Team Roles (3 Developers)

| Developer | Name | Primary Ownership |
|-----------|------|-------------------|
| **Dev 1** | Coordinator | Core backend (Convex, auth, APIs, ML integration, knowledge graph, risk engine) |
| **Dev 2** | Akshay | ML/Python workstream (datasets, experiments, training, ML service, inference) |
| **Dev 3** | Lucky | Frontend development only (Next.js, UI, dashboard, project screens, integration) |

**Important Boundaries for Lucky (Dev 3):**
- Lucky must NOT own Convex backend
- Lucky must NOT train models or own ML service
- Lucky must NOT implement knowledge graph
- Lucky must NOT implement risk engine
- Full frontend integration waits for stable backend/ML contracts

---

## Current Repository Status (as of 2026-11-22)

- **Branch:** `develop` (clean, up to date with origin)
- **Phase:** Phase 0 (Environment & Repository Setup) - Complete
- **Working tree:** Clean, no uncommitted changes
- **Next:** Team confirmation of Phase 0, then Phase 1 kickoff

---

## Quick Start Commands

```bash
# Frontend (project root)
bun install
bun dev                    # http://localhost:3000

# Convex (second terminal)
bunx convex dev
bunx convex run health:ping

# ML Service (third terminal)
cd ml-service
.\.venv\Scripts\Activate.ps1
python -m uvicorn app.main:app --reload  # http://127.0.0.1:8000/health
```

---

## Key Documentation Files

- `CLAUDE.md` - This file (project instructions, stack, commands)
- `docs/IMPLEMENTATION_ROADMAP.md` - 10 phases with milestones
- `docs/TEAM_TASK_ASSIGNMENTS.md` - Developer responsibilities
- `docs/SHARED_CONTRACTS.md` - API contracts, data structures
- `docs/DEVELOPMENT_PROGRESS.md` - Ongoing progress tracking
- `docs/DECISION_LOG.md` - Architectural decisions
- `docs/PROGRESS.md` - Phase 0 verification

---

## Development Workflow

1. **Backend/ML first:** Dev 1 (Convex, auth, integration) + Dev 2 (ML) work in parallel after Phase 1
2. **Frontend last:** Dev 3 (Lucky) builds UI after API contracts stable (Phase 7+)
3. **Integration:** All three collaborate through shared contracts in SHARED_CONTRACTS.md
4. **Reviews:** Cross-developer code review (except self-contained ML experiments)
5. **Documentation:** Update relevant docs with each phase completion

---

## Git Workflow

- `main` = Final integrated application (protected)
- `develop` = Integration branch
- `feat/<developer-name>/<task-name>` = Feature branches from `develop`
- PRs: feature → develop → main (main for final integration only)

---

## Notes

- **Do not modify application source code** without explicit approval
- **Do not install packages or deploy** without approval
- **Only update documentation** as instructed
- **Three developers**: Coordinator (Dev 1), Akshay (Dev 2), Lucky (Dev 3)
- **Free tools only** - no paid APIs, hosting, or services