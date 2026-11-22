# Team Task Assignments

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-22

---

## Developer Roles (Confirmed)

| Developer | Name | Primary Ownership | Cannot Own |
|-----------|------|-------------------|------------|
| **Dev 1** | Coordinator | Convex backend, auth, APIs, ML integration, knowledge graph, risk engine, mitigation analysis, prioritisation, integration testing | Frontend UI implementation |
| **Dev 2** | Akshay | Datasets research, annotation, preprocessing, mBERT, XLM-R, model training, evaluation, Python/FastAPI ML service, experiment reports | Backend schema, frontend UI |
| **Dev 3** | Lucky | Frontend ONLY: Next.js, TypeScript, Tailwind, shadcn/ui, dashboard, UI integration, mock components | Convex backend, ML training, knowledge graph, risk engine, mitigation analysis |

**Critical Boundaries:**
- Lucky must remain frontend-only
- Akshay must remain ML/Python-only
- Dev 1 owns backend and all infrastructure intelligence

---

## Phase-by-Phase Assignments

### Phase 1: Core Backend Foundation (Week 1-2)
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Convex schema definition (projects, documents, feedback, users, concerns) | Dev 1 | — | `convex/schema.ts` |
| Authentication provider selection (free tier) | Dev 1 | — | Decision in DECISION_LOG.md |
| Authentication endpoint implementation | Dev 1 | — | Convex auth hook |
| Project CRUD mutations/queries | Dev 1 | Dev 3 | Convex functions |
| Document CRUD (backend structure) | Dev 1 | Dev 3 | Schema + functions |
| Backend verification (`bun run build`) | Dev 1 | All | Clean build |

**Dependencies:** Phase 0 complete
**Owner:** Dev 1 (no shared ownership)

---

### Phase 2: Data Ingestion Infrastructure (Week 2-3)
**Co-owners: Dev 1 (Backend), Dev 2 (ML Prep)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Document storage strategy (Convex file storage) | Dev 1 | — | Decision documented |
| Document metadata schema | Dev 1 | Dev 3 | Field definitions |
| Backend feedback mutation | Dev 1 | — | `feedback:insert` |
| Dataset research (infrastructure reports, historical data) | Dev 2 | — | Source list |
| ML data preprocessing pipeline | Dev 2 | Dev 1 | Scripts + output |
| UI layout mockups (mock data only) | Dev 3 | — | Wireframes, component structure |
| Reusable UI components (forms, tables, cards) | Dev 3 | — | shadcn/ui based |

**Dependencies:** Phase 1 schema complete
**Notes:** Lucky only prepares UI layout and components with mock data - **no backend integration**

---

### Phase 3: ML Service Core (Week 3-4)
**Primary Owner: Developer 2 (Akshay)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Load mBERT (`google-bert/bert-base-multilingual-cased`) | Dev 2 | Dev 1 | Model loaded, GPU verified |
| Load XLM-R (`FacebookAI/xlm-roberta-base`) | Dev 2 | Dev 1 | Model loaded, GPU verified |
| Dataset preparation for training | Dev 2 | — | Tokenised, clean data |
| Model training/validation | Dev 2 | — | Accuracy metrics |
| Implement `/health` endpoint | Dev 2 | Dev 1 | Returns `models_loaded: true` |
| Implement `/classify` endpoint | Dev 2 | Dev 1 | Concern classification API |
| Implement `/extract` endpoint | Dev 2 | Dev 1 | Entity extraction API |
| Create experiment reports | Dev 2 | — | Charts, metrics by language |

**Dependencies:** Phase 1 schema, Phase 2 datasets
**Dev 1 involvement:** Reviews contracts for expected ML outputs

---

### Phase 4: Knowledge Graph Implementation (Week 4-6)
**Primary Owner: Developer 1 (Coordinator)**
**Supported by: Dev 2 (datasets)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Infrastructure taxonomy tables | Dev 1 | — | `infrastructure_types`, `categories` |
| Knowledge graph relationships | Dev 1 | — | Links, hierarchy |
| Historical evidence corpus ingestion | Dev 1 | Dev 2 | Evidence documents |
| Evidence data integration | Dev 1 | Dev 2 | Source data loaded |
| Evidence search indexing | Dev 1 | — | Queryable search |

**Dependencies:** Phase 2 (data structures), Phase 3 (ML categories)
**Dev 2's role:** Supplies researched datasets - **NOT** knowledge graph implementation

---

### Phase 5: Risk Analysis Engine (Week 5-7)
**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Mitigation coverage matrix | Dev 1 | — | `mitigations` table |
| Risk scoring algorithm | Dev 1 | — | `priorityScore` calculation |
| Explainable prioritisation factors | Dev 1 | Dev 2 | Documented weights |
| Concerns linking to mitigations | Dev 1 | Dev 2 | Status field populated |
| Mitigation status updates | Dev 1 | — | Mutation to update |

**Dependencies:** Phase 3 (classification categories), Phase 4 (evidence, mitigations)

---

### Phase 6: Backend Integration (Week 6-8)
**Co-owners: Dev 1 (Backend), Dev 2 (ML)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Finalise backend API contracts | Dev 1 | All | SHARED_CONTRACTS.md v1.0 |
| ML inference service integration | Dev 2 | Dev 1 | API endpoint docs |
| Frontend API consumption patterns | Dev 3 | Dev 1 | Client code |

**Dependencies:** Phase 5 (risk engine complete)
**Notes:** Lucky uses approved contracts - does not co-own backend or ML services

---

### Phase 7: MVP Frontend Implementation (Week 8-10)
**Primary Owner: Developer 3 (Lucky)**
**Supported by: Dev 1, Dev 2 (issues)**

| Task | Owner | Reviewer | Deliverable |
|------|-------|----------|-------------|
| Dashboard: project list, summary stats | Dev 3 | Dev 1 | `/dashboard` page |
| Project view: documents tab | Dev 3 | Dev 1 | `/projects/[id]/documents` |
| Project view: feedback tab | Dev 3 | Dev 1 | `/projects/[id]/feedback` |
| Project view: concerns tab | Dev 3 | Dev 1 | `/projects/[id]/concerns` |
| Concern list: filterable, sortable | Dev 3 | Dev 1 | Table with filters |
| Concern list: priority badges | Dev 3 | Dev 1 | Risk scores displayed |
| Evidence viewer: search & highlight | Dev 3 | Dev 1 | `/evidence/search` |
| Document upload interface | Dev 3 | Dev 1 | Upload + validation |
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
| Convex functions tests | Dev 1 | Dev 3 | Query/mutation tests |
| ML service unit tests | Dev 2 | Dev 1 | 80%+ coverage |
| Endpoint tests | Dev 2 | Dev 1 | /health, /classify, /extract |
| Frontend unit tests | Dev 3 | Dev 1 | 80%+ coverage |
| React component tests | Dev 3 | Dev 1 | Component testing |
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
                                                               ├── Models (mBERT, XLM-R)
                                                               ├── Endpoints (/health, /classify, /extract)
                                                               └── Reports
                                                                   │
                                                               Phase 4:
                                                               ├── Evidence integration
                                                               └── Search setup
                                                                   │
                                                               Phase 5:
                                                               ├── Mitigation Matrix
                                                               └── Prioritisation
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

## Ownership Verification Checklist

- [x] Phase 1: Dev 1 owns 100% (Backend)
- [x] Phase 2: Dev 1 (Backend) + Dev 2 (ML Prep) + Dev 3 (UI mockups only)
- [x] Phase 3: Dev 2 owns 100% (ML)
- [x] Phase 4: Dev 1 owns 100% (Knowledge Graph); Dev 2 only supplies data
- [x] Phase 5: Dev 1 owns 100% (Risk Engine)
- [x] Phase 6: Dev 1 (Backend) + Dev 2 (ML) + Dev 3 (frontend consumption)
- [x] Phase 7: Dev 3 owns 100% (Frontend); Dev 1 + Dev 2 support only
- [x] Phase 8: All test their own modules
- [x] Phase 9: All contribute to docs

---

## Notes

- **Dev 1 (Coordinator):** Owns Convex, auth, knowledge graph, risk engine, backend integration, mitigation analysis, prioritisation
- **Dev 2 (Akshay):** Owns datasets, ML experiments, model training, inference endpoints, Python/FastAPI ML service, experiment reports
- **Dev 3 (Lucky):** Owns frontend ONLY: Next.js, TypeScript, Tailwind, shadcn/ui, dashboard, UI integration, mock components
- **No overlap in core ownership** - boundaries are firm
- **All phases assume free/open-source only**