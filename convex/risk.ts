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

const _RISK_LEVEL_THRESHOLDS = {
  low: { max: 20 },
  medium: { min: 21, max: 60 },
  high: { min: 61, max: 80 },
  critical: { min: 81 },
} as const;

type RiskLevel = "low" | "medium" | "high" | "critical";

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
    likelihood: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ),
    impact: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
    ),
    exposure: v.union(
      v.literal(1),
      v.literal(2),
      v.literal(3),
      v.literal(4),
      v.literal(5),
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

    const likelihood = args.likelihood as Likelihood;
    const impact = args.impact as Impact;
    const exposure = args.exposure as Exposure;

    const inherentRiskScore = computeInherentRiskScore(
      likelihood,
      impact,
      exposure,
    );
    const riskLevel = getRiskLevelFromScore(inherentRiskScore);

    const now = Date.now();

    const riskId = ctx.db.insert("risks", {
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
        likelihood: LIKELIHOOD_LABELS[risk.likelihood as Likelihood],
        impact: IMPACT_LABELS[risk.impact as Impact],
        exposure: EXPOSURE_LABELS[risk.exposure as Exposure],
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

    const risksWithScore = risks.map((risk: any) => ({
      ...risk,
      inherentRiskScore: risk.inherentRiskScore,
    }));

    risksWithScore.sort(
      (a: any, b: any) => b.inherentRiskScore - a.inherentRiskScore,
    );

    return risksWithScore;
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
    action: v.string(),
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

    const now = Date.now();

    const updates: Record<string, any> = {
      status: args.status,
      updatedAt: now,
      auditTrail: [
        ...risk.auditTrail,
        {
          action: args.action,
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
    if (args.evidenceRef.toString().startsWith("documents")) {
      const docId = args.evidenceRef as Id<"documents">;
      evidenceRecord = await ctx.db.get("documents", docId);
      if (!evidenceRecord) {
        throw new Error("Document evidence not found");
      }
      if (evidenceRecord.projectId !== risk.projectId) {
        throw new Error("Document does not belong to this project");
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
    } else {
      const historicalId = args.evidenceRef as Id<"historical_evidence">;
      evidenceRecord = await ctx.db.get("historical_evidence", historicalId);
      if (!evidenceRecord) {
        throw new Error("Historical evidence not found");
      }
    }

    const now = Date.now();

    const evidenceItemId = ctx.db.insert("evidence_items", {
      riskId: args.riskId,
      evidenceType: args.evidenceType,
      evidenceRef: args.evidenceRef,
      sourceEvidenceType: args.sourceEvidenceType,
      relevance: args.relevance,
      evidenceStrength: args.evidenceStrength,
      verificationStatus: args.verificationStatus,
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

    const results = [];

    for (const mitigation of candidates) {
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

    const now = Date.now();

    const candidateId = ctx.db.insert("risk_mitigations", {
      riskId: args.riskId,
      description: templateMitigation.description,
      status: "proposed",
      supportingEvidenceType: "verified_fact",
      supportingEvidenceRef: undefined as any,
      supportingEvidencePassage: undefined,
      existingMitigationRef: templateMitigation._id,
      missingCoverage: !templateMitigation.projectId,
      coverageReason: templateMitigation.projectId
        ? "Existing mitigation covers this category"
        : "No existing project mitigation for this category",
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

export const verifyMitigationEffectiveness = mutation({
  args: {
    mitigationId: v.id("risk_mitigations"),
    effectivenessPercent: v.number(),
    effectivenessEvidenceRef: v.union(
      v.id("documents"),
      v.id("citizen_feedback"),
    ),
    notes: v.optional(v.string()),
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

    const now = Date.now();

    const effectivePercent = Math.min(
      100,
      Math.max(0, args.effectivenessPercent),
    );

    await ctx.db.patch(args.mitigationId, {
      status: "implemented",
      effectivenessLevel: "ASSESSED",
      verifiedEffectivePercent: effectivePercent,
      effectivenessEvidenceRef: args.effectivenessEvidenceRef,
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

    const effectivenessEvidence = await ctx.db.get(
      args.effectivenessEvidenceRef,
    );
    if (!effectivenessEvidence) {
      throw new Error("Effectiveness evidence not found");
    }
    if (effectivenessEvidence.projectId !== risk.projectId) {
      throw new Error("Effectiveness evidence does not belong to this project");
    }

    return { success: true, verifiedEffectivePercent: effectivePercent };
  },
});
