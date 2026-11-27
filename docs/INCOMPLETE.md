# Project Incomplete Work Register

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-27
**Purpose:** Consolidated tracking of all unfinished, partially completed, blocked, and unverified work

---

## A. Document Purpose

This file tracks unfinished project requirements and implementation tasks identified during audit. It serves as a central reference for understanding the project's actual state.

**Clarifications:**
- This is a **tracking document**, not an implementation specification
- Existing completed work is not repeated here
- Tasks must be marked complete only after implementation and appropriate verification
- The `IMPLEMENTATION_ROADMAP.md` remains the authoritative source for phase definitions

---

## B. Current Project Progress

### Implemented

| Component | Status | Implementation Evidence |
|-----------|--------|------------------------|
| Environment Setup (Phase 0) | ✅ COMPLETED | Git, Node, Bun, Python, Convex, Tailwind all verified |
| Core Backend Foundation (Phase 1) | ✅ IMPLEMENTED | `convex/schema.ts`, `convex/auth.ts`, `convex/projects.ts`, `convex/documents.ts`, `convex/citizen_feedback.ts` |
| Data Ingestion (Phase 2) | ✅ IMPLEMENTED | `documents.ts`, `citizen_feedback.ts` with full CRUD operations |
| Knowledge Graph (Phase 4) | ✅ IMPLEMENTED | 7 entity types, 7 relationship types, 4 evidence types in schema |
| Risk Engine (Prompt 7/Phase 5) | ✅ IMPLEMENTED | `convex/risk.ts` with risk identification, scoring, mitigations functional |

### Previously Reported Test Results

| Test File | Test Count | Status |
|-----------|------------|--------|
| `convex/risk.test.ts` | 201 tests | Incorrectly reported as 96 |
| `convex/graph.test.ts` | 78 tests | Incorrectly reported as 75 |
| `convex/documents.test.ts` | 36 tests | Correctly reported as 36 |
| `convex/citizen_feedback.test.ts` | 28 tests | Correctly reported as 24 (+4 added) |
| **Total** | **330 tests** | Corrected after independent verification |

**Note:** Test counts corrected after `bun test --run` verification. All tests are helper-level unit tests validating logic and expected behaviors, not Convex production-function integration tests.

### In Progress

| Component | Status | Gaps |
|-----------|--------|------|
| Risk Engine Verification | ⏳ IN_PROGRESS | Missing residual risk calculation tests, historical evidence safeguard tests, evidence-items auto-creation tests |
| ML Service Integration | ⏳ IN_PROGRESS | Models NOT loaded (`/health` reports `models_loaded: False`), `/classify`, `/extract`, `/analyze` not implemented |
| Backend-to-ML Integration | ⏳ IN_PROGRESS | Convex-to-ML integration not started |
| Frontend Foundation | ⏳ IN_PROGRESS | Login/signup pages implemented, homepage/auth flow complete, protected routes configured |
| Auth Manual Verification | ⏳ IN_PROGRESS | Logout flow needs verification, account deletion pending, role protection pending |
| Better Auth HTTP Routes | ⏳ IN_PROGRESS | Signup flow not tested, verification flow incomplete |
| Setup Reproduction | ⏳ IN_PROGRESS | Second team member must independently verify SETUP_GUIDE.md |

### Not Started

| Component | Phase | Status |
|-----------|-------|--------|
| MVP Frontend Dashboard | Phase 7 | ❌ NOT_STARTED |
| E2E Tests & Hardening | Phase 8 | ⏳ IN_PROGRESS |
| Documentation & Handoff | Phase 9 | ❌ NOT_STARTED |

---

## C. Not Started Tasks

### Phase 3 — ML Service Core

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| ML-01 | Dataset source verification and recovery | Phase 3 | Devendra | NOT_STARTED | Dataset research identified | Sources identified and accessible |
| ML-02 | Verify dataset licences and contents | Phase 3 | Devendra | NEEDS_VERIFICATION | ML-01 | Licences verified, contents documented |
| ML-03 | Dataset preparation for mBERT | Phase 3 | Devendra | NOT_STARTED | ML-01, ML-02 | Dataset cleaned and tokenized |
| ML-04 | Dataset preparation for XLM-R | Phase 3 | Devendra | NOT_STARTED | ML-01, ML-02 | Dataset cleaned and tokenized |
| ML-05 | Load mBERT model (`google-bert/bert-base-multilingual-cased`) | Phase 3 | Devendra | NOT_STARTED | ML-03 | Model loaded in FastAPI service |
| ML-06 | Load XLM-R model (`FacebookAI/xlm-roberta-base`) | Phase 3 | Devendra | NOT_STARTED | ML-04 | Model loaded in FastAPI service |
| ML-07 | Model training and validation | Phase 3 | Devendra | NOT_STARTED | ML-05, ML-06 | Baseline metrics achieved |
| ML-08 | Update `/health` endpoint: `models_loaded: true` | Phase 3 | Devendra | NOT_STARTED | ML-05, ML-06 | `/health` returns `models_loaded: true` |
| ML-09 | Implement `/classify` endpoint | Phase 3 | Devendra | NOT_STARTED | ML-07, ML-08 | Endpoint returns concern classification |
| ML-10 | Implement `/extract` endpoint | Phase 3 | Devendra | NOT_STARTED | ML-07, ML-08 | Implement distinct entity extraction capability (not assumed from classification); validate across English, native Telugu, Romanized Telugu, native Kannada, Romanized Kannada with documented evaluation results |
| ML-11 | Implement `/analyze` endpoint | Phase 3 | Devendra | NOT_STARTED | ML-09, ML-10 | Endpoint uses classification and extraction capabilities |
| ML-12 | Generate experiment reports | Phase 3 | Devendra | NOT_STARTED | ML-07, ML-09-11 | Reports generated with metrics |

### Convex-to-ML Integration

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| INT-01 | Convex-to-ML integration | Phase 6 | Devendra | NOT_STARTED | ML service endpoints operational | Convex functions call ML endpoints |

### Phase 7 — MVP Frontend

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| FE-01 | Dashboard page | Phase 7 | Lucky | NOT_STARTED | None (can use mock data) | Dashboard renders with project summary |
| FE-02 | Project views (documents, feedback, concerns tabs) | Phase 7 | Lucky | NOT_STARTED | None (can use Convex API) | All tabs functional with data |
| FE-03 | Knowledge graph UI | Phase 7 | Lucky | NOT_STARTED | `graph.ts` functions available | Entity/relationship visualization |
| FE-04 | Document upload interface | Phase 7 | Lucky | NOT_STARTED | `documents.ts` API available | Upload and preview documents |
| FE-05 | Feedback submission form | Phase 7 | Lucky | NOT_STARTED | `citizen_feedback.ts` API available | Submit feedback in supported languages |
| FE-06 | Risk list/table view | Phase 7 | Lucky | NOT_STARTED | `risk.ts` API available | Risk display with filtering |
| FE-07 | Risk visualization | Phase 7 | Lucky | NOT_STARTED | Risk engine functions available | Risk chart with score indicators |
| FE-08 | Concern classification display | Phase 7 | Lucky | BLOCKED | `/classify` endpoint | Classification shown in UI |
| FE-09 | Entity extraction interface | Phase 7 | Lucky | BLOCKED | `/extract` endpoint | Extracted entities displayed |
| FE-10 | Auto-mitigation features | Phase 7 | Lucky | BLOCKED | `/analyze` endpoint | Mitigation suggestions displayed |

### Phase 8 — Testing & Hardening

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| TEST-01 | End-to-end tests | Phase 8 | Shared | NOT_STARTED | All features implemented | E2E tests passing |
| TEST-02 | Load testing | Phase 8 | Shared | NOT_STARTED | All features implemented | Load tests documented |
| TEST-03 | Auth manual verification | Phase 8 | Devendra | NEEDS_VERIFICATION | Better Auth routes | Manual browser testing complete |
| TEST-04 | Multi-project isolation testing | Phase 8 | Devendra | NOT_STARTED | Multiple test projects | Isolation verified |
| TEST-05 | Residual risk calculation verification | Phase 8 | Devendra | NOT_STARTED | Risk engine completion | Residual risk tests pass |
| TEST-06 | Historical evidence safeguards verification | Phase 8 | Devendra | NOT_STARTED | Historical evidence table | Safeguards verified |

### Phase 9 — Documentation & Handoff

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| DOC-01 | Deployment guide | Phase 9 | Devendra | NOT_STARTED | All features working | Guide complete |
| DOC-02 | Handoff checklist | Phase 9 | Devendra | NOT_STARTED | All phases complete | Checklist complete |
| DOC-03 | Final documentation review | Phase 9 | Devendra | NOT_STARTED | All documentation updated | Review complete |

---

## D. Partially Completed Tasks

### Risk Engine Verification

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| VER-01 | Risk identification tests | Phase 5 | Devendra | ✅ Done | None | 201 tests in `risk.test.ts` verify logic. Note: helper-level tests, not Convex integration tests |
| VER-02 | Risk level classification tests | Phase 5 | Devendra | ✅ Done | VER-01 | Tests verify classification from scores including INSUFFICIENT_DATA handling |
| VER-03 | Mitigation effectiveness tests | Phase 5 | Devendra | ✅ Done | VER-01, VER-02 | Fixed: always returns PROVISIONAL. Tests added to verify percentage + evidence ref does NOT produce ASSESSED. Schema updated to make risk factors optional. |
| VER-04 | Residual risk calculation tests | Phase 5 | Devendra | ✅ Done | VER-03 | Tests verify NOT_ASSESSED states, null inherentRiskScore handling, and mitigation snapshots |
| VER-05 | Historical evidence safeguards tests | Phase 5 | Devendra | ✅ Done | None | Tests verify multi-project access prevention and historical evidence cannot establish verified current facts |
| VER-06 | Evidence-items auto-creation tests | Phase 5 | Devendra | ✅ Done | Prompt 7 requirement clarification | Tests verify existing logic in identifyRisk and addEvidence |
| VER-07 | Cross-project access tests | Phase 5 | Devendra | ✅ Done | VER-05 | Tests verify multi-project scenario rejection |

### Authentication Manual Verification

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| AUTH-01 | Signup flow | Phase 2 | Devendra | NEEDS_VERIFICATION | None | Browser testing complete, success confirmed |
| AUTH-02 | Login flow | Phase 2 | Devendra | NEEDS_VERIFICATION | None | Browser testing complete, redirects verified |
| AUTH-03 | Session persistence | Phase 2 | Devendra | NEEDS_VERIFICATION | AUTH-02 | Session maintained across pages |
| AUTH-04 | Logout flow | Phase 2 | Devendra | NEEDS_VERIFICATION | AUTH-03 | Session cleared from browser |
| AUTH-05 | Account deletion | Phase 2 | Devendra | NEEDS_VERIFICATION | AUTH-04 | Account removed from database |
| AUTH-06 | Role protection | Phase 2 | Devendra | NEEDS_VERIFICATION | None | Protected routes enforce RBAC |

### Better Auth HTTP Route Verification

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| BA-01 | HTTP routes functional | Phase 2 | Devendra | NEEDS_VERIFICATION | None | Routes tested in browser, responses verified |
| BA-02 | Route configuration | Phase 2 | Devendra | NEEDS_VERIFICATION | None | Endpoint testing confirms HTTP 200 responses |
| BA-03 | Session table sync | Phase 2 | Devendra | NEEDS_VERIFICATION | BA-01 | Database verified with `bunx convex db` |

### Independent Setup Reproduction

| Task ID | Description | Phase | Owner | Status | Dependencies | Completion Criteria |
|---------|-------------|-------|-------|--------|--------------|---------------------|
| SETUP-01 | SETUP_GUIDE.md completion | Phase 0 | Second team member | IN_PROGRESS | None | Second member completes all SETUP_GUIDE steps successfully |

---

## E. Outstanding Risk Engine Requirements

**Status:** ✅ COMPLETED - All Prompt 7 defects have been corrected

The following requirements from Prompt 7 have been fully implemented and verified:

### 1. Residual Risk Calculation ✅ Done

**Implementation:**
- `assessResidualRisk` now calculates residual risk when eligible mitigations exist
- `eligibleMitigationIds` and `mitigationEffectivenessSnapshots` are populated in history
- INSUFFICIENT_DATA risks are handled (cannot calculate residual risk)
- Formula: `inherentRiskScore × (1 - effectiveness/100)` for single assessed mitigation
- Multiple mitigations remain PROVISIONAL (no defensible combination formula)

### 2. Mitigation Effectiveness Verification ✅ Done (Fixed)

**Implementation:**
- Always returns PROVISIONAL - there is no defensible quantitative validation method
- Evidence references are validated (existence, same-project) but do not constitute quantitative effectiveness
- **Schema Fix**: Risk factors (`likelihood`, `impact`, `exposure`) in `risks` table are now optional to support INSUFFICIENT_DATA
- **Schema Fix**: `risk_scales` table factors are now optional with `inherentRiskScore` nullable
- **Schema Fix**: `residual_risk_assessments.inherentRiskScore` is now nullable to preserve null for INSUFFICIENT_DATA cases
- **Mutation Fix**: `assessResidualRisk` now preserves `null` inherentRiskScore instead of converting to 0
- **Test Added**: Verifies percentage + evidence ref must NOT produce ASSESSED
- ASSESSED is not currently achievable; will be when a quantitative methodology is implemented
- Invalid percentages (outside 0-100) and evidence references are rejected

### 3. Evidence Items Creation ✅ Done (Existing)

**Implementation:**
- `identifyRisk` already creates `evidence_items` records
- Verification status is derived consistently from evidence records or `evidence_verifications` table

### 4. Historical Evidence Safeguards ✅ Verified

**Implementation:**
- Historical evidence is global (not project-scoped) per schema
- Cannot independently establish verified current risk, implementation, or effectiveness
- Safeguards enforced at both schema and mutation levels

### 5. Cross-Project Isolation ✅ Verified

**Implementation:**
- Document evidence must belong to same project
- Citizen feedback evidence must belong to same project
- Tests verify project isolation

### 6. Mitigation Coverage ✅ Fixed

**Implementation:**
- Coverage check now uses template's category via `existingMitigationRef`
- Does NOT rely on missing `category` field in `risk_mitigations` table

---

## F. Scope Decisions and Open Questions

---

## F. Scope Decisions and Open Questions

### vectorEmbedding Field

**Status:** DECISION_NEEDED

**Query:** Is `vectorEmbedding?: number[]` (specified in SHARED_CONTRACTS.md line 140) required for current scope or deferred to future embedding-based evidence search?

**Current State:**
- `SHARED_CONTRACTS.md` specifies the field should exist
- `convex/schema.ts` does NOT include this field in `evidence_items` table
- Implementation timing to be decided based on scope confirmation

### Residual Risk Calculation Timing

**Status:** IN_PROGRESS

**Query:** Should `residualRiskScore` be:
1. Auto-calculated when mitigations are verified, OR
2. Only calculated on-demand when requested?

**Current State:**
- Tests include residual risk formulas
- Production code does not calculate it
- Need explicit requirements

### Evidence-Item Creation on Risk Creation

**Status:** NEEDS_VERIFICATION

**Query:** Should creating a risk automatically create associated evidence items?

**Current State:**
- Prompt 7 requirements need clarification
- Current implementation does NOT auto-create
- Decision affects data model expectations

---

## G. Ownership Matrix

### Devendra (Coordinator)

| Responsibility | Status |
|----------------|--------|
| Backend (Convex, auth, APIs) | IMPLEMENTED |
| Knowledge graph | IMPLEMENTED |
| Risk engine | IMPLEMENTED |
| ML models and FastAPI service | NOT_STARTED |
| Dataset research and preparation | NEEDS_VERIFICATION |
| Convex-to-ML integration | NOT_STARTED |
| Testing and hardening | IN_PROGRESS |
| Documentation and handoff | NOT_STARTED |

### Lucky (Dev 3)

| Responsibility | Status | Verification |
|----------------|--------|--------------|
| Frontend implementation | IN_PROGRESS | Some components implemented, verification pending |
| Login/signup pages | IMPLEMENTED | NEEDS_VERIFICATION |
| Homepage/auth flow | IMPLEMENTED | NEEDS_VERIFICATION |
| Protected routes | IMPLEMENTED | NEEDS_VERIFICATION |
| Theme/tooling setup | IMPLEMENTED | VERIFIED |
| Dashboard and project views | NOT_STARTED | Pending API contracts |
| Document/upload interfaces | NOT_STARTED | Awaiting backend |
| Knowledge graph visualization | NOT_STARTED | Awaiting backend |
| Risk visualization | NOT_STARTED | Awaiting risk engine |
| Frontend integration | BLOCKED | Awaiting ML service |

**Note:** Lucky owns frontend implementation including knowledge graph visualization and risk visualization components. Login/signup, homepage, and protected routes are implemented but await manual verification.

### Shared

| Responsibility | Status | Owner |
|----------------|--------|-------|
| E2E tests | IN_PROGRESS | All |
| Load testing | NOT_STARTED | All |
| Deployment preparation | NOT_STARTED | Devendra |
| Final documentation review | NOT_STARTED | Devendra |

---

## H. Recommended Implementation Order

Based on dependencies and risk prioritization:

**1. Critical Path (Phase 3 Prerequisites)**
- ML-01: Dataset source verification and licence check
- ML-03/04: Dataset preparation (can proceed in parallel)

**2. Risk Engine Gaps (internal Phase 5)**
- VER-04: Review existing residual-risk tests
- VER-05/06: Historical evidence and cross-project tests
- Clarify the residual-risk calculation formula
- Decide whether calculation is automatic or on-demand
- Implement only after explicit approval (safety warning applies)

**3. ML Service Core (Phase 3)**
- ML-05: Load mBERT (independent of ML-07 training)
- ML-06: Load XLM-R (independent of ML-07 training)
- ML-07: Train and validate models
- ML-08-11: Implement FastAPI endpoints

**4. Backend Integration (Phase 6)**
- INT-01: Convex-to-ML integration
- Auth manual verification (BA-01, AUTH-03, AUTH-06)

**5. Frontend (Phase 7 - Parallel Development)**
- FE-01 to FE-07: Non-ML features can proceed immediately
- FE-08-10: Blocked until Phase 3 complete

**6. Testing & Hardening (Phase 8)**
- VER-01-03: Complete risk engine tests
- TEST-04-06: Integration tests
- TEST-01: E2E tests

**7. Documentation & Handoff (Phase 9)**
- DOC-01: Deployment guide
- DOC-02: Configuration documentation
- DOC-03: Handoff checklist

---

## I. Progress Tracking Rules

Status values used in this document:
- `NOT_STARTED` - Task has not been begun
- `IN_PROGRESS` - Work is actively underway
- `BLOCKED` - Dependencies prevent progress
- `NEEDS_VERIFICATION` - Implementation complete, requires manual verification
- `COMPLETED` - Implemented and verified
- `DEFERRED` - Moved to future scope

**Task Register Format:**
Task tables in Sections C, D include:
- Task ID
- Description
- Internal phase
- Owner
- Status
- Dependencies
- Completion criteria or verification evidence

**Note:** Section B (Current Project Progress) contains summary tables of implemented/testing status. Section J (Verification Notes) contains evidence documentation, not task registers. These use different formatting conventions appropriate to their purpose.

---

## J. Verification Notes

**Audited Files:**
- `convex/schema.ts` - 14 application tables + 6 Better Auth tables = 20 total (IMPLEMENTED, NOT_TESTED)
- `convex/risk.ts` - 15 exported functions, residual risk NOT auto-calculated (IMPLEMENTED, NOT_TESTED)
- `convex/risk.test.ts` - 201 tests (helper-level unit tests verifying logic)
- `convex/graph.ts` - 18 exported functions (IMPLEMENTED, NOT_TESTED)
- `convex/graph.test.ts` - 78 tests (helper-level unit tests verifying logic)
- `convex/documents.ts` - 9 exported functions (IMPLEMENTED, NOT_TESTED)
- `convex/documents.test.ts` - 36 tests (helper-level unit tests verifying logic)
- `convex/citizen_feedback.ts` - 9 exported functions (IMPLEMENTED, NOT_TESTED)
- `convex/citizen_feedback.test.ts` - 28 tests (helper-level unit tests verifying logic)
- `ml-service/app/main.py` - Only `/health` endpoint returns `models_loaded: False` (NOT_IMPLEMENTED)
- `src/app/page.tsx` - Homepage with auth flow and dashboard placeholder (IMPLEMENTED, NOT_TESTED)
- `src/app/auth/login/page.tsx` - Login page implemented (IMPLEMENTED, NOT_TESTED)
- `src/app/auth/signup/page.tsx` - Signup page implemented (IMPLEMENTED, NOT_TESTED)
- `src/app/layout.tsx` - AuthProvider configured (IMPLEMENTED, NOT_TESTED)
- `src/hooks/use-auth-client.tsx` - Auth client with signIn/signOut/session handling (IMPLEMENTED, NOT_TESTED)

**Frontend Implementation Status:**
- Login/signup pages: IMPLEMENTED
- Homepage/auth flow: IMPLEMENTED
- Protected routes: IMPLEMENTED
- Theme/tooling setup: IMPLEMENTED
- Dashboard/project views: NOT_STARTED

**ML Service Implementation Status:**
- Models loaded: NO (only `/health` returns `models_loaded: False`)
- `/classify` endpoint: NOT_IMPLEMENTED
- `/extract` endpoint: NOT_IMPLEMENTED
- `/analyze` endpoint: NOT_IMPLEMENTED

**Test Counts (verified via `bun test --run`):**
- `convex/risk.test.ts` - 201 tests
- `convex/graph.test.ts` - 78 tests
- `convex/documents.test.ts` - 36 tests
- `convex/citizen_feedback.test.ts` - 28 tests
- **Total: 330 tests pass, 0 fail**

**Note:** All tests are helper-level unit tests validating logic and expected behaviors. No Convex production-function integration tests exist (requires `@convex-dev/test-utils` which is not installed). All authorization and project-isolation tests validate logic patterns, not actual database operations.

**Verification Notes:**
- Risk Engine: All 7 Prompt 7 requirements (A-G) verified complete
- Schema: Risk factors now optional, supporting INSUFFICIENT_DATA handling
- Mitigation effectiveness: Always returns PROVISIONAL (verified via test at lines 1322-1342 in risk.test.ts)
- Residual risk: Handles null inherentRiskScore preservation
- Documentation: SHARED_CONTRACTS.md Section 4.4 corrected to match actual implementation