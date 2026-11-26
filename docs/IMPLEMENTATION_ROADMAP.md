# Implementation Roadmap

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-26
**Status:** Prompts 4-6 complete, awaiting approval for Prompt 7

---

## Developer Ownership Matrix

| Developer | Name | Primary Ownership | Cannot Own |
|-----------|------|-------------------|------------|
| **Dev 1** | Coordinator | Convex backend, auth, APIs, Knowledge Graph, Risk engine | Frontend UI implementation |
| **Dev 2** | Akshay | Datasets, ML experiments, model training, inference endpoints, Python/FastAPI ML service | Backend schema, frontend UI |
| **Dev 3** | Lucky | Frontend ONLY: Next.js, TypeScript, Tailwind, shadcn/ui, dashboard, UI integration | Convex backend, ML training, Knowledge Graph, Risk engine |

---

## Phase Status

| Phase | Name | Primary Owner | Secondary | Work Type | Status |
|-------|------|--------------|-----------|-----------|--------|
| 0 | Environment Setup | All | — | Verification | ✅ Verified |
| 1 | Core Backend Foundation | Dev 1 | — | Backend | ✅ Complete |
| 2 | Data Ingestion Infrastructure | Dev 1, Dev 2 | Lucky (UI prep only) | Mixed | ✅ Complete |
| 3 | ML Service Core | Dev 2 | Dev 1 (contracts) | ML | 🔄 Pending |
| 4 | Knowledge Graph Implementation | Dev 1 | Dev 2 (datasets) | Backend | ✅ Complete |
| 5 | Risk Analysis Engine | Dev 1 | — | Backend | ⏳ Not started |
| 6 | Backend Integration | Dev 1, Dev 2 | Lucky (frontend consumption) | Mixed | ⏳ Not started |
| 7 | MVP Frontend | Dev 3 | Dev 1, Dev 2 (support) | Frontend | ⏳ Not started |
| 8 | Testing | All | — | Testing | 🔄 In progress |
| 9 | Documentation & Handoff | All | — | Documentation | ⏳ Not started |

**Total estimated: 9 weeks from Phase 1 start (Phase 1-2 complete, 7 weeks remaining)**

---

## Implementation Milestones

| Milestone | Target | Status | Assigned To |
|-----------|--------|--------|-------------|
| M0: Tooling Ready | 2026-11-15 | ✅ Done | All |
| M1: Backend Ready | Week 2 | ✅ Done | Dev 1 |
| M2: Data Pipeline Ready | Week 3 | ✅ Done | Dev 1, Dev 2 |
| M3: ML Service Ready | Week 4 | ⏳ Not started | Dev 2 |
| M4: Knowledge Base Ready | Week 6 | ✅ Done | Dev 1 |
| M5: Risk Engine Working | Week 7 | ⏳ Not started | Dev 1 |
| M6: API Stable | Week 8 | ⏳ Not started | Dev 1, Dev 2 |
| M7: MVP Frontend Done | Week 10 | ⏳ Not started | Dev 3 |
| M8: Integration Verified | Week 11 | ⏳ Not started | All |
| M9: Release Ready | Week 12 | ⏳ Not started | All |

---

## Phase-by-Phase Assignments

### Phase 1: Core Backend Foundation (Week 1-2) ✅ Complete
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Convex schema definition | Dev 1 | `convex/schema.ts` | ✅ Done |
| Better Auth setup (email/password) | Dev 1 | @convex-dev/better-auth v0.13.1 | ✅ Done |
| Project CRUD operations | Dev 1 | `convex/projects.ts` | ✅ Done |
| Document mutations/queries | Dev 1 | `convex/documents.ts` | ✅ Done |
| Citizen feedback mutations/queries | Dev 1 | `convex/citizen_feedback.ts` | ✅ Done |
| Backend verification (`bun run build`) | Dev 1 | Build passes | ✅ Done |

**Files:** `convex/schema.ts`, `convex/auth.ts`, `convex/projects.ts`, `convex/documents.ts`, `convex/citizen_feedback.ts`
**Dependencies:** Phase 0 complete ✅

---

### Phase 2: Data Ingestion Infrastructure (Week 2-3) ✅ Complete
**Primary Owner: Developer 1 (documents), Dev 2 (datasets research)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Document storage with Convex file storage | Dev 1 | Upload/download workflow | ✅ Done |
| File validation (MIME, size 50MB) | Dev 1 | Validation logic | ✅ Done |
| Document metadata schema | Dev 1 | mimeType, documentType, fileSize fields | ✅ Done |
| Feedback submission & retrieval | Dev 1 | Full feedback CRUD | ✅ Done |
| Supported languages documented | Dev 1 | SHARED_CONTRACTS.md | ✅ Done |
| Feedback states documented | Dev 1 | processingStatus, classificationStatus, etc. | ✅ Done |
| Dataset research (infrastructure reports) | Dev 2 | Research list | ✅ Done |

---

### Phase 3: ML Service Core (Week 3-4) ⏳ Not Started
**Primary Owner: Developer 2 (Akshay)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Load mBERT (`google-bert/bert-base-multilingual-cased`) | Dev 2 | Model in memory | ⏳ Not started |
| Load XLM-R (`FacebookAI/xlm-roberta-base`) | Dev 2 | Model in memory | ⏳ Not started |
| Dataset preparation for training | Dev 2 | Cleaned, tokenised data | ⏳ Not started |
| Model training/validation | Dev 2 | Baseline metrics | ⏳ Not started |
| Implement `/health` endpoint | Dev 2 | Returns `models_loaded: true` | ⏳ Not started |
| Implement `/classify` endpoint | Dev 2 | Concern classification | ⏳ Not started |
| Implement `/extract` endpoint | Dev 2 | Entity extraction | ⏳ Not started |
| Generate experiment reports | Dev 2 | Metrics by language/category | ⏳ Not started |

**Dependencies:** Phase 1-2 complete ✅

---

### Phase 4: Knowledge Graph Implementation (Week 4-6) ✅ Complete
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Graph entities (7 types) | Dev 1 | `graph_entities` table | ✅ Done |
| Graph relationships | Dev 1 | `graph_relationships` table | ✅ Done |
| Evidence types | Dev 1 | verified_fact, reported_concern, inferred_relationship, unverified_hypothesis | ✅ Done |
| Confidence validation | Dev 1 | Range [0, 1] | ✅ Done |
| Type/ID validation in relationships | Dev 1 | Explicit table lookups | ✅ Done |
| Historical evidence (global) | Dev 1 | `historical_evidence` table | ✅ Done |
| Knowledge graph queries | Dev 1 | 18 exported functions in `convex/graph.ts` | ✅ Done |
| Unit tests | Dev 1 | 63 tests in `convex/graph.test.ts` | ✅ Done |

**Files:** `convex/graph.ts`, `convex/graph.test.ts`
**Test Results:** 135 total tests pass, 3 test files

---

### Phase 5: Risk Analysis Engine (Week 5-7) ⏳ Not Started
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Mitigation coverage matrix | Dev 1 | `mitigations` table | ✅ Created (no engine) |
| Risk scoring algorithm | Dev 1 | `priorityScore` calculation | ⏳ Not started |
| Risk prioritization | Dev 1 | Ranking logic | ⏳ Not started |

---

### Phase 6: Backend Integration (Week 6-8) ⏳ Not Started
**Primary Owner: Developer 1 (Coordinator) and Developer 2 (Akshay)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Backend API contracts | Dev 1 | SHARED_CONTRACTS.md v1.0 | ✅ Done |
| ML inference service integration | Dev 2 | FastAPI endpoints | ⏳ Not started |
| Frontend API consumption | Dev 3 | Client hooks | ⏳ Not started (waiting on Phase 7) |

**Dependencies:** Phase 5 (risk engine) - waiting to start

---

### Phase 7: MVP Frontend Implementation (Week 8-10) ⏳ Not Started
**Primary Owner: Developer 3 (Lucky)**

**Status:** Awaiting approved API contracts and Risk Engine

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Dashboard: project list, summary stats | Dev 3 | `/dashboard` page | ⏳ Not started |
| Project view: documents, feedback, concerns tabs | Dev 3 | `/projects/[id]` | ⏳ Not started |
| Knowledge graph UI | Dev 3 | Entity/relationship views | ⏳ Not started |
| Document upload interface | Dev 3 | Drag + drop | ⏳ Not started |
| Feedback submission form | Dev 3 | Multilingual form | ⏳ Not started |

**Dependencies:** Phase 6 (API contracts) - not started yet

---

### Phase 8: End-to-End Testing (Week 10-11) ⏳ Not Started
**Primary Owner: All Developers**

| Task | Status |
|------|--------|
| Backend unit tests | ✅ 135 tests pass |
| ML service unit tests | ⏳ Not started |
| Frontend unit tests | ⏳ Not started |
| E2E tests (user flows) | ⏳ Not started |
| Load testing | ⏳ Not started |

---

### Phase 9: Documentation & Handoff (Week 11-12) ⏳ Not Started
**Status:** Currently updating documentation

| Task | Status |
|------|--------|
| Update docs with Phase 1-6 learnings | ✅ In progress |
| Deployment guide | ⏳ Not started |
| API documentation | ✅ SHARED_CONTRACTS.md v1.0 |
| Handoff checklist | ⏳ Not started |
| Bug fixes and polish | ⏳ Not started |

---

## Workstream Dependencies

```
Dev 1 (Backend)                Dev 2 (ML)                   Dev 3 (Frontend/Lucky)

   M1-2 Complete ✅               │                            │
   ├── Auth, CRUD ────────────────┬────────────────────────────┐ │
   └── Knowledge Graph ───────────┬────────────────────────────┘ │
                                  M3 ⏳                        │
                                  ├── Models (mBERT, XLM-R)     │
                                  └── Endpoints                 │
                                                    │           │
                                                    M6/M7 ⏳     │
                                                    └── Frontend│
                                                              ⏳
```

---

## Notes

- **Dev 1 (Coordinator):** Owns Convex, auth, knowledge graph, risk engine, backend integration
- **Dev 2 (Akshay):** Owns datasets, ML experiments, model training, inference endpoints
- **Dev 3 (Lucky):** Owns frontend ONLY - dashboards, UI, integration via approved contracts
- **No overlap in core ownership** - boundaries are firm
- **All phases assume free/open-source only**

**Current Status:** Prompts 4-6 complete (authentication, documents, feedback, knowledge graph). 135 unit tests pass. Build verified (6 pages). Convex functions ready (8.92s).

**Next Step:** Awaiting approval for Prompt 7 (Risk Analysis Engine).