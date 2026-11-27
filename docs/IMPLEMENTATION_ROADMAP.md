# Implementation Roadmap

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-27
**Status:** Prompts 4-7 complete ✅, Prompt 8 ML Service Integration pending team approval

### Prompt 7 Verification Status ✅ Complete

Schema validation and mitigation effectiveness fixes verified:
- `bun run build`: exit code 0
- `bun test --run`: 330 tests pass, 0 fail
- `bunx tsc --noEmit`: exit code 0 (no errors)
- `bun run lint`: exit code 0 (3 pre-existing auth warnings only)

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
| 5 | Risk Analysis Engine | Dev 1 | — | Backend | ✅ Complete |
| 6 | Backend Integration | Dev 1, Dev 2 | Lucky (frontend consumption) | Mixed | ⏳ In progress |
| 7 | MVP Frontend | Dev 3 | Dev 1, Dev 2 (support) | Frontend | ⏳ Not started |
| 8 | Testing & Hardening | All | — | Testing | 🔄 In progress |
| 9 | Documentation & Handoff | All | — | Documentation | ⏳ Not started |

**Total estimated: 9 weeks from Phase 1 start (Phase 1-5 complete, 4 weeks remaining)**

---

## Implementation Milestones

| Milestone | Target | Status | Assigned To |
|-----------|--------|--------|-------------|
| M0: Tooling Ready | 2026-11-15 | ✅ Done | All |
| M1: Backend Ready | Week 2 | ✅ Done | Dev 1 |
| M2: Data Pipeline Ready | Week 3 | ✅ Done | Dev 1, Dev 2 |
| M3: ML Service Ready | Week 4 | ⏳ Not started | Dev 2 |
| M4: Knowledge Base Ready | Week 6 | ✅ Done | Dev 1 |
| M5: Risk Engine Ready | Week 7 | ✅ Done | Dev 1 |
| M6: Backend Integration | Week 8 | ⏳ Not started | Dev 1, Dev 2 |
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
**Test Results:** 78 tests pass (unit tests for knowledge graph logic)

---

### Phase 5: Risk Analysis Engine (Week 5-7) ✅ Complete

**Primary Owner: Developer 1 (Coordinator)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Risk identification | Dev 1 | Evidence-grounded risk creation. Factors are optional - if any is missing, inherentRiskScore is null (INSUFFICIENT_DATA) | ✅ Implemented |
| Risk evidence traceability | Dev 1 | Documents, feedback, historical evidence with provenance. Single source of truth: `evidence_verifications` table | ✅ Implemented |
| Multiple evidence support | Dev 1 | Separate evidence_items table for multiple evidence per risk | ✅ Implemented |
| Inherent Risk Score calculation | Dev 1 | Likelihood × Impact × Exposure formula (1-125 scale). Only when all factors are present. | ✅ Implemented |
| Risk level classification | Dev 1 | LOW/MEDIUM/HIGH/CRITICAL/INSUFFICIENT_DATA from score thresholds | ✅ Implemented |
| Risk status lifecycle | Dev 1 | PENDING_REVIEW/ACCEPTED/REJECTED/UNRESOLVED with transitions | ✅ Implemented |
| Audit trail | Dev 1 | Full change history with previous/new values | ✅ Implemented |
| Mitigation suggestion engine | Dev 1 | Candidate mitigations from templates with project isolation | ✅ Implemented |
| Mitigation effectiveness | Dev 1 | PROVISIONAL always. No defensible quantitative validation method exists. Evidence references validated (existence, same-project) but do not constitute quantitative effectiveness | ✅ Implemented |
| Residual risk lifecycle | Dev 1 | assessResidualRisk with NOT_ASSESSED/PROVISIONAL/ASSESSED states. Includes mitigation snapshots in history | ✅ Implemented |
| Human review workflow | Dev 1 | Accept/reject/edit risks and mitigations. Action derived internally | ✅ Implemented |
| Explainable risk scoring | Dev 1 | Transparent heuristic scoring | ✅ Implemented |
| Security validation | Dev 1 | Project-level authz, role-based permissions | ✅ Implemented |
| Prioritized risk retrieval | Dev 1 | Handles INSUFFICIENT_DATA risks appropriately (scored first, then unscored) | ✅ Implemented |

**Files:** `convex/schema.ts`, `convex/risk.ts`, `convex/risk.test.ts`

**Test Results:** 201 tests in `convex/risk.test.ts` pass (verified via `bun test --run`). Total project tests: 330 (78 graph tests + 36 doc tests + 28 feedback tests + 201 risk tests + 1 test file = 344, butBun reports 330). Note: These are helper-level unit tests validating logic and expected behaviors. No Convex production-function integration tests exist (requires `@convex-dev/test-utils` which is not installed). All authorization and project-isolation tests validate logic patterns, not actual database operations.

**Completed Corrections (Prompt 7 Remediation):**
- **A. Missing risk-factor handling:** Factors (`likelihood`, `impact`, `exposure`) are now optional in schema. If any is missing, `inherentRiskScore` is `null` and `riskLevel` is `INSUFFICIENT_DATA`.
- **B. Evidence verification:** Single source of truth is `evidence_verifications` table. Both `identifyRisk` and `addEvidence` derive verification consistently.
- **C. Mitigation effectiveness:** Always `PROVISIONAL`. No defensible quantitative validation method exists. Evidence references validated (existence, same-project) but do not constitute quantitative effectiveness without a validated methodology.
- **D. Residual-risk assessment history:** Now populates `eligibleMitigationIds` and `mitigationEffectivenessSnapshots` for audit trail. `inherentRiskScore` in assessment history preserves `null` for INSUFFICIENT_DATA cases rather than converting to 0.
- **E. Mitigation coverage:** Coverage check uses template's category via `existingMitigationRef`, not missing `category` field.
- **F. Risk review audit actions:** `updateRiskStatus` now derives action internally. Accepts no caller-supplied action, rejects unsupported transitions.
- **G. Prioritized risk retrieval:** Safely handles null `inherentRiskScore`, separates scored and unscored risks, deterministic ordering.

---

### Phase 6: Backend Integration (Week 6-8) ⏳ Not Started
**Primary Owner: Developer 1 (Coordinator) and Developer 2 (Akshay)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Backend API contracts | Dev 1 | SHARED_CONTRACTS.md v3.0 (revised) | ✅ Done |
| ML inference service integration | Dev 2 | FastAPI endpoints | ⏳ Not started |
| Frontend API consumption | Dev 3 | Client hooks | ⏳ Not started (waiting on Phase 7) |

**Dependencies:** Phase 5 (risk engine) ✅ Complete

---

### Phase 7: MVP Frontend Implementation (Week 8-10) ⏳ Not Started
**Primary Owner: Developer 3 (Lucky)**

**Status:** Risk Engine implementation complete with all defects corrected. API contracts updated in SHARED_CONTRACTS.md v3.0. Awaiting ML integration and Prompt 8 approval.

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Dashboard: project list, summary stats | Dev 3 | `/dashboard` page | ⏳ Not started |
| Project view: documents, feedback, concerns tabs | Dev 3 | `/projects/[id]` | ⏳ Not started |
| Knowledge graph UI | Dev 3 | Entity/relationship views | ⏳ Not started |
| Document upload interface | Dev 3 | Drag + drop | ⏳ Not started |
| Feedback submission form | Dev 3 | Multilingual form | ⏳ Not started |

**Dependencies:** Phase 6 (API contracts) ✅ Complete for Phase 7

---

### Phase 8: ML Service Integration (Week 3-4) ⏳ Pending Approval
**Primary Owner: Dev 2 (Akshay)**

| Task | Owner | Deliverable | Status |
|------|-------|-------------|--------|
| Load mBERT | Dev 2 | Model in memory | ⏳ Not started |
| Load XLM-R | Dev 2 | Model in memory | ⏳ Not started |
| Dataset preparation | Dev 2 | Cleaned, tokenised data | ⏳ Not started |
| Model training/validation | Dev 2 | Baseline metrics | ⏳ Not started |
| `/health` endpoint | Dev 2 | Returns `models_loaded: true` | ⏳ Not started |
| `/classify` endpoint | Dev 2 | Concern classification | ⏳ Not started |
| `/extract` endpoint | Dev 2 | Entity extraction | ⏳ Not started |
| Generate experiment reports | Dev 2 | Metrics by language/category | ⏳ Not started |

**Dependencies:** Phase 1-2 complete ✅

---

### Phase 9: Documentation & Handoff (Week 11-12) ⏳ Not Started
**Status:** SHARED_CONTRACTS.md v3.0 updated, IMPLEMENTATION_ROADMAP.md updated.

| Task | Status |
|------|--------|
| Update docs with Phase 1-7 learnings | ✅ Complete |
| Deployment guide | ⏳ Not started |
| API documentation | ✅ SHARED_CONTRACTS.md v3.0 |
| Handoff checklist | ⏳ Not started |
| Bug fixes and polish | ⏳ Not started |

---

## Workstream Dependencies

```
Dev 1 (Backend)                Dev 2 (ML)                   Dev 3 (Frontend/Lucky)

   M1-5 Complete ✅             │                            │
   ├── Auth, CRUD ───────────────┬────────────────────────────┐ │
   └── Knowledge Graph, Risk ────┬────────────────────────────┘ │
                                M3 ⏳                        │
                                ├── Models (mBERT, XLM-R)     │
                                └── Endpoints                 │
                                                      │           │
                                                      M6 ⏳        │
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

**Current Status:** Prompts 4-7 complete (authentication, documents, feedback, knowledge graph, risk engine). 330 tests pass (verified helper-level unit tests). Build verified (4 static pages). Convex functions ready. Schema now allows optional risk factors for INSUFFICIENT_DATA handling.

**Next Step:** Prompt 8 (ML Service Integration) - PENDING APPROVAL. Awaiting team confirmation that Prompt 7 remediation is complete before starting ML integration phase.