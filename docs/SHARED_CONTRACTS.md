# Shared Contracts

**Project:** Knowledge-Driven Stakeholder Analysis and Risk Intelligence for Infrastructure Planning
**Last Updated:** 2026-11-26
**Status:** Version 1.0 (Prompts 4-6 implemented, Prompts 7-9 pending)
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

## 4. ML Service API Contracts

**Owner:** Dev 2 (Akshay)

### 2.1 Health Check

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
| 2.0 | TBD | Prompt 7: Risk Analysis Engine, Mitigation Prioritisation | Dev 1 |
| 3.0 | TBD | Prompt 8: ML Service Integration, Model APIs | Dev 2 |
| 4.0 | TBD | Prompt 9: Full Testing, E2E, Production Hardening | All |

---

## Notes

- **Contract ownership:** Dev 1 (Convex), Dev 2 (ML), Dev 3 (Frontend) - each section updated by respective owner
- **Version bump:** Any breaking change increments version number
- **Mock servers:** Use for parallel testing until Phase 5
- **Typescript interfaces:** Generate from this document (keep source of truth)
- **Free tier constraints apply** - all services must fit within free limits