import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // App-level user profiles with role-based access control
  // Linked to Better Auth user via authId
  user: defineTable({
    authId: v.string(),
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("analyst"),
      v.literal("planner"),
      v.literal("admin"),
    ),
    verificationStatus: v.union(v.literal("unverified"), v.literal("verified")),
    isBlocked: v.boolean(),
    registrationCompleted: v.boolean(),
    createdAt: v.number(),
  })
    .index("email", ["email"])
    .index("authId", ["authId"]),

  // Project scope table
  projects: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
    startDate: v.number(),
    expectedEndDate: v.union(v.null(), v.number()),
    status: v.union(
      v.literal("planning"),
      v.literal("active"),
      v.literal("completed"),
      v.literal("cancelled"),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    ownerId: v.string(),
  })
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"])
    .index("by_owner", ["ownerId"]),

  // Project membership table
  project_members: defineTable({
    projectId: v.id("projects"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
    joinedAt: v.number(),
  })
    .index("project_user", ["projectId", "userId"])
    .index("user_projects", ["userId", "projectId"]),

  // Document management table
  documents: defineTable({
    projectId: v.id("projects"),
    fileName: v.string(),
    documentType: v.union(
      v.literal("DPR"),
      v.literal("EIA"),
      v.literal("ESIA"),
      v.literal("EMP"),
      v.literal("SIA"),
      v.literal("feasibility_report"),
      v.literal("public_hearing_record"),
    ),
    mimeType: v.string(),
    fileSize: v.number(),
    storageId: v.string(),
    version: v.number(),
    provenance: v.string(),
    uploadStatus: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    // Explicit factual verification for evidence integrity
    // Processing completion does NOT equal factual verification - requires explicit verification action
    verificationStatus: v.union(v.literal("unverified"), v.literal("verified")),
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verificationNotes: v.optional(v.string()),
    uploadedBy: v.string(),
    uploadedAt: v.number(),
    updatedAt: v.number(),
    downloadCount: v.number(),
    metadata: v.object({
      pages: v.optional(v.number()),
      author: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  })
    .index("by_project", ["projectId"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_type", ["documentType"])
    .index("by_status", ["uploadStatus"])
    .index("by_verification", ["verificationStatus"]),

  // Citizen feedback table
  citizen_feedback: defineTable({
    projectId: v.id("projects"),
    content: v.string(),
    language: v.union(
      v.literal("en"),
      v.literal("te"),
      v.literal("te-Latn"),
      v.literal("kn"),
      v.literal("kn-Latn"),
    ),
    source: v.union(v.literal("web"), v.literal("mobile"), v.literal("api")),
    submittedBy: v.optional(v.string()),
    submittedAt: v.number(),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    classificationStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    entitiesStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    humanReviewStatus: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("flagged"),
    ),
    reviewHistory: v.array(
      v.object({
        reviewedBy: v.string(),
        reviewedAt: v.number(),
        status: v.union(
          v.literal("pending"),
          v.literal("reviewed"),
          v.literal("flagged"),
        ),
        notes: v.optional(v.string()),
      }),
    ),
    // Explicit factual verification for evidence integrity
    // Human review does NOT equal factual verification - requires explicit verification action
    verificationStatus: v.union(v.literal("unverified"), v.literal("verified")),
    verifiedBy: v.optional(v.string()),
    verifiedAt: v.optional(v.number()),
    verificationNotes: v.optional(v.string()),
    // Fields populated by ML service - remain pending until ML processes
    category: v.optional(
      v.union(
        v.literal("environmental"),
        v.literal("social"),
        v.literal("technical"),
        v.literal("financial"),
        v.literal("legal"),
      ),
    ),
    confidence: v.optional(v.number()),
    entities: v.optional(
      v.object({
        locations: v.optional(v.array(v.string())),
        stakeholders: v.optional(v.array(v.string())),
        infrastructureTypes: v.optional(v.array(v.string())),
        dates: v.optional(v.array(v.string())),
      }),
    ),
  })
    .index("by_project", ["projectId"])
    .index("by_submitter", ["submittedBy"])
    .index("by_language", ["language"])
    .index("by_review_status", ["humanReviewStatus"])
    .index("by_processing_status", ["processingStatus"])
    .index("by_verification", ["verificationStatus"]),

  // Feedback archive for deleted feedback (preserves content)
  feedback_archive: defineTable({
    originalFeedbackId: v.string(),
    content: v.string(),
    language: v.union(
      v.literal("en"),
      v.literal("te"),
      v.literal("te-Latn"),
      v.literal("kn"),
      v.literal("kn-Latn"),
    ),
    source: v.union(v.literal("web"), v.literal("mobile"), v.literal("api")),
    archivedAt: v.number(),
    archivedBy: v.string(),
    projectDeleted: v.boolean(),
  })
    .index("by_original_id", ["originalFeedbackId"])
    .index("by_archived_at", ["archivedAt"]),

  // Historical evidence table (for past infrastructure projects/cases)
  historical_evidence: defineTable({
    title: v.string(),
    source: v.string(),
    content: v.string(),
    relatedCategories: v.array(v.string()),
    infrastructureTypes: v.array(v.string()),
    date: v.union(v.string(), v.null()),
    fetchedAt: v.number(),
  }).index("by_fetched_at", ["fetchedAt"]),

  // Mitigations table
  mitigations: defineTable({
    projectId: v.optional(v.id("projects")),
    category: v.union(
      v.literal("environmental"),
      v.literal("social"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("legal"),
    ),
    infrastructureType: v.optional(v.string()),
    description: v.string(),
    standard: v.optional(v.boolean()),
    references: v.optional(v.array(v.string())),
  })
    .index("by_category", ["category"])
    .index("by_project", ["projectId"]),

  // Evidence items table - tracks multiple evidence per risk
  evidence_items: defineTable({
    riskId: v.id("risks"),
    evidenceType: v.union(
      v.literal("DOCUMENTED"),
      v.literal("CITIZEN_VOICE"),
      v.literal("PATTERN_INFERRED"),
      v.literal("HISTORICAL_ANALOG"),
    ),
    evidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
      v.id("historical_evidence"),
    ),
    sourceEvidenceType: v.union(
      v.literal("verified_fact"),
      v.literal("reported_concern"),
      v.literal("inferred_relationship"),
      v.literal("unverified_hypothesis"),
    ),
    relevance: v.union(v.literal("primary"), v.literal("supporting")),
    evidenceStrength: v.union(v.literal("verified"), v.literal("unverified")),
    verificationStatus: v.union(v.literal("verified"), v.literal("unverified")),
    sourcePassage: v.optional(v.string()),
    addedBy: v.string(),
    addedAt: v.number(),
  })
    .index("by_risk", ["riskId"])
    .index("by_evidence_type", ["evidenceType"])
    .index("by_verification", ["verificationStatus"]),

  // Risk assessment scales (1-5)
  // Factors are optional to support INSUFFICIENT_DATA handling
  risk_scales: defineTable({
    projectId: v.id("projects"),
    likelihood: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    impact: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    exposure: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    inherentRiskScore: v.union(v.number(), v.null()),
  }).index("by_project", ["projectId"]),

  // Risks table (Phase 5 - Risk Analysis Engine)
  risks: defineTable({
    projectId: v.id("projects"),
    entityId: v.optional(v.id("graph_entities")),
    stakeholderId: v.optional(v.id("graph_entities")),
    locationId: v.optional(v.id("graph_entities")),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("environmental"),
      v.literal("social"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("legal"),
    ),
    // Likelihood scale: 1=Rare to 5=Almost Certain (heuristic prioritization, not probability)
    // Missing factor handling: if any factor is missing, inherentRiskScore will be null (INSUFFICIENT_DATA)
    likelihood: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    // Impact scale: 1=Negligible to 5=Catastrophic (heuristic prioritization, not measurable impact)
    impact: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    // Exposure scale: 1=Minimal to 5=Widescale (heuristic prioritization, not exposure measurement)
    exposure: v.optional(
      v.union(
        v.literal(1),
        v.literal(2),
        v.literal(3),
        v.literal(4),
        v.literal(5),
      ),
    ),
    // Missing factor handling: if any factor is missing, inherentRiskScore must be null
    inherentRiskScore: v.union(v.number(), v.null()),
    residualRiskScore: v.optional(v.number()),
    residualRiskAssessment: v.optional(
      v.union(
        v.literal("NOT_ASSESSED"),
        v.literal("PROVISIONAL"),
        v.literal("ASSESSED"),
      ),
    ),
    residualRiskEvidenceRefs: v.optional(
      v.array(v.union(v.id("documents"), v.id("citizen_feedback"))),
    ),
    residualRiskAssessmentNotes: v.optional(v.string()),
    riskLevel: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("critical"),
      v.literal("INSUFFICIENT_DATA"),
    ),
    status: v.union(
      v.literal("PENDING_REVIEW"),
      v.literal("ACCEPTED"),
      v.literal("REJECTED"),
      v.literal("UNRESOLVED"),
    ),
    auditTrail: v.array(
      v.object({
        action: v.union(
          v.literal("identified"),
          v.literal("status_updated"),
          v.literal("additional_evidence_requested"),
          v.literal("residual_risk_assessed"),
          v.literal("effectiveness_verified"),
        ),
        performedBy: v.string(),
        performedAt: v.number(),
        notes: v.optional(v.string()),
        previousValue: v.optional(v.string()),
        newValue: v.optional(v.string()),
      }),
    ),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_category", ["category"])
    .index("by_status", ["status"])
    .index("by_riskLevel", ["riskLevel"])
    .index("by_createdBy", ["createdBy"]),

  // Risk mitigations table (candidate mitigations with review workflow)
  risk_mitigations: defineTable({
    riskId: v.id("risks"),
    description: v.string(),
    status: v.union(
      v.literal("proposed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("implemented"),
    ),
    supportingEvidenceType: v.optional(
      v.union(
        v.literal("verified_fact"),
        v.literal("reported_concern"),
        v.literal("inferred_relationship"),
        v.literal("unverified_hypothesis"),
      ),
    ),
    supportingEvidenceRef: v.optional(
      v.union(
        v.id("documents"),
        v.id("citizen_feedback"),
        v.id("historical_evidence"),
      ),
    ),
    supportingEvidencePassage: v.optional(v.string()),
    existingMitigationRef: v.optional(v.id("mitigations")),
    // Coverage determination: true if project has implemented/existing mitigation for this category
    // This reflects ACTUAL project coverage, not just template availability
    missingCoverage: v.boolean(),
    coverageReason: v.optional(v.string()),
    recommendationReason: v.string(),
    effectivenessLevel: v.union(
      v.literal("NOT_ASSESSED"),
      v.literal("PROVISIONAL"),
      v.literal("ASSESSED"),
    ),
    verifiedEffectivePercent: v.optional(v.number()),
    // Assessment metadata - when present, indicates how the percentage was determined
    // If absent, the percentage is a human-estimated assessment (PROVISIONAL)
    assessmentBasis: v.optional(
      v.object({
        methodology: v.string(),
        outcomeMetric: v.string(),
        measurementPeriod: v.string(),
        supportingEvidenceRef: v.union(
          v.id("documents"),
          v.id("citizen_feedback"),
        ),
        rationale: v.string(),
      }),
    ),
    // implementationEvidenceRef: historical_evidence not allowed - can only be from same-project documents/feedback
    implementationEvidenceRef: v.optional(
      v.union(v.id("documents"), v.id("citizen_feedback")),
    ),
    effectivenessEvidenceRef: v.optional(
      v.union(v.id("documents"), v.id("citizen_feedback")),
    ),
    createdBy: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    reviewHistory: v.array(
      v.object({
        action: v.union(
          v.literal("proposed"),
          v.literal("approved"),
          v.literal("rejected"),
          v.literal("implemented"),
          v.literal("effectiveness_verified"),
        ),
        performedBy: v.string(),
        performedAt: v.number(),
        notes: v.optional(v.string()),
      }),
    ),
  })
    .index("by_risk", ["riskId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // Residual risk assessments (Phase 7 - append-only history)
  residual_risk_assessments: defineTable({
    riskId: v.id("risks"),
    assessmentState: v.union(
      v.literal("NOT_ASSESSED"),
      v.literal("PROVISIONAL"),
      v.literal("ASSESSED"),
    ),
    residualRiskScore: v.optional(v.number()),
    inherentRiskScore: v.union(v.number(), v.null()),
    // Mitigation-related fields for audit trail and context
    eligibleMitigationIds: v.optional(v.array(v.id("risk_mitigations"))),
    mitigationEffectivenessSnapshots: v.optional(
      v.array(
        v.object({
          mitigationId: v.id("risk_mitigations"),
          verifiedEffectivePercent: v.number(),
          effectivenessEvidenceRef: v.optional(
            v.union(v.id("documents"), v.id("citizen_feedback")),
          ),
          implementationEvidenceRef: v.optional(
            v.union(v.id("documents"), v.id("citizen_feedback")),
          ),
        }),
      ),
    ),
    evidenceRefs: v.optional(
      v.array(v.union(v.id("documents"), v.id("citizen_feedback"))),
    ),
    assessmentNotes: v.optional(v.string()),
    assessedBy: v.string(),
    assessedAt: v.number(),
  })
    .index("by_risk", ["riskId"])
    .index("by_assessed_at", ["assessedAt"]),

  // Evidence verifications - explicit human verification of evidence
  // Processing completion does not equal factual verification
  evidence_verifications: defineTable({
    evidenceRef: v.union(v.id("documents"), v.id("citizen_feedback")),
    verifiedBy: v.string(),
    verifiedAt: v.number(),
    verificationNotes: v.optional(v.string()),
  })
    .index("by_evidence", ["evidenceRef"])
    .index("by_verified_at", ["verifiedAt"]),

  // Knowledge graph entities (Phase 4)
  graph_entities: defineTable({
    projectId: v.id("projects"),
    entityType: v.union(
      v.literal("activity"),
      v.literal("stakeholder"),
      v.literal("location"),
      v.literal("receptor"),
      v.literal("infrastructure_type"),
      v.literal("impact"),
      v.literal("mitigation"),
    ),
    name: v.string(),
    description: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.string(),
  })
    .index("by_project", ["projectId"])
    .index("by_type", ["entityType"])
    .index("by_created_by", ["createdBy"]),

  // Knowledge graph relationships with evidence provenance (Phase 4)
  graph_relationships: defineTable({
    projectId: v.id("projects"),
    sourceType: v.union(
      v.literal("entity"),
      v.literal("project"),
      v.literal("historical_case"),
    ),
    sourceId: v.union(
      v.id("graph_entities"),
      v.id("projects"),
      v.id("historical_evidence"),
    ),
    targetType: v.union(
      v.literal("entity"),
      v.literal("project"),
      v.literal("historical_case"),
    ),
    targetId: v.union(
      v.id("graph_entities"),
      v.id("projects"),
      v.id("historical_evidence"),
    ),
    relationshipType: v.union(
      v.literal("HAS_ACTIVITY"),
      v.literal("LOCATED_IN"),
      v.literal("AFFECTS"),
      v.literal("MAY_IMPACT"),
      v.literal("SUPPORTED_BY"),
      v.literal("RELATED_TO"),
      v.literal("ADDRESSES"),
    ),
    evidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
      v.id("historical_evidence"),
    ),
    sourcePassage: v.optional(v.string()),
    evidenceType: v.union(
      v.literal("verified_fact"),
      v.literal("reported_concern"),
      v.literal("inferred_relationship"),
      v.literal("unverified_hypothesis"),
    ),
    confidence: v.optional(v.number()),
    createdBy: v.string(),
    createdAt: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_source", ["sourceId"])
    .index("by_target", ["targetId"])
    .index("by_evidence", ["evidenceRef"]),
});
