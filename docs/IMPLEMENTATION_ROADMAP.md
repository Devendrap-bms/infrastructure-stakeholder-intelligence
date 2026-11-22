# Implementation Roadmap

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-22
**Status:** Phase 0 complete, awaiting team confirmation to start Phase 1

---

## Developer Ownership Matrix

| Developer | Name | Primary Ownership | Cannot Own |
|-----------|------|-------------------|------------|
| **Dev 1** | Coordinator | Convex backend, auth, APIs, ML integration, knowledge graph, risk engine, mitigation analysis, prioritisation | Frontend UI implementation |
| **Dev 2** | Akshay | Datasets, ML experiments, model training, inference endpoints, Python/FastAPI ML service, experiment reports | Backend schema, frontend UI |
| **Dev 3** | Lucky | Frontend ONLY: Next.js, TypeScript, Tailwind, shadcn/ui, dashboard, UI integration, mock components | Convex backend, ML training, knowledge graph, risk engine |

---

## Phase Overview

| Phase | Name | Primary Owner | Secondary | Work Type | Status |
|-------|------|--------------|-----------|-----------|--------|
| 0 | Environment Setup | All | — | Verification | ✅ Verified |
| 1 | Core Backend Foundation | Dev 1 | — | Backend | 🔄 Planned |
| 2 | Data Ingestion Infrastructure | Dev 1, Dev 2 | Lucky (UI prep only) | Mixed (Backend + ML prep + UI mockups) | 🔄 Planned |
| 3 | ML Service Core | Dev 2 | Dev 1 (contracts) | ML | 🔄 Planned |
| 4 | Knowledge Graph Implementation | Dev 1 | Dev 2 (datasets) | Backend | 🔄 Planned |
| 5 | Risk Analysis Engine | Dev 1 | — | Backend | 🔄 Planned |
| 6 | Backend Integration | Dev 1, Dev 2 | Lucky (frontend consumption) | Mixed (Backend + ML + Frontend integration) | 🔄 Planned |
| 7 | MVP Frontend | Dev 3 | Dev 1, Dev 2 (support) | Frontend | 🔄 Planned |
| 8 | Testing | All | — | Testing | 🔄 Planned |
| 9 | Documentation & Handoff | All | — | Documentation | 🔄 Planned |

**Total estimated: 9 weeks from Phase 1 start**

---

## Phase-by-Phase Assignments

### Phase 1: Core Backend Foundation (Week 1-2)
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Convex schema definition (projects, documents, feedback, users, concerns) | Dev 1 | — | `convex/schema.ts` |
| Authentication provider selection (free tier) | Dev 1 | Dev 2, Dev 3 | Decision + auth endpoint |
| Basic CRUD mutations/queries for Project, Document | Dev 1 | Dev 3 | Convex functions |
| Document metadata schema | Dev 1 | — | Field definitions |
| Backend foundation verification | Dev 1 | All | `bun run build` passes |

**Dependencies:** Phase 0 complete
**Cannot start until:** Team confirmation of Phase 0

---

### Phase 2: Data Ingestion Infrastructure (Week 2-3)
**Primary Owner: Developer 1 (Coordinator) and Developer 2 (Akshay)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Document storage strategy (Convex file storage) | Dev 1 | Dev 3 | Architecture decision |
| Document metadata structure | Dev 1 | — | Schema fields |
| Backend feedback mutation | Dev 1 | — | `feedback:insert` |
| Dataset research (infrastructure reports, historical data) | Dev 2 | — | Source list |
| ML data preprocessing pipeline | Dev 2 | Dev 1 | Data preparation scripts |
| UI layout mockups (mock data only) | Dev 3 | — | Wireframes, component structure |
| Reusable UI components (forms, tables, cards) | Dev 3 | — | shadcn/ui based |

**Dependencies:** Phase 1 schema complete
**Notes:** Lucky only prepares UI layout and components with mock data - no backend integration

---

### Phase 3: ML Service Core (Week 3-4)
**Primary Owner: Developer 2 (Akshay)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Load mBERT (`google-bert/bert-base-multilingual-cased`) | Dev 2 | Dev 1 | Model in memory |
| Load XLM-R (`FacebookAI/xlm-roberta-base`) | Dev 2 | Dev 1 | Model in memory |
| Dataset preparation for training | Dev 2 | — | Cleaned, tokenised data |
| Model training/validation | Dev 2 | — | Baseline metrics |
| Implement `/health` endpoint | Dev 2 | Dev 1 | Returns `models_loaded: true` |
| Implement `/classify` endpoint | Dev 2 | Dev 1 | Concern classification |
| Implement `/extract` endpoint | Dev 2 | Dev 1 | Entity extraction |
| Generate experiment reports | Dev 2 | — | Metrics by language/category |

**Dependencies:** Phase 1 (schema for expected outputs), Phase 2 (datasets)
**Dev 1 involvement:** Reviews contracts for expected ML outputs

---

### Phase 4: Knowledge Graph Implementation (Week 4-6)
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Infrastructure taxonomy tables | Dev 1 | — | `infrastructure_types`, `categories` |
| Knowledge graph relationships | Dev 1 | Dev 2 | Links to evidence |
| Historical evidence corpus ingestion | Dev 1 | Dev 2 | Evidence documents in Convex |
| Evidence data integration | Dev 1 | Dev 2 | Source data loaded |
| Evidence search indexing | Dev 1 | — | Queryable search |

**Dependencies:** Phase 2 (data structures), Phase 3 (ML categories for evidence linking)
**Dev 2's role:** Supplies researched datasets - **NOT** knowledge graph implementation

---

### Phase 5: Risk Analysis Engine (Week 5-7)
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Mitigation coverage matrix | Dev 1 | — | `mitigations` table |
| Risk scoring algorithm | Dev 1 | — | `priorityScore` calculation |
| Explainable prioritisation | Dev 1 | — | Factors documented |
| Concerns linking to mitigations | Dev 1 | Dev 2 | Mitigation status field |

**Dependencies:** Phase 3 (classification categories), Phase 4 (evidence, mitigations)

---

### Phase 6: Backend Integration (Week 6-8)
**Primary Owner: Developer 1 (Coordinator) and Developer 2 (Akshay)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Backend API contracts (SHARED_CONTRACTS.md v1.0) | Dev 1 | All | Final contract |
| ML inference service integration | Dev 2 | Dev 1 | API endpoint docs |
| Frontend API consumption patterns | Dev 3 | Dev 1 | Client code |

**Dependencies:** Phase 5 (risk engine complete)
**Notes:** Lucky uses approved contracts - does not co-own backend or ML services

---

### Phase 7: MVP Frontend Implementation (Week 8-10)
**Primary Owner: Developer 3 (Lucky)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Dashboard: project list, summary stats | Dev 3 | Dev 1 | `/dashboard` page |
| Project view: documents, feedback, concerns tabs | Dev 3 | Dev 1 | `/projects/[id]` |
| Concern list: filterable, sortable, prioritised | Dev 3 | Dev 1 | Table with priority badges |
| Evidence viewer: search, relevance highlight | Dev 3 | Dev 1 | `/evidence/[id]` |
| Document upload interface | Dev 3 | Dev 1 | Drag + drop + validation |
| Feedback submission form | Dev 3 | Dev 1 | Multilingual support |
| Risk visualisation components | Dev 3 | Dev 1 | Charts from risk scores |
| Reports and Q&A interface | Dev 3 | Dev 1 | Query results display |
| Responsive design | Dev 3 | — | Mobile + desktop |
| Accessibility (WCAG AA) | Dev 3 | — | ARIA, keyboard nav |

**Dependencies:** Phase 6 (API contracts stable)
**Lucky's boundaries:** Uses contracts only; cannot modify backend/ML

---

### Phase 8: End-to-End Testing (Week 10-11)
**Primary Owner: All Developers**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Backend unit tests | Dev 1 | Dev 3 | 80%+ coverage |
| ML service unit tests | Dev 2 | Dev 1 | 80%+ coverage |
| Frontend unit tests | Dev 3 | Dev 1 | 80%+ coverage |
| E2E tests (user flows) | Dev 3 | All | Critical paths |
| Load testing | Dev 3 | — | 10 concurrent users, p95 <500ms |
| Integration testing | Dev 1 | All | Cross-service validation |

**Dependencies:** Phase 7 (frontend complete)
**Dev 1 coordination:** Tracks all test coverage

---

### Phase 9: Documentation & Handoff (Week 11-12)
**Primary Owner: All Developers**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Update ALL docs with Phase 1-8 learnings | All | — | Fresh documentation |
| Deployment guide (tested by 2nd dev) | Dev 1 | Dev 2, Dev 3 | Step-by-step for new dev |
| ML experiment reports | Dev 2 | Dev 1 | Accuracy metrics, language results |
| API documentation | Dev 1, Dev 2 | Dev 3 | OpenAPI + Convex schema |
| Handoff checklist | Dev 1 | Team | "Ready for new developer" list |
| Bug fixes and polish | All | — | No critical issues |

---

## Workstream Dependencies

```
Dev 1 (Backend)                Dev 2 (ML)                   Dev 3 (Frontend/Lucky)

   Phase 1: Schema                 │                            │
   ├── auth                        │                            │
   └── CRUD ────────────────────────────┬                        │
                                   Phase 2:                       │
                                   ├── Datasets ───────────────┐ │
                                   └── Preprocessing             │ │
                                                               Phase 3:
       Phase 2:                              Phase 3:           ├── Models (mBERT, XLM-R)
       ├── Documents                         ├── Training        ├── Endpoints (/health, /classify, /extract)
       ├── Feedback                        └── Inference         └── Reports
       └── UI Mockups (mock data only)                          │
                                                              Phase 4:
                                                             ├── Evidence integration
                                                             └── Search setup
                                                                   │
       Phase 4:                      Phase 5:                    │
       ├── Knowledge Graph ◄──────────┤ Mitigation Matrix        │
       └── Evidence Corpus            │ Prioritisation           │
                                      └──────┬────────────────────┘
                                             │
                                         Phase 6:
                                         ├── Contracts
                                         └── Integration prep
                                             │
                                         Phase 7:
                                         └── MVP Frontend (Dev 3 only)
                                             │
                                         Phase 8-9:
                                         All → Testing/Homepage
```

---

## Milestone Definitions

| Milestone | Criteria | Owner | Phase |
|-----------|----------|-------|-------|
| M1: Backend Ready | Convex schema deployed, auth working, CRUD tested | Dev 1 | 1 |
| M2: Data Prep Ready | Document storage defined, datasets researched | Dev 1, Dev 2 | 2 |
| M3: ML Service Ready | Both models loaded, endpoints respond <2s | Dev 2 | 3 |
| M4: Knowledge Base Ready | Taxonomy, evidence corpus, search working | Dev 1 | 4 |
| M5: Risk Engine Working | Prioritisation algorithm produces ranked list | Dev 1 | 5 |
| M6: API Stable | All contracts defined, integration tested | Dev 1, Dev 2 | 6 |
| M7: MVP Frontend Done | Dashboard, views, concern list, evidence viewer | Dev 3 | 7 |
| M8: Integration Verified | E2E tests pass, load test <500ms p95 | All | 8 |
| M9: Release Ready | Documentation complete, handoff ready | All | 9 |

---

## Notes

- **Dev 1 (Coordinator):** Owns Convex, auth, knowledge graph, risk engine, backend integration
- **Dev 2 (Akshay):** Owns datasets, ML experiments, model training, inference endpoints
- **Dev 3 (Lucky):** Owns frontend ONLY - dashboards, UI, integration via approved contracts
- **No overlap in core ownership** - boundaries are firm
- **All phases assume free/open-source only**