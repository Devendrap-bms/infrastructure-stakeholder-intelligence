# Shared Contracts

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-27
**Status:** Version 2.0 (Prompts 4-7 implemented, Prompt 8-9 pending)
**Version Control:** Increment on breaking changes

---

## Overview

This document defines shared API contracts, data structures, and integration points between:
- **Next.js Frontend** (Route Handlers) - **Dev 3 (Lucky)** owns
- **Convex Backend** (Database, Functions) - **Dev 1 (Coordinator)** owns
- **ML Service** (FastAPI, Python) - **Dev 2 (Akshay)** owns

These contracts enable parallel development with mock services and type safety.

---

## 1. Convex Data Model (Version 0.1)

> **Status:** Defined in Phase 1, pending Convex schema deployment by **Dev 1**

### Tables

#### `projects`
```typescript
{
  _id: Id<"projects">           // Convex document ID
  _CreationTime: Date;          // Auto-generated
  name: string;                   // Project name
  description: string;            // Project description
  location: {                     // Geographic location
    lat: number;
    lng: number;
    address?: string;
  };
  startDate: Date;                // Project start date
  expectedEndDate?: Date;         // Expected completion
  status: "planning" | "active" | "completed" | "cancelled";
  createdAt: Date;                // ISO timestamp
  updatedAt: Date;                // ISO timestamp
}
```

#### `documents`
```typescript
{
  _id: Id<"documents">
  projectId: Id<"projects">      // Reference to project
  fileName: string;
  mimeType: string;               // Actual file format (e.g., "application/pdf")
  documentType: "DPR" | "EIA" | "ESIA" | "EMP" | "SIA" | "feasibility_report" | "public_hearing_record";  // Document category
  fileSize: number;               // Bytes (validated from actual storage metadata)
  storageId: string;              // Convex file storage reference (required)
  uploadStatus: "pending" | "completed" | "failed";
  processingStatus: "pending" | "processing" | "completed" | "failed";
  uploadedBy: string;             // User identifier (authId from Better Auth)
  uploadedAt: Date;
  updatedAt: Date;
  downloadCount: number;
  provenance: string;             // Upload source/purpose
  metadata: {
    pages?: number;
    author?: string;
    title?: string;
    description?: string;
  };
}
```

**Field Clarifications:**

- **`mimeType`**: The actual MIME type of the uploaded file (e.g., "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"). This is **file format**, not document type.

- **`documentType`**: The business/categorical classification of the document (DPR, EIA, ESIA, EMP, SIA, feasibility_report, public_hearing_record). This indicates what kind of document it is in the planning context.

**Do NOT use `fileType` as a redundant field** - `mimeType` covers file format, `documentType` covers document category.

#### `citizen_feedback`
```typescript
{
  _id: Id<"citizen_feedback">
  projectId: Id<"projects">
  content: string;                // Raw text input
  language: "en" | "te" | "te-Latn" | "kn" | "kn-Latn";
  source: "web" | "mobile" | "api";  // How feedback was submitted
  sentiment?: "positive" | "neutral" | "negative";
  submittedBy?: string;           // Optional email/name if provided
  submittedAt: Date;
}
```

#### `concerns`
```typescript
{
  _id: Id<"concerns">
  projectId: Id<"projects">
  sourceDocumentIds: Id<"documents">[];  // Which documents this concern came from
  rawText: string;                  // Original concern text
  processedText?: string;           // After cleaning/transliteration
  language: "en" | "te" | "te-Latn" | "kn" | "kn-Latn";
  category: "environmental" | "social" | "technical" | "financial" | "legal";
  sentiment: "positive" | "neutral" | "negative";
  confidence: number;             // 0-1 from ML classification
  entities: {
    locations?: string[];         // Extracted place names
    stakeholders?: string[];      // People/orgs mentioned
    infrastructureTypes?: string[]; // Tech types mentioned
    dates?: string[];             // Date mentions
  };
  mitigationStatus: "covered" | "partial" | "none";
  priorityScore?: number;         // Computed in Phase 5 (Risk Engine)
  createdAt: Date;
  classifiedAt: Date;             // When ML processed
}
```

#### `infrastructure_types`
```typescript
{
  _id: Id<"infrastructure_types">
  name: string;                   // e.g., "water supply", "road"
  category: "environmental" | "social" | "technical" | "financial" | "legal";
  subcategories: string[];
  description: string;
  mitigations: string[];          // Default mitigations for this type
  createdAt: Date;
}
```

#### `historical_evidence`
```typescript
{
  _id: Id<"historical_evidence">
  title: string;
  source: string;                 // PDF URL, report name, etc.
  content: string;                // Full text or excerpt
  vectorEmbedding?: number[];     // For semantic search (Phase 4)
  relatedCategories: string[];    // Which concern categories this covers
  infrastructureTypes: string[];  // Which types this evidence relates to
  date?: Date;                    // Publication date if known
  fetchedAt: Date;
}
```

#### `mitigations`
```typescript
{
  _id: Id<"mitigations">
  category: "environmental" | "social" | "technical" | "financial" | "legal";
  infrastructureType?: string;    // Optional: specific to infra type
  description: string;
  standard?: boolean;             // Is this an industry standard mitigation?
  references?: string[];        // Links to evidence or standards
}
```

#### `users`
```typescript
{
  _id: Id<"users">
  email: string;                  // Unique
  name?: string;
  role: "admin" | "planner" | "analyst";
  createdAt: Date;
  lastLogin: Date;
}
```

#### `graph_entities` (Phase 4)
```typescript
{
  _id: Id<"graph_entities">
  projectId: Id<"projects">      // Reference to project
  entityType: "activity" | "stakeholder" | "location" | "receptor" | "infrastructure_type" | "impact" | "mitigation";
  name: string;                   // Entity name
  description?: string;           // Optional description
  createdAt: Date;
  createdBy: string;              // authId of creator
}
```

#### `graph_relationships` (Phase 4)
```typescript
{
  _id: Id<"graph_relationships">
  projectId: Id<"projects">      // Reference to project
  sourceType: "entity" | "project" | "historical_case";
  sourceId: Id<"graph_entities"> | Id<"projects"> | Id<"historical_evidence">;
  targetType: "entity" | "project" | "historical_case";
  targetId: Id<"graph_entities"> | Id<"projects"> | Id<"historical_evidence">;
  relationshipType: "HAS_ACTIVITY" | "LOCATED_IN" | "AFFECTS" | "MAY_IMPACT" | "SUPPORTED_BY" | "RELATED_TO" | "ADDRESSES";
  evidenceRef: Id<"documents"> | Id<"citizen_feedback"> | Id<"historical_evidence">;  // Evidence source
  sourcePassage?: string;           // Excerpt/paragraph reference in evidence
  evidenceType: "verified_fact" | "reported_concern" | "inferred_relationship" | "unverified_hypothesis";
  confidence?: number;            // 0-1 confidence for inferred relationships
  createdBy: string;                // authId of creator
  createdAt: Date;
}
```

**Source/Target Types:**
- `entity`: A graph entity (activity, stakeholder, location, receptor, infrastructure_type, impact, mitigation)
- `project`: A project record - enables `Project HAS_ACTIVITY Activity` and `Project RELATED_TO HistoricalCase`
- `historical_case`: A historical_evidence record - enables `Project RELATED_TO HistoricalCase`

**Evidence Assertion Types:**
- `verified_fact`: Documented evidence (from documents or verified feedback)
- `reported_concern`: Citizen concern that raises the issue
- `inferred_relationship`: Analyst or ML inference (marked as inference, not fact)
- `unverified_hypothesis`: Speculative connection, not yet validated

**Confidence:** Values must be in range [0, 1]. Not a substitute for verified facts.

**Owner:** Dev 1 (Coordinator)
**Validation:** Run `bunx convex dev` to generate TypeScript types

---

## 3. Knowledge Graph API (Convex Functions)

**Implemented:** Prompts 4-6 complete (November 2026)
**Owner:** Dev 1 (Coordinator)

### 3.1 Entity Management

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `createEntity` | mutation | `projectId, entityType, name, description?` | Creates a new graph entity |
| `getEntity` | query | `entityId` | Gets entity with project access check |
| `listProjectEntities` | query | `projectId, entityType?` | Lists all entities in a project |
| `deleteEntity` | mutation | `entityId` | Deletes entity and related relationships (owner only) |

**Entity Types:** `activity`, `stakeholder`, `location`, `receptor`, `infrastructure_type`, `impact`, `mitigation`

### 3.2 Relationship Management

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `createRelationship` | mutation | `projectId, sourceType, sourceId, targetType, targetId, relationshipType, documentId?, feedbackId?, evidenceId?, sourcePassage?, evidenceType, confidence?` | Creates a relationship with evidence provenance |
| `getEntityRelationships` | query | `entityId, includeEvidence?` | Gets inbound/outbound relationships for an entity |
| `getEvidenceForRelationship` | query | `relationshipId` | Gets relationship with its evidence |
| `findEntitiesByEvidence` | query | `projectId, documentId?, feedbackId?, evidenceId?` | Finds entities linked to specific evidence |
| `deleteRelationship` | mutation | `relationshipId` | Deletes a relationship (owner only) |

**Relationship Types:** `HAS_ACTIVITY`, `LOCATED_IN`, `AFFECTS`, `MAY_IMPACT`, `SUPPORTED_BY`, `RELATED_TO`, `ADDRESSES`

**Evidence Types:** `verified_fact`, `reported_concern`, `inferred_relationship`, `unverified_hypothesis`

**Type/ID Validation:**
- `sourceType: "entity"` → sourceId must exist in `graph_entities`
- `sourceType: "project"` → sourceId must exist in `projects` (owner check)
- `sourceType: "historical_case"` → sourceId must exist in `historical_evidence` (global)
- Same validation for target

### 3.3 Impact Analysis

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `getImpactTrace` | query | `projectId, impactId` | Traces impacts: what affects them, what supports them |
| `getProjectActivities` | query | `projectId` | Gets activities linked to project (HAS_ACTIVITY) |
| `getHistoricalCases` | query | `projectId` | Gets historical cases related to project (RELATED_TO) |

### 3.4 Access Control

- All functions require authentication
- Project-level access: owner or member
- Entity operations require project membership
- Relationship creation validates source/target exist and are accessible
- Historical evidence is global (not project-scoped)

### 3.5 Validation Rules

1. **Confidence:** Must be in range [0, 1] for inferred relationships
2. **Type/ID Mismatch:** Explicit table lookups reject mismatched combinations
3. **Cross-project access:** Source entities cannot belong to other projects
4. **Evidence provenance:** All relationships link to document, feedback, or historical evidence

---

## 4. Risk Analysis API (Convex Functions)

**Implemented:** Prompts 4-7 complete (November 2026)
**Owner:** Dev 1 (Coordinator)

### 4.1 Risk Identification

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `identifyRisk` | mutation | `projectId, title, description, category, confidence, entityId?, stakeholderId?, locationId?, evidenceType, evidenceRef, sourcePassage?` | Creates an evidence-grounded risk with provenance tracking |

**Evidence Types:** `verified_fact`, `reported_concern`, `inferred_relationship`, `unverified_hypothesis`

**Evidence Provenance:**
- **DOCUMENTED**: Risks from project documents (EIA, DPR, etc.)
- **CITIZEN_VOICE**: Risks from citizen feedback/concerns
- **PATTERN_INFERRED**: Risks inferred from ML analysis
- **HISTORICAL_ANALOG**: Risks from historical evidence comparisons

### 4.2 Risk Retrieval

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `getRisksForProject` | query | `projectId, category?, status?, riskLevel?` | Lists all risks with optional filters |
| `getRiskWithEvidence` | query | `riskId` | Gets risk with full evidence chain |
| `getPrioritizedRisks` | query | `projectId` | Gets risks sorted by evidence-based score |
| `getRiskImpactTrace` | query | `projectId, riskId` | Gets risk with related entities and evidence |

### 4.3 Mitigation Intelligence

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `suggestMitigations` | query | `riskId` | Finds candidate mitigations from evidence |
| `getMitigationsForRisk` | query | `riskId` | Lists all mitigation candidates for a risk |
| `approveMitigation` | mutation | `mitigationId, notes?` | Approves a mitigation candidate |
| `rejectMitigation` | mutation | `mitigationId, notes?` | Rejects a mitigation candidate |

### 4.4 Human Review Workflow

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `updateRiskStatus` | mutation | `riskId, status, action, notes?` | Accept/reject/edit risks |
| `requestAdditionalEvidence` | mutation | `riskId, notes?` | Flags risk for more evidence |

### 4.5 Risk Scoring

**Inherent Risk Score Formula:**
```
Inherent Risk Score = Likelihood × Impact × Exposure

Score Range: 1-125 (integer)
Risk Levels:
- LOW: 1-20
- MEDIUM: 21-60
- HIGH: 61-80
- CRITICAL: 81-125
```

**Note:** No mathematical mitigation effectiveness model is implemented. The `combined` calculation in tests demonstrates a possible approach but is not used in production risk scoring. Mitigation effectiveness must be assessed through verified evidence, not arbitrary formulas.

### 4.6 Risk Status Lifecycle

**Status Values:**
- `PENDING_REVIEW` - Risk identified, under initial review
- `ACCEPTED` - Risk accepted as valid
- `REJECTED` - Risk rejected as invalid
- `UNRESOLVED` - Risk returned for further work

**Valid State Transitions:**
```
PENDING_REVIEW → ACCEPTED, REJECTED, UNRESOLVED
ACCEPTED → UNRESOLVED
REJECTED → UNRESOLVED, PENDING_REVIEW
UNRESOLVED → PENDING_REVIEW, ACCEPTED, REJECTED
```

### 4.7 Residual Risk Lifecycle

**Effectiveness Levels:**
- `NOT_ASSESSED` - No verified mitigation effectiveness available
- `PROVISIONAL` - Some mitigation information exists, but evidence is insufficient for a defensible residual assessment
- `ASSESSED` - Sufficient verified mitigation effectiveness evidence exists

**Residual Risk Calculation Rules:**
- Inherent risk remains unchanged after mitigation
- Unapproved or unimplemented mitigation does not reduce residual risk score
- Unverified mitigation effectiveness does not reduce residual risk score
- If residual risk cannot be calculated defensibly, store `residualRiskScore: undefined` and `residualRiskAssessmentLevel: "NOT_ASSESSED"`
- Historical evidence alone cannot establish a verified residual risk

### 4.8 Risk Data Model

### 4.6 Risk Data Model Extensions

**New Tables:**

#### `risks`
```typescript
{
  _id: Id<"risks">,
  projectId: Id<"projects">,
  entityId?: Id<"graph_entities">,
  stakeholderId?: Id<"graph_entities">,
  locationId?: Id<"graph_entities">,
  title: string,
  description: string,
  category: "environmental" | "social" | "technical" | "financial" | "legal",
  likelihood: 1 | 2 | 3 | 4 | 5,
  impact: 1 | 2 | 3 | 4 | 5,
  exposure: 1 | 2 | 3 | 4 | 5,
  inherentRiskScore: number,           // Likelihood × Impact × Exposure (1-125)
  residualRiskScore?: number,          // Set only when defensively calculated
  riskLevel: "low" | "medium" | "high" | "critical",
  status: "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "UNRESOLVED",
  auditTrail: [
    {
      action: string,
      performedBy: string,
      performedAt: number,
      notes?: string,
      previousValue?: string,
      newValue?: string,
    },
  ],
  createdBy: string,
  createdAt: number,
  updatedAt: number,
}
```

**Note:** The `confidence` field has been removed from the risks table. All risk values are directly specified (likelihood, impact, exposure) and must be evidence-grounded.

#### `risk_mitigations`
```typescript
{
  _id: Id<"risk_mitigations">,
  riskId: Id<"risks">,
  description: string,
  status: "proposed" | "approved" | "rejected" | "implemented",
  supportingEvidenceType: "verified_fact" | "reported_concern" | "inferred_relationship" | "unverified_hypothesis",
  supportingEvidenceRef: Id<"documents"> | Id<"citizen_feedback"> | Id<"historical_evidence">,
  supportingEvidencePassage?: string,
  existingMitigationRef?: Id<"mitigations">,
  missingCoverage: boolean,
  coverageReason?: string,
  recommendationReason: string,
  effectivenessLevel: "NOT_ASSESSED" | "PROVISIONAL" | "ASSESSED",
  verifiedEffectivePercent?: number,  // 0-100, only when ASSESSED
  effectivenessEvidenceRef?: Id<"documents"> | Id<"citizen_feedback">,
  implementationEvidenceRef?: Id<"documents"> | Id<"citizen_feedback"> | Id<"historical_evidence">,
  createdBy: string,
  createdAt: number,
  updatedAt: number,
  reviewHistory: [
    {
      action: "proposed" | "approved" | "rejected" | "implemented",
      performedBy: string,
      performedAt: number,
      notes?: string,
    },
  ],
}
```

#### `evidence_items`
```typescript
{
  _id: Id<"evidence_items">,
  riskId: Id<"risks">,
  evidenceType: "DOCUMENTED" | "CITIZEN_VOICE" | "PATTERN_INFERRED" | "HISTORICAL_ANALOG",
  evidenceRef: Id<"documents"> | Id<"citizen_feedback"> | Id<"historical_evidence">,
  sourceEvidenceType: "verified_fact" | "reported_concern" | "inferred_relationship" | "unverified_hypothesis",
  relevance: "primary" | "supporting",
  evidenceStrength: "verified" | "unverified",
  verificationStatus: "verified" | "unverified",
  sourcePassage?: string,
  addedBy: string,
  addedAt: number,
}
```

**Evidence Provenance Types:**
- `DOCUMENTED` - Risks from project documents (EIA, DPR, etc.)
- `CITIZEN_VOICE` - Risks from citizen feedback/concerns
- `PATTERN_INFERRED` - Risks inferred from ML analysis
- `HISTORICAL_ANALOG` - Risks from historical evidence comparisons (global, not project-scoped)

**Note:** Historical evidence is global (not project-scoped) but requires verification before it can establish a verified current risk in a project.

---

## 5. Risk Analysis API (Convex Functions)

**Implemented:** Prompts 4-7 complete (November 2026)
**Owner:** Dev 1 (Coordinator)

### 5.1 Risk Identification

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `identifyRisk` | mutation | `projectId, title, description, category, entityId?, stakeholderId?, locationId?, likelihood, impact, exposure, evidenceRef, evidenceType, sourceEvidenceType, verificationStatus, relevance, sourcePassage?` | Creates an evidence-grounded risk with likelihood, impact, exposure scales (1-5) |

### 5.2 Risk Retrieval

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `getRisksForProject` | query | `projectId, category?, status?, riskLevel?` | Lists all risks with optional filters |
| `getRiskWithEvidence` | query | `riskId` | Gets risk with full evidence chain |
| `getPrioritizedRisks` | query | `projectId` | Gets risks sorted by inherent risk score (descending) |
| `getRiskImpactTrace` | query | `projectId, riskId` | Gets risk with related entities and evidence |

### 5.3 Evidence Management

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `addEvidence` | mutation | `riskId, evidenceType, evidenceRef, sourceEvidenceType, relevance, evidenceStrength, verificationStatus, sourcePassage?` | Adds evidence to a risk with project isolation for documents and feedback |

**Historical Evidence Rules:**
- Historical evidence is global (not project-scoped)
- Cross-project restriction: Document evidence and citizen feedback evidence cannot cross projects
- Historical evidence alone cannot establish a verified current risk without additional verification

### 5.4 Mitigation Management

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `suggestMitigations` | query | `riskId` | Finds candidate mitigations from evidence |
| `createMitigationCandidate` | mutation | `riskId, mitigationId, notes?` | Creates a mitigation candidate from template |
| `getMitigationsForRisk` | query | `riskId` | Lists all mitigation candidates for a risk |
| `approveMitigation` | mutation | `mitigationId, notes?` | Approves a mitigation candidate |
| `rejectMitigation` | mutation | `mitigationId, notes?` | Rejects a mitigation candidate |
| `verifyMitigationEffectiveness` | mutation | `mitigationId, effectivenessPercent, effectivenessEvidenceRef, notes?` | Marks mitigation as implemented with verified effectiveness |

**Mitigation Effectiveness Rules:**
- `NOT_ASSESSED` - No verified mitigation effectiveness available
- `PROVISIONAL` - Some mitigation information exists, but evidence is insufficient for a defensible residual assessment
- `ASSESSED` - Sufficient verified mitigation effectiveness evidence exists
- Unapproved mitigations do not reduce residual risk score
- Unverified effectiveness does not reduce residual risk score

### 5.5 Human Review Workflow

| Function | Type | Args | Description |
|----------|------|------|-------------|
| `updateRiskStatus` | mutation | `riskId, status, action, notes?` | Accept/reject/edit risks with status validation |
| `requestAdditionalEvidence` | mutation | `riskId, notes?` | Flags risk for more evidence |

**Status Valid Transitions:**
- `PENDING_REVIEW` → `ACCEPTED`, `REJECTED`, `UNRESOLVED`
- `ACCEPTED` → `UNRESOLVED`
- `REJECTED` → `UNRESOLVED`, `PENDING_REVIEW`
- `UNRESOLVED` → `PENDING_REVIEW`, `ACCEPTED`, `REJECTED`

### 5.6 Authorization Rules

| Role | Can View | Can Create | Can Edit |
|------|----------|------------|----------|
| Owner | ✅ | ✅ | ✅ |
| Editor | ✅ | ✅ | ✅ |
| Viewer | ✅ | ❌ | ❌ |

**Project Isolation:**
- All operations require project membership verification
- Document evidence must belong to the same project
- Citizen feedback evidence must belong to the same project
- Historical evidence is global

### 5.7 Audit Trail

Each risk maintains an `auditTrail` array with entries containing:
- `action` - The action performed
- `performedBy` - authId of the actor
- `performedAt` - Timestamp (milliseconds since epoch)
- `notes` - Optional notes
- `previousValue` - Optional: value before change
- `newValue` - Optional: value after change

---

## 6. ML Service API Contracts

**Owner:** Dev 2 (Akshay)

### 6.1 Health Check

**Endpoint:** `GET /health`
**Response:**
```json
{
  "status": "ok",
  "service": "ml-service",
  "python": "3.14.6",
  "torch": "2.15.0+cu132",
  "cuda_available": true,
  "models_loaded": true,
  "models": ["mbert", "xlm-r"],
  "device": "cuda:0"
}
```

### 2.2 Language Detection

**Endpoint:** `POST /detect-language`
**Request:**
```json
{
  "text": "string (up to 1000 characters per request)"
}
```
**Response:**
```json
{
  "language": "en",
  "confidence": 0.98,
  "script": "Latn"
}
```
**Supported languages:** en, te, te-Latn, kn, kn-Latn

### 2.3 Concern Classification

**Endpoint:** `POST /classify`
**Request:**
```json
{
  "texts": ["string"],
  "languages": ["en", "te", "te-Latn"]  // Optional, auto-detect if omitted
}
```
**Response:**
```json
{
  "results": [
    {
      "category": "environmental",
      "confidence": 0.85,
      "subcategory": "water quality"  // When available
    }
  ]
}
```
**Categories:** environmental, social, technical, financial, legal

### 2.4 Entity Extraction

**Endpoint:** `POST /extract`
**Request:**
```json
{
  "texts": ["string"],
  "languages": ["en", "kn"]  // Optional
}
```
**Response:**
```json
{
  "results": [
    {
      "locations": ["Central Park", "Chennai"],
      "stakeholders": ["Residents", "City Council"],
      "infrastructureTypes": ["water supply", "road"],
      "dates": ["2023-06-15", "June 2023"]
    }
  ]
}
```

### 2.5 Combined Analyze (Batch)

**Endpoint:** `POST /analyze`
**Request:**
```json
{
  "texts": ["string"],
  "languages": ["en"]  // Optional
}
```
**Response:**
```json
{
  "results": [
    {
      "language": "en",
      "languageConfidence": 0.99,
      "classification": {
        "category": "environmental",
        "confidence": 0.85
      },
      "entities": {
        "locations": ["Downtown"],
        "stakeholders": ["Citizens"],
        "infrastructureTypes": ["water"],
        "dates": ["2023"]
      }
    }
  ]
}
```

### 2.6 Error Responses

All endpoints may return:
```json
{
  "error": "string",
  "details": "string (optional)"
}
```

**Status codes:**
- 200: Success
- 400: Bad request (invalid payload)
- 422: Unprocessable entity (text too long, language not supported)
- 500: Server error (model crashed, GPU OOM)

---

## 3. Next.js Route Handlers (API Routes)

**Owner:** Dev 3 (Lucky)

> **Note:** Route Handlers are built **after** Phase 5 (Risk Engine completion). Current Phase 3 status: Contracts defined but implementation pending.

### 3.1 Convex Connection Check

**Endpoint:** `GET /api/convex-test`
**Response:**
```json
{ "ok": true, "message": "Convex is connected" }
```

### 3.2 Projects API

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| GET | `/api/projects` | `listProjects` | Project[] |
| POST | `/api/projects` | `createProject` | Project (created) |
| GET | `/api/projects/[id]` | `getProject` | Project |
| PUT | `/api/projects/[id]` | `updateProject` | Project (updated) |
| DELETE | `/api/projects/[id]` | `deleteProject` | { success: true } |

### 3.3 Documents API

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| POST | `/api/documents` | `uploadDocument` | Document (created) |
| GET | `/api/documents/[id]` | `getDocument` | Document |
| GET | `/api/projects/[projectId]/documents` | `listProjectDocuments` | Document[] |

### 3.4 Feedback API

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| POST | `/api/feedback` | `submitFeedback` | Feedback (created) |
| GET | `/api/projects/[projectId]/feedback` | `listProjectFeedback` | CitizenFeedback[] |

### 3.5 Concerns API

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| POST | `/api/concerns/analyze` | `analyzeDocuments` | Concern[] (new) |
| GET | `/api/projects/[projectId]/concerns` | `listProjectConcerns` | Concern[] |
| GET | `/api/concerns/[id]` | `getConcern` | Concern |
| GET | `/api/concerns/prioritized/[projectId]` | `getPrioritisedConcerns` | Concern[] (sorted by priority) |

### 3.6 Evidence API

| Method | Path | Handler | Response |
|--------|------|---------|----------|
| GET | `/api/evidence` | `searchEvidence` | HistoricalEvidence[] (matched) |
| GET | `/api/evidence/[id]` | `getEvidence` | HistoricalEvidence |

---

## 4. ML Service Client Interface (TypeScript)

**Owner:** Dev 3 (Lucky) - implementation; Dev 2 (Akshay) - API definition

### `ml-client.ts`

```typescript
interface MLResponse {
  status: number;
  data: any;
  error?: string;
}

class MLClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async health(): Promise<MLResponse> {
    // GET /health
  }

  async detectLanguage(text: string): Promise<MLResponse> {
    // POST /detect-language
  }

  async classify(texts: string[], languages?: string[]): Promise<MLResponse> {
    // POST /classify
  }

  async extract(texts: string[], languages?: string[]): Promise<MLResponse> {
    // POST /extract
  }

  async analyze(texts: string[], languages?: string[]): Promise<MLResponse> {
    // POST /analyze
  }
}

export const mlClient = new MLClient(process.env.NEXT_PUBLIC_ML_SERVICE_URL);
```

**Environment variable:** `NEXT_PUBLIC_ML_SERVICE_URL` (http://localhost:8000 in dev)

---

## 5. Integration Patterns

### 5.1 Document Upload Flow

```
1. Frontend: POST /api/documents (multipart/form-data)
2. Route Handler: Save file to Convex storage, extract text if small PDF/txt
3. Route Handler: Call ML analyze endpoint for classification/extraction
4. ML Service: Return language, category, entities
5. Route Handler: Create Document + Concern records in Convex
6. Return: Document ID, Concern IDs
```

### 5.2 Evidence Retrieval Flow

```
1. Frontend: GET /api/evidence?query=criteria
2. Route Handler: Build Convex query with semantic search (Phase 4)
   OR: Proxy to ML service if using sentence-transformers
3. ML Service (optional): Compute embeddings, FAISS/convex vector search
4. Route Handler: Filter by category/infrastructure type
5. Return: Ranked list of evidence
```

### 5.3 Concern Prioritisation Flow

```
1. Concerns have: category, mitigationStatus, evidence strength
2. Algorithm (Phase 5):
   priority = severity_weight × category_severity
           + frequency_weight × concern_frequency
           + evidence_weight × evidence_strength
3. Computed on read (via Convex query) or stored in concern record
4. API: GET /api/concerns/prioritized/[projectId]
```

---

## 6. Error Handling

### 6.1 ML Service Errors

- **Model load failure:** `/health` returns `models_loaded: false`, 500
- **GPU OOM:** Return 500 with "resource exhausted" message
- **Text too long:** Return 422 with character limit
- **Language not supported:** Return 422 with supported languages list

### 6.2 Convex Errors

- Use Convex's built-in error handling in mutations/queries
- Propagate meaningful messages to Route Handlers
- Frontend: Display user-friendly toast/snackbar

### 6.3 Route Handler Errors

- Always return JSON: `{ error: "message" }`
- Use appropriate HTTP status codes
- Log errors (stdout is captured by Convex logs)

---

## 7. Rate Limits & Constraints

### ML Service
- Request size: 1000 characters per text
- Batch size: 32 items per request
- Rate limit: 100 requests/minute (documented, adjust as needed)
- Model loading time: ~30s at startup

### Convex
- Query size: 10MB limit for file storage
- Mutation input: 1MB limit
- Free tier limits (Phase 9): Check before production deployment

---

## 8. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-11-22 | Initial: Phase 0 data models, ML API shapes, Route Handler structure | Dev 1 |
| 1.0 | 2026-11-26 | Prompts 4-6: Auth, Documents, Feedback, Knowledge Graph APIs | Dev 1 |
| 2.0 | 2026-11-27 | Prompt 7: Risk Analysis Engine, Evidence Traceability, Mitigation Management. Corrections: Removed confidence field from risks schema, added residual risk lifecycle, documented multiple mitigation combination, historical evidence safeguards | Dev 1 |
| 3.0 | TBD | Prompt 8: ML Service Integration, Model APIs | Dev 2 |
| 4.0 | TBD | Prompt 9: Full Testing, E2E, Production Hardening | All |

---

## Notes

- **Contract ownership:** Dev 1 (Convex), Dev 2 (ML), Dev 3 (Frontend) - each section updated by respective owner
- **Version bump:** Any breaking change increments version number
- **Mock servers:** Use for parallel testing until Phase 5
- **Typescript interfaces:** Generate from this document (keep source of truth)
- **Free tier constraints apply** - all services must fit within free limits