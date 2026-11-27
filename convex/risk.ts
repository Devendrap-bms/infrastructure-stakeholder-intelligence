import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

type AppUser = {
  authId: string;
  name: string;
  email: string;
  role: "analyst" | "planner" | "admin";
  verificationStatus: "unverified" | "verified";
  isBlocked: boolean;
  registrationCompleted: boolean;
  createdAt: number;
};

type Likelihood = 1 | 2 | 3 | 4 | 5;
type Impact = 1 | 2 | 3 | 4 | 5;
type Exposure = 1 | 2 | 3 | 4 | 5;
type RiskLevel = "low" | "medium" | "high" | "critical" | "INSUFFICIENT_DATA";

const LIKELIHOOD_LABELS: Record<Likelihood, string> = {
  1: "Rare",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost Certain",
};

const IMPACT_LABELS: Record<Impact, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

const EXPOSURE_LABELS: Record<Exposure, string> = {
  1: "Minimal Stakeholders Affected",
  2: "Limited Stakeholder Group",
  3: "Multiple Stakeholders Affected",
  4: "Community Wide Impact",
  5: "Societal/Widescale Impact",
};

const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
  INSUFFICIENT_DATA: "Insufficient Data",
};

const _RISK_LEVEL_THRESHOLDS = {
  low: { max: 20 },
  medium: { min: 21, max: 60 },
  high: { min: 61, max: 80 },
  critical: { min: 81 },
} as const;

type _RiskStatus = "PENDING_REVIEW" | "ACCEPTED" | "REJECTED" | "UNRESOLVED";

type _MitigationStatus = "proposed" | "approved" | "rejected" | "implemented";
type _EffectivenessLevel = "NOT_ASSESSED" | "PROVISIONAL" | "ASSESSED";
type _EvidenceProvenance =
  | "DOCUMENTED"
  | "CITIZEN_VOICE"
  | "PATTERN_INFERRED"
  | "HISTORICAL_ANALOG";
type _EvidenceVerificationStatus = "verified" | "unverified";
type _EvidenceRelevance = "primary" | "supporting";
type _EvidenceStrength = "verified" | "unverified";

async function getCurrentAppUser(ctx: unknown): Promise<AppUser | null> {
  const db = (ctx as any).db;
  const betterAuthUser = await authComponent.safeGetAuthUser(ctx as any);
  if (!betterAuthUser) return null;
  const userRecord = betterAuthUser as { _id: string };
  const user = await db
    .query("user")
    .withIndex("authId", (q: { eq: (key: string, value: string) => unknown }) =>
      q.eq("authId", userRecord._id),
    )
    .first();
  return user ?? null;
}

async function checkUserAuthorized(ctx: unknown): Promise<AppUser> {
  const user = await getCurrentAppUser(ctx);
  if (!user) throw new Error("Not authenticated");
  if (user.isBlocked) throw new Error("Account is blocked");
  return user;
}

async function checkUserProjectRole(
  ctx: unknown,
  projectId: string,
  currentUser: AppUser,
): Promise<"owner" | "editor" | "viewer" | "none"> {
  const db = (ctx as any).db;

  const project = await db.get(projectId);
  if (!project) throw new Error("Project not found");

  if (project.ownerId === currentUser.authId) return "owner";

  const membership = (await db
    .query("project_members")
    .withIndex("project_user", (q: any) =>
      q.eq("projectId", projectId).eq("userId", currentUser.authId),
    )
    .first()) as { role: "owner" | "editor" | "viewer" } | null;

  if (!membership) return "none";
  return membership.role;
}

function _isViewer(
  accessLevel: "owner" | "editor" | "viewer" | "none",
): boolean {
  return accessLevel === "viewer";
}

function _canMutate(
  accessLevel: "owner" | "editor" | "viewer" | "none",
): boolean {
  return accessLevel === "owner" || accessLevel === "editor";
}

function computeInherentRiskScore(
  likelihood: Likelihood,
  impact: Impact,
  exposure: Exposure,
): number {
  return likelihood * impact * exposure;
}

function getRiskLevelFromScore(score: number): RiskLevel {
  if (score >= 81) return "critical";
  if (score >= 61) return "high";
  if (score >= 21) return "medium";
  return "low";
}

function _parseScaleValue(value: number | undefined): number {
  if (value === undefined) throw new Error("Scale value cannot be undefined");
  if (value < 1 || value > 5)
    throw new Error("Scale value must be between 1 and 5");
  return value;
}

export const identifyRisk = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("environmental"),
      v.literal("social"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("legal"),
    ),
    entityId: v.optional(v.id("graph_entities")),
    stakeholderId: v.optional(v.id("graph_entities")),
    locationId: v.optional(v.id("graph_entities")),
    // Risk factors are optional - if any is missing, inherentRiskScore will be null (INSUFFICIENT_DATA)
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
    evidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
      v.id("historical_evidence"),
    ),
    evidenceType: v.union(
      v.literal("verified_fact"),
      v.literal("reported_concern"),
      v.literal("inferred_relationship"),
      v.literal("unverified_hypothesis"),
    ),
    sourcePassage: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkUserProjectRole(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Validate knowledge graph entity references if provided
    if (args.entityId) {
      const entity = await ctx.db.get("graph_entities", args.entityId);
      if (!entity) {
        throw new Error("Entity not found");
      }
      if (entity.projectId !== args.projectId) {
        throw new Error("Entity does not belong to this project");
      }
    }

    if (args.stakeholderId) {
      const entity = await ctx.db.get("graph_entities", args.stakeholderId);
      if (!entity) {
        throw new Error("Stakeholder entity not found");
      }
      if (entity.projectId !== args.projectId) {
        throw new Error("Stakeholder entity does not belong to this project");
      }
      if (entity.entityType !== "stakeholder") {
        throw new Error(
          "Entity ID must reference a stakeholder entity for stakeholderId",
        );
      }
    }

    if (args.locationId) {
      const entity = await ctx.db.get("graph_entities", args.locationId);
      if (!entity) {
        throw new Error("Location entity not found");
      }
      if (entity.projectId !== args.projectId) {
        throw new Error("Location entity does not belong to this project");
      }
      if (entity.entityType !== "location") {
        throw new Error(
          "Entity ID must reference a location entity for locationId",
        );
      }
    }

    // Validate evidence reference exists and get the evidence record
    let evidenceRecord: any = null;

    if (args.evidenceRef.toString().startsWith("documents")) {
      const docId = args.evidenceRef as Id<"documents">;
      evidenceRecord = await ctx.db.get("documents", docId);
      if (!evidenceRecord) {
        throw new Error("Document evidence not found");
      }
      if (evidenceRecord.projectId !== args.projectId) {
        throw new Error("Document evidence must belong to the same project");
      }
      // Validate evidenceType matches source
      if (
        args.evidenceType !== "verified_fact" &&
        args.evidenceType !== "reported_concern"
      ) {
        throw new Error(
          "Document evidence must have evidenceType 'verified_fact' or 'reported_concern'",
        );
      }
    } else if (args.evidenceRef.toString().startsWith("citizen_feedback")) {
      const feedbackId = args.evidenceRef as Id<"citizen_feedback">;
      evidenceRecord = await ctx.db.get("citizen_feedback", feedbackId);
      if (!evidenceRecord) {
        throw new Error("Citizen feedback evidence not found");
      }
      if (evidenceRecord.projectId !== args.projectId) {
        throw new Error(
          "Citizen feedback evidence must belong to the same project",
        );
      }
      // Validate evidenceType matches source
      if (args.evidenceType !== "reported_concern") {
        throw new Error(
          "Citizen feedback evidence must have evidenceType 'reported_concern'",
        );
      }
    } else {
      const historicalId = args.evidenceRef as Id<"historical_evidence">;
      evidenceRecord = await ctx.db.get("historical_evidence", historicalId);
      if (!evidenceRecord) {
        throw new Error("Historical evidence not found");
      }
      // Historical evidence alone cannot establish a verified current-project risk
      // It may be used as supporting evidence for an already established risk
      if (
        args.evidenceType === "verified_fact" ||
        args.evidenceType === "reported_concern"
      ) {
        throw new Error(
          "Historical evidence cannot establish a verified current-project risk. Use PATTERN_INFERRED or HISTORICAL_ANALOG for historical evidence.",
        );
      }
    }

    // Calculate inherent risk score - factors are validated independently
    // If any required factor is missing, inherentRiskScore will be null (INSUFFICIENT_DATA)
    const likelihood = args.likelihood as Likelihood | undefined;
    const impact = args.impact as Impact | undefined;
    const exposure = args.exposure as Exposure | undefined;

    let inherentRiskScore: number | null;
    let riskLevel: RiskLevel | "INSUFFICIENT_DATA" = "low";

    // Validate each factor independently - if any is missing, mark as INSUFFICIENT_DATA
    if (
      likelihood === undefined ||
      impact === undefined ||
      exposure === undefined
    ) {
      // Missing data - risk score cannot be calculated
      inherentRiskScore = null;
      riskLevel = "INSUFFICIENT_DATA" as RiskLevel;
    } else {
      // All factors present - calculate score
      inherentRiskScore = computeInherentRiskScore(
        likelihood,
        impact,
        exposure,
      );
      riskLevel = getRiskLevelFromScore(inherentRiskScore);
    }

    const now = Date.now();

    const riskId = await ctx.db.insert("risks", {
      projectId: args.projectId,
      entityId: args.entityId,
      stakeholderId: args.stakeholderId,
      locationId: args.locationId,
      title: args.title,
      description: args.description,
      category: args.category,
      likelihood,
      impact,
      exposure,
      inherentRiskScore,
      residualRiskScore: undefined,
      riskLevel,
      status: "PENDING_REVIEW",
      auditTrail: [
        {
          action: "identified",
          performedBy: currentUser.authId,
          performedAt: now,
        },
      ],
      createdBy: currentUser.authId,
      createdAt: now,
      updatedAt: now,
    });

    // Create evidence_items record as part of the same transaction
    // Derive evidence strength and verification status from source record, NOT caller-supplied
    // Document processing completion does NOT equal factual verification - requires explicit verification
    let evidenceStrength: "verified" | "unverified" = "unverified";
    let verificationStatus: "verified" | "unverified" = "unverified";

    if (args.evidenceRef.toString().startsWith("documents")) {
      // Check for explicit verification, not processing status
      if (evidenceRecord?.verificationStatus === "verified") {
        evidenceStrength = "verified";
        verificationStatus = "verified";
      }
    } else if (args.evidenceRef.toString().startsWith("citizen_feedback")) {
      // Check for explicit verification, not human review status
      if (evidenceRecord?.verificationStatus === "verified") {
        evidenceStrength = "verified";
        verificationStatus = "verified";
      }
    } else {
      // Historical evidence is always unverified for current-project facts
      evidenceStrength = "unverified";
      verificationStatus = "unverified";
    }

    // Derive sourceEvidenceType from the actual evidence source, not caller-supplied
    const derivedSourceEvidenceType = args.evidenceRef
      .toString()
      .startsWith("documents")
      ? "verified_fact"
      : args.evidenceRef.toString().startsWith("citizen_feedback")
        ? "reported_concern"
        : "unverified_hypothesis";

    await ctx.db.insert("evidence_items", {
      riskId,
      evidenceType: args.evidenceRef.toString().startsWith("documents")
        ? "DOCUMENTED"
        : args.evidenceRef.toString().startsWith("citizen_feedback")
          ? "CITIZEN_VOICE"
          : "HISTORICAL_ANALOG",
      evidenceRef: args.evidenceRef,
      // Use derived sourceEvidenceType, not caller-supplied
      sourceEvidenceType: derivedSourceEvidenceType,
      relevance: "primary",
      evidenceStrength,
      verificationStatus,
      sourcePassage: args.sourcePassage,
      addedBy: currentUser.authId,
      addedAt: now,
    });

    return { riskId, riskLevel, inherentRiskScore };
  },
});

export const getRisksForProject = query({
  args: {
    projectId: v.id("projects"),
    category: v.optional(
      v.union(
        v.literal("environmental"),
        v.literal("social"),
        v.literal("technical"),
        v.literal("financial"),
        v.literal("legal"),
      ),
    ),
    status: v.optional(
      v.union(
        v.literal("PENDING_REVIEW"),
        v.literal("ACCEPTED"),
        v.literal("REJECTED"),
        v.literal("UNRESOLVED"),
      ),
    ),
    riskLevel: v.optional(
      v.union(
        v.literal("low"),
        v.literal("medium"),
        v.literal("high"),
        v.literal("critical"),
        v.literal("INSUFFICIENT_DATA"),
      ),
    ),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkUserProjectRole(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    let risks = await ctx.db
      .query("risks")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    if (args.category) {
      risks = risks.filter((r: any) => r.category === args.category);
    }

    if (args.status) {
      risks = risks.filter((r: any) => r.status === args.status);
    }

    if (args.riskLevel) {
      risks = risks.filter((r: any) => r.riskLevel === args.riskLevel);
    }

    return risks;
  },
});

export const getRiskWithEvidence = query({
  args: {
    riskId: v.id("risks"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const evidenceItems = await ctx.db
      .query("evidence_items")
      .withIndex("by_risk", (q: any) => q.eq("riskId", args.riskId))
      .collect();

    const evidenceWithSources = await Promise.all(
      evidenceItems.map(async (ev: any) => {
        let evidence = null;
        let sourceRecord = null;
        if (ev.evidenceRef) {
          evidence = await ctx.db.get(ev.evidenceRef as any);
          sourceRecord = evidence;
        }
        return {
          ...ev,
          evidence: sourceRecord,
        };
      }),
    );

    return {
      risk,
      evidence: evidenceWithSources,
      likelihood: risk.likelihood,
      impact: risk.impact,
      exposure: risk.exposure,
      inherentRiskScore: risk.inherentRiskScore,
      residualRiskScore: risk.residualRiskScore,
      scaleLabels: {
        likelihood: risk.likelihood
          ? LIKELIHOOD_LABELS[risk.likelihood as Likelihood]
          : "Not Specified",
        impact: risk.impact
          ? IMPACT_LABELS[risk.impact as Impact]
          : "Not Specified",
        exposure: risk.exposure
          ? EXPOSURE_LABELS[risk.exposure as Exposure]
          : "Not Specified",
        riskLevel: RISK_LEVEL_LABELS[risk.riskLevel as RiskLevel],
      },
    };
  },
});

export const getPrioritizedRisks = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkUserProjectRole(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const risks = await ctx.db
      .query("risks")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    // Separate scored risks from unscored (INSUFFICIENT_DATA) risks
    const scoredRisks: any[] = [];
    const unscoredRisks: any[] = [];
    const seenIds = new Set<string>();

    for (const risk of risks) {
      // A risk is unscored if inherentRiskScore is null (INSUFFICIENT_DATA)
      if (risk.inherentRiskScore === null) {
        unscoredRisks.push(risk);
      } else {
        scoredRisks.push(risk);
      }
      seenIds.add(risk._id);
    }

    // Sort scored risks by inherent risk score (descending)
    scoredRisks.sort(
      (a: any, b: any) =>
        (b.inherentRiskScore ?? 0) - (a.inherentRiskScore ?? 0),
    );

    // Combine: scored risks first (sorted), then unscored risks (sorted by title for determinism)
    unscoredRisks.sort((a: any, b: any) =>
      (a.title || "").localeCompare(b.title || ""),
    );

    const result = [...scoredRisks, ...unscoredRisks];

    return {
      risks: result,
      totalRisks: risks.length,
      scoredRiskCount: scoredRisks.length,
      unscoredRiskCount: unscoredRisks.length,
      hasUnscoredRisks: unscoredRisks.length > 0,
    };
  },
});

export const getRiskImpactTrace = query({
  args: {
    projectId: v.id("projects"),
    riskId: v.id("risks"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkUserProjectRole(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");
    if (risk.projectId !== args.projectId) {
      throw new Error("Risk does not belong to this project");
    }

    const [entity, stakeholder, location] = await Promise.all([
      risk.entityId ? ctx.db.get("graph_entities", risk.entityId) : null,
      risk.stakeholderId
        ? ctx.db.get("graph_entities", risk.stakeholderId)
        : null,
      risk.locationId ? ctx.db.get("graph_entities", risk.locationId) : null,
    ]);

    const evidenceItems = await ctx.db
      .query("evidence_items")
      .withIndex("by_risk", (q: any) => q.eq("riskId", args.riskId))
      .collect();

    const evidenceWithSources = await Promise.all(
      evidenceItems.map(async (ev: any) => {
        let evidence: any = null;
        if (ev.evidenceRef) {
          evidence = await ctx.db.get(ev.evidenceRef as any);
        }
        return { ...ev, evidence };
      }),
    );

    return {
      risk,
      entity,
      stakeholder,
      location,
      evidence: evidenceWithSources,
      likelihood: risk.likelihood,
      impact: risk.impact,
      exposure: risk.exposure,
      inherentRiskScore: risk.inherentRiskScore,
      residualRiskScore: risk.residualRiskScore,
    };
  },
});

export const updateRiskStatus = mutation({
  args: {
    riskId: v.id("risks"),
    status: v.union(
      v.literal("PENDING_REVIEW"),
      v.literal("ACCEPTED"),
      v.literal("REJECTED"),
      v.literal("UNRESOLVED"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot update risk status");
    }

    const validTransitions: Record<string, string[]> = {
      PENDING_REVIEW: ["ACCEPTED", "REJECTED", "UNRESOLVED"],
      ACCEPTED: ["UNRESOLVED"],
      REJECTED: ["UNRESOLVED", "PENDING_REVIEW"],
      UNRESOLVED: ["PENDING_REVIEW", "ACCEPTED", "REJECTED"],
    };

    if (risk.status !== args.status) {
      const allowedFromCurrent = validTransitions[risk.status] || [];
      if (!allowedFromCurrent.includes(args.status)) {
        throw new Error(
          `Invalid status transition from ${risk.status} to ${args.status}`,
        );
      }
    }

    // Derive audit action internally - the operation is always "status_updated"
    const now = Date.now();

    const updates: Record<string, any> = {
      status: args.status,
      updatedAt: now,
      auditTrail: [
        ...risk.auditTrail,
        {
          action: "status_updated",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    };

    await ctx.db.patch(args.riskId, updates);

    return { success: true };
  },
});

export const requestAdditionalEvidence = mutation({
  args: {
    riskId: v.id("risks"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error(
        "Unauthorized: Viewer cannot request additional evidence",
      );
    }

    const now = Date.now();

    await ctx.db.patch(args.riskId, {
      status: "PENDING_REVIEW",
      updatedAt: now,
      auditTrail: [
        ...risk.auditTrail,
        {
          action: "additional_evidence_requested",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return { success: true };
  },
});

export const addEvidence = mutation({
  args: {
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
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot add evidence");
    }

    let evidenceRecord: any = null;
    let derivedEvidenceStrength: "verified" | "unverified" = "unverified";
    let derivedVerificationStatus: "verified" | "unverified" = "unverified";

    if (args.evidenceRef.toString().startsWith("documents")) {
      const docId = args.evidenceRef as Id<"documents">;
      evidenceRecord = await ctx.db.get("documents", docId);
      if (!evidenceRecord) {
        throw new Error("Document evidence not found");
      }
      if (evidenceRecord.projectId !== risk.projectId) {
        throw new Error("Document does not belong to this project");
      }
      // Derive verification status from EXPLICIT verification record, not processing status
      // Document processing completion does NOT equal factual verification
      // Existence of record in evidence_verifications = verified; absence = unverified
      const verificationRecord = await ctx.db
        .query("evidence_verifications")
        .withIndex("by_evidence", (q: any) => q.eq("evidenceRef", docId))
        .first();
      if (verificationRecord) {
        derivedEvidenceStrength = "verified";
        derivedVerificationStatus = "verified";
      }
    } else if (args.evidenceRef.toString().startsWith("citizen_feedback")) {
      const feedbackId = args.evidenceRef as Id<"citizen_feedback">;
      evidenceRecord = await ctx.db.get("citizen_feedback", feedbackId);
      if (!evidenceRecord) {
        throw new Error("Citizen feedback evidence not found");
      }
      if (evidenceRecord.projectId !== risk.projectId) {
        throw new Error("Citizen feedback does not belong to this project");
      }
      // Derive verification status from EXPLICIT verification record, not human review status
      // Human review does NOT equal factual verification
      // Existence of record in evidence_verifications = verified; absence = unverified
      const verificationRecord = await ctx.db
        .query("evidence_verifications")
        .withIndex("by_evidence", (q: any) => q.eq("evidenceRef", feedbackId))
        .first();
      if (verificationRecord) {
        derivedEvidenceStrength = "verified";
        derivedVerificationStatus = "verified";
      }
    } else {
      const historicalId = args.evidenceRef as Id<"historical_evidence">;
      evidenceRecord = await ctx.db.get("historical_evidence", historicalId);
      if (!evidenceRecord) {
        throw new Error("Historical evidence not found");
      }
      // Historical evidence is always unverified - it cannot establish verified current-project facts
      derivedEvidenceStrength = "unverified";
      derivedVerificationStatus = "unverified";
    }

    // Historical evidence safeguards: historical evidence alone cannot establish
    // a verified current-project risk. Reject if caller tries to mark it as verified.
    if (
      args.evidenceType === "HISTORICAL_ANALOG" &&
      derivedVerificationStatus === "verified"
    ) {
      throw new Error(
        "Historical evidence cannot establish a verified current-project risk. Historical evidence is always unverified.",
      );
    }

    // Prevent caller from misrepresenting source evidence provenance
    let expectedEvidenceType: string;
    if (args.evidenceRef.toString().startsWith("documents")) {
      expectedEvidenceType = "DOCUMENTED";
    } else if (args.evidenceRef.toString().startsWith("citizen_feedback")) {
      expectedEvidenceType = "CITIZEN_VOICE";
    } else {
      expectedEvidenceType = "HISTORICAL_ANALOG";
    }
    if (args.evidenceType !== expectedEvidenceType) {
      throw new Error(
        `evidenceType (${args.evidenceType}) does not match evidenceRef source type (${expectedEvidenceType}). Evidence provenance cannot be misrepresented.`,
      );
    }

    // Derive sourceEvidenceType from the actual evidence source, not caller-supplied
    const derivedSourceEvidenceType = args.evidenceRef
      .toString()
      .startsWith("documents")
      ? "verified_fact"
      : args.evidenceRef.toString().startsWith("citizen_feedback")
        ? "reported_concern"
        : "unverified_hypothesis";

    const now = Date.now();

    const evidenceItemId = await ctx.db.insert("evidence_items", {
      riskId: args.riskId,
      evidenceType: args.evidenceType,
      evidenceRef: args.evidenceRef,
      // Use derived sourceEvidenceType, not caller-supplied (prevent falsification)
      sourceEvidenceType: derivedSourceEvidenceType,
      relevance: args.relevance,
      // Use derived values, not caller-supplied (prevent caller from falsifying verification)
      evidenceStrength: derivedEvidenceStrength,
      verificationStatus: derivedVerificationStatus,
      sourcePassage: args.sourcePassage,
      addedBy: currentUser.authId,
      addedAt: now,
    });

    return { evidenceItemId, success: true };
  },
});

export const suggestMitigations = query({
  args: {
    riskId: v.id("risks"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const candidates = await ctx.db
      .query("mitigations")
      .withIndex("by_category", (q: any) => q.eq("category", risk.category))
      .collect();

    // Filter to prevent cross-project template leakage:
    // - If template has projectId, it must match the risk's projectId
    // - If template has no projectId (global template), it's available to all projects
    const filteredCandidates = candidates.filter((m: any) => {
      if (m.projectId === undefined || m.projectId === null) return true;
      return m.projectId === risk.projectId;
    });

    const results = [];

    for (const mitigation of filteredCandidates) {
      results.push({
        _id: mitigation._id,
        riskId: args.riskId,
        description: mitigation.description,
        category: mitigation.category,
        infrastructureType: mitigation.infrastructureType,
        standard: mitigation.standard,
        references: mitigation.references,
        recommendationReason: `Mitigation for category "${risk.category}" with ${mitigation.infrastructureType ?? "general"} applicability`,
      });
    }

    return results;
  },
});

export const createMitigationCandidate = mutation({
  args: {
    riskId: v.id("risks"),
    mitigationId: v.id("mitigations"),
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
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error(
        "Unauthorized: Viewer cannot create mitigation candidate",
      );
    }

    const templateMitigation = await ctx.db.get(
      "mitigations",
      args.mitigationId,
    );
    if (!templateMitigation) throw new Error("Mitigation template not found");

    // Validate mitigation template belongs to the same project (or is global)
    if (
      templateMitigation.projectId &&
      templateMitigation.projectId !== risk.projectId
    ) {
      throw new Error(
        "Mitigation template belongs to a different project. Cross-project template usage is not allowed.",
      );
    }

    // Validate supporting evidence if provided
    if (args.supportingEvidenceRef) {
      let evidenceRecord: any = null;
      if (args.supportingEvidenceRef.toString().startsWith("documents")) {
        const docId = args.supportingEvidenceRef as Id<"documents">;
        evidenceRecord = await ctx.db.get("documents", docId);
        if (!evidenceRecord) {
          throw new Error("Document evidence not found");
        }
        if (evidenceRecord.projectId !== risk.projectId) {
          throw new Error("Document does not belong to this project");
        }
      } else if (
        args.supportingEvidenceRef.toString().startsWith("citizen_feedback")
      ) {
        const feedbackId = args.supportingEvidenceRef as Id<"citizen_feedback">;
        evidenceRecord = await ctx.db.get("citizen_feedback", feedbackId);
        if (!evidenceRecord) {
          throw new Error("Citizen feedback evidence not found");
        }
        if (evidenceRecord.projectId !== risk.projectId) {
          throw new Error("Citizen feedback does not belong to this project");
        }
      } else {
        const historicalId =
          args.supportingEvidenceRef as Id<"historical_evidence">;
        evidenceRecord = await ctx.db.get("historical_evidence", historicalId);
        if (!evidenceRecord) {
          throw new Error("Historical evidence not found");
        }
      }
    }

    const now = Date.now();

    // Check for actual project mitigation coverage
    // missingCoverage = true if project has NO implemented/approved mitigation
    // for this risk's category
    // Coverage is determined by checking if any risk_mitigation record for this risk
    // references a mitigation template with the same category as the risk
    const existingMitigations = await ctx.db
      .query("risk_mitigations")
      .withIndex("by_risk", (q: any) => q.eq("riskId", args.riskId))
      .collect();

    // Check if any existing mitigation references a template with matching category
    let hasImplementedMitigation = false;
    let hasApprovedMitigation = false;

    for (const m of existingMitigations) {
      if (!m.existingMitigationRef) continue;

      const template = await ctx.db.get("mitigations", m.existingMitigationRef);
      if (!template) continue;

      if (template?.category === risk.category) {
        if (m.status === "implemented") {
          hasImplementedMitigation = true;
        } else if (m.status === "approved") {
          hasApprovedMitigation = true;
        }
      }
    }

    const missingCoverage = !hasImplementedMitigation && !hasApprovedMitigation;

    const candidateId = await ctx.db.insert("risk_mitigations", {
      riskId: args.riskId,
      description: templateMitigation.description,
      status: "proposed",
      supportingEvidenceType: args.supportingEvidenceType,
      supportingEvidenceRef: args.supportingEvidenceRef,
      supportingEvidencePassage: args.supportingEvidencePassage,
      existingMitigationRef: templateMitigation._id,
      missingCoverage,
      coverageReason: missingCoverage
        ? "No existing project mitigation for this category"
        : "Existing project mitigation covers this category",
      recommendationReason:
        templateMitigation.references?.join(", ") || "Standard mitigation",
      effectivenessLevel: "NOT_ASSESSED",
      createdBy: currentUser.authId,
      createdAt: now,
      updatedAt: now,
      reviewHistory: [
        {
          action: "proposed",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return { candidateId };
  },
});

export const getMitigationsForRisk = query({
  args: {
    riskId: v.id("risks"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const mitigations = await ctx.db
      .query("risk_mitigations")
      .withIndex("by_risk", (q: any) => q.eq("riskId", args.riskId))
      .collect();

    return mitigations;
  },
});

export const approveMitigation = mutation({
  args: {
    mitigationId: v.id("risk_mitigations"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const mitigation = await ctx.db.get("risk_mitigations", args.mitigationId);
    if (!mitigation) throw new Error("Mitigation not found");

    const risk = await ctx.db.get("risks", mitigation.riskId);
    if (!risk) throw new Error("Associated risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot approve mitigation");
    }

    // Approval does NOT imply implementation
    if (mitigation.status !== "proposed") {
      throw new Error("Can only approve a proposed mitigation");
    }

    const now = Date.now();

    await ctx.db.patch(args.mitigationId, {
      status: "approved",
      updatedAt: now,
      reviewHistory: [
        ...mitigation.reviewHistory,
        {
          action: "approved",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return { success: true };
  },
});

export const rejectMitigation = mutation({
  args: {
    mitigationId: v.id("risk_mitigations"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const mitigation = await ctx.db.get("risk_mitigations", args.mitigationId);
    if (!mitigation) throw new Error("Mitigation not found");

    const risk = await ctx.db.get("risks", mitigation.riskId);
    if (!risk) throw new Error("Associated risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot reject mitigation");
    }

    const now = Date.now();

    await ctx.db.patch(args.mitigationId, {
      status: "rejected",
      updatedAt: now,
      reviewHistory: [
        ...mitigation.reviewHistory,
        {
          action: "rejected",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return { success: true };
  },
});

export const implementMitigation = mutation({
  args: {
    mitigationId: v.id("risk_mitigations"),
    implementationEvidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const mitigation = await ctx.db.get("risk_mitigations", args.mitigationId);
    if (!mitigation) throw new Error("Mitigation not found");

    const risk = await ctx.db.get("risks", mitigation.riskId);
    if (!risk) throw new Error("Associated risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot implement mitigation");
    }

    // Must be approved before implementation
    if (mitigation.status !== "approved") {
      throw new Error("Can only implement an approved mitigation");
    }

    // Validate implementation evidence
    let evidenceRecord: any = null;
    if (args.implementationEvidenceRef.toString().startsWith("documents")) {
      const docId = args.implementationEvidenceRef as Id<"documents">;
      evidenceRecord = await ctx.db.get("documents", docId);
      if (!evidenceRecord) {
        throw new Error("Document evidence not found");
      }
      if (evidenceRecord.projectId !== risk.projectId) {
        throw new Error(
          "Implementation evidence must belong to the same project",
        );
      }
    } else {
      const feedbackId =
        args.implementationEvidenceRef as Id<"citizen_feedback">;
      evidenceRecord = await ctx.db.get("citizen_feedback", feedbackId);
      if (!evidenceRecord) {
        throw new Error("Citizen feedback evidence not found");
      }
      if (evidenceRecord.projectId !== risk.projectId) {
        throw new Error(
          "Implementation evidence must belong to the same project",
        );
      }
    }

    const now = Date.now();

    await ctx.db.patch(args.mitigationId, {
      status: "implemented",
      implementationEvidenceRef: args.implementationEvidenceRef,
      updatedAt: now,
      reviewHistory: [
        ...mitigation.reviewHistory,
        {
          action: "implemented",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return { success: true };
  },
});

export const verifyMitigationEffectiveness = mutation({
  args: {
    mitigationId: v.id("risk_mitigations"),
    effectivenessPercent: v.number(),
    effectivenessEvidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
    ),
    notes: v.optional(v.string()),
    // Optional assessment basis - when not provided, percentage is human-estimated
    // When provided, MUST independently validate supportingEvidenceRef
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
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    if (args.effectivenessPercent < 0 || args.effectivenessPercent > 100) {
      throw new Error("Effectiveness percentage must be between 0 and 100");
    }

    const mitigation = await ctx.db.get("risk_mitigations", args.mitigationId);
    if (!mitigation) throw new Error("Mitigation not found");

    const risk = await ctx.db.get("risks", mitigation.riskId);
    if (!risk) throw new Error("Associated risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot verify effectiveness");
    }

    // Must be implemented before effectiveness assessment
    if (mitigation.status !== "implemented") {
      throw new Error(
        "Can only verify effectiveness for an implemented mitigation",
      );
    }

    // Must not be already assessed
    if (mitigation.effectivenessLevel === "ASSESSED") {
      throw new Error("Effectiveness already assessed for this mitigation");
    }

    // Validate effectiveness evidence independently
    const effectivenessEvidence = await ctx.db.get(
      args.effectivenessEvidenceRef,
    );
    if (!effectivenessEvidence) {
      throw new Error("Effectiveness evidence not found");
    }
    if (effectivenessEvidence.projectId !== risk.projectId) {
      throw new Error("Effectiveness evidence must belong to the same project");
    }

    // Validate assessmentBasis fields if provided (validate evidence references, not percentages)
    // Per remediation: caller-supplied percentage plus evidence ref must NOT produce ASSESSED
    // There is no defensible quantitative validation method yet - preserve PROVISIONAL
    let assessmentBasisValidated = false;

    if (args.assessmentBasis) {
      // Validate all required assessment basis fields
      const hasAllFields =
        args.assessmentBasis.methodology &&
        args.assessmentBasis.outcomeMetric &&
        args.assessmentBasis.measurementPeriod &&
        args.assessmentBasis.rationale;

      if (hasAllFields) {
        // Independently validate supportingEvidenceRef within assessmentBasis
        const supportingEvidence = await ctx.db.get(
          args.assessmentBasis.supportingEvidenceRef,
        );
        if (supportingEvidence) {
          if (supportingEvidence.projectId === risk.projectId) {
            assessmentBasisValidated = true;
          } else {
            throw new Error(
              "Assessment basis supporting evidence must belong to the same project",
            );
          }
        } else {
          throw new Error("Assessment basis supporting evidence not found");
        }
      }
    }

    const now = Date.now();
    const effectivePercent = Math.min(
      100,
      Math.max(0, args.effectivenessPercent),
    );

    // Effectiveness level determination:
    // Per remediation: caller-supplied percentage does NOT constitute quantitative effectiveness.
    // Without a defensible quantitative validation method, must preserve PROVISIONAL.
    // This prevents overstating verification when only percentage + evidence ref are supplied.
    const effectivenessLevel = "PROVISIONAL";

    await ctx.db.patch(args.mitigationId, {
      effectivenessLevel,
      verifiedEffectivePercent: effectivePercent,
      effectivenessEvidenceRef: args.effectivenessEvidenceRef,
      assessmentBasis: assessmentBasisValidated
        ? args.assessmentBasis
        : undefined,
      updatedAt: now,
      reviewHistory: [
        ...mitigation.reviewHistory,
        {
          action: "effectiveness_verified",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: args.notes,
        },
      ],
    });

    return {
      success: true,
      verifiedEffectivePercent: effectivePercent,
      effectivenessLevel,
      assessmentNote:
        "Effectiveness is a human-estimated assessment. Without a defensible quantitative validation method, effectiveness remains PROVISIONAL. Evidence references are validated (existence, same-project) but do not constitute quantitative effectiveness.",
    };
  },
});

export const assessResidualRisk = mutation({
  args: {
    riskId: v.id("risks"),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const risk = await ctx.db.get("risks", args.riskId);
    if (!risk) throw new Error("Risk not found");

    const accessLevel = await checkUserProjectRole(
      ctx,
      risk.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    if (accessLevel === "viewer") {
      throw new Error("Unauthorized: Viewer cannot assess residual risk");
    }

    // Get all mitigations for this risk
    const mitigations = await ctx.db
      .query("risk_mitigations")
      .withIndex("by_risk", (q: any) => q.eq("riskId", args.riskId))
      .collect();

    // Filter to eligible mitigations: implemented with ASSESSED effectiveness
    const eligibleMitigations = mitigations.filter(
      (m: any) =>
        m.status === "implemented" && m.effectivenessLevel === "ASSESSED",
    );

    const now = Date.now();
    let residualRiskAssessment: "NOT_ASSESSED" | "PROVISIONAL" | "ASSESSED" =
      "NOT_ASSESSED";
    let residualRiskScore: number | undefined;
    let residualRiskEvidenceRefs: string[] = [];
    let assessmentNotes = args.notes ?? "";

    if (eligibleMitigations.length === 0) {
      // No eligible mitigations with assessed effectiveness
      residualRiskAssessment = "NOT_ASSESSED";
      assessmentNotes +=
        " No implemented mitigations with ASSESSED effectiveness found. Residual risk not calculated.";
    } else if (risk.inherentRiskScore === null) {
      // Cannot calculate residual risk without inherent risk score (INSUFFICIENT_DATA)
      residualRiskAssessment = "NOT_ASSESSED";
      assessmentNotes +=
        " Cannot calculate residual risk: inherent risk score is INSUFFICIENT_DATA (missing risk factors).";
    } else if (eligibleMitigations.length === 1) {
      // Single eligible mitigation - can calculate residual risk
      const mitigation = eligibleMitigations[0];
      if (mitigation.verifiedEffectivePercent !== undefined) {
        residualRiskScore = Math.round(
          risk.inherentRiskScore *
            (1 - mitigation.verifiedEffectivePercent / 100),
        );
        residualRiskAssessment = "ASSESSED";
        // effectivenessEvidenceRef and implementationEvidenceRef are set when effectivenessLevel is ASSESSED
        residualRiskEvidenceRefs = [
          mitigation.effectivenessEvidenceRef,
          mitigation.implementationEvidenceRef,
        ].filter((v): v is string => typeof v === "string");
        assessmentNotes += ` Residual risk calculated from single assessed mitigation (${mitigation.verifiedEffectivePercent}% effective).`;
      } else {
        residualRiskAssessment = "PROVISIONAL";
        assessmentNotes +=
          " Single implemented mitigation lacks verified effectiveness percentage.";
      }
    } else {
      // Multiple eligible mitigations - no defensible combination formula
      residualRiskAssessment = "PROVISIONAL";
      residualRiskEvidenceRefs = eligibleMitigations
        .flatMap((m: any) => [
          m.effectivenessEvidenceRef,
          m.implementationEvidenceRef,
        ])
        .filter((v: unknown): v is string => typeof v === "string");
      assessmentNotes += ` ${eligibleMitigations.length} implemented mitigations with ASSESSED effectiveness found, but no defensible methodology exists for combining multiple mitigations. Residual risk not calculated.`;
    }

    // Build eligible mitigation snapshots for audit trail
    const mitigationSnapshots = eligibleMitigations.map((m: any) => ({
      mitigationId: m._id,
      verifiedEffectivePercent: m.verifiedEffectivePercent,
      effectivenessEvidenceRef: m.effectivenessEvidenceRef,
      implementationEvidenceRef: m.implementationEvidenceRef,
    }));

    // Append assessment to history table for audit trail with full mitigation context
    // Note: inherentRiskScore can be null (INSUFFICIENT_DATA) - preserve this for audit purposes
    const assessmentHistoryId = await ctx.db.insert(
      "residual_risk_assessments",
      {
        riskId: args.riskId,
        assessmentState: residualRiskAssessment,
        residualRiskScore,
        inherentRiskScore: risk.inherentRiskScore,
        eligibleMitigationIds: eligibleMitigations.map((m: any) => m._id),
        mitigationEffectivenessSnapshots:
          mitigationSnapshots.length > 0 ? mitigationSnapshots : undefined,
        evidenceRefs:
          residualRiskEvidenceRefs.length > 0
            ? residualRiskEvidenceRefs
            : undefined,
        assessmentNotes: assessmentNotes || undefined,
        assessedBy: currentUser.authId,
        assessedAt: now,
      },
    );

    const updates: Record<string, any> = {
      residualRiskAssessment,
      residualRiskScore,
      residualRiskEvidenceRefs:
        residualRiskEvidenceRefs.length > 0
          ? residualRiskEvidenceRefs
          : undefined,
      residualRiskAssessmentNotes: assessmentNotes || undefined,
      updatedAt: now,
      auditTrail: [
        ...risk.auditTrail,
        {
          action: "residual_risk_assessed",
          performedBy: currentUser.authId,
          performedAt: now,
          notes: assessmentNotes,
          previousValue: risk.residualRiskScore?.toString(),
          newValue: residualRiskScore?.toString(),
        },
      ],
    };

    await ctx.db.patch(args.riskId, updates);

    return {
      success: true,
      residualRiskAssessment,
      residualRiskScore,
      residualRiskEvidenceRefs,
      assessmentNotes,
      assessmentHistoryId,
    };
  },
});
