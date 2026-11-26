import { v } from "convex/values";
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

async function checkProjectAccess(
  ctx: unknown,
  projectId: string,
  currentUser: AppUser,
): Promise<"owner" | "member" | "none"> {
  const db = (ctx as any).db;

  const project = await db.get(projectId);
  if (!project) throw new Error("Project not found");

  if (project.ownerId === currentUser.authId) return "owner";

  const membership = (await db
    .query("project_members")
    .withIndex("project_user", (q: any) =>
      q.eq("projectId", projectId).eq("userId", currentUser.authId),
    )
    .first()) as any;

  return membership ? "member" : "none";
}

// Helper to validate confidence is in range [0, 1]
function validateConfidence(confidence: number | undefined): boolean {
  if (confidence === undefined) return true;
  return confidence >= 0 && confidence <= 1;
}

export const createEntity = mutation({
  args: {
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
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const now = Date.now();

    const entityId = ctx.db.insert("graph_entities", {
      projectId: args.projectId,
      entityType: args.entityType,
      name: args.name,
      description: args.description,
      createdAt: now,
      createdBy: currentUser.authId,
    });

    return { entityId };
  },
});

export const createRelationship = mutation({
  args: {
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
    // Evidence references
    documentId: v.optional(v.id("documents")),
    feedbackId: v.optional(v.id("citizen_feedback")),
    evidenceId: v.optional(v.id("historical_evidence")),
    sourcePassage: v.optional(v.string()),
    evidenceType: v.union(
      v.literal("verified_fact"),
      v.literal("reported_concern"),
      v.literal("inferred_relationship"),
      v.literal("unverified_hypothesis"),
    ),
    confidence: v.optional(v.number()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Validate confidence is in valid range
    if (!validateConfidence(args.confidence)) {
      throw new Error("Confidence must be between 0 and 1");
    }

    if (args.sourceType === "entity") {
      const sourceEntity = await ctx.db.get("graph_entities", args.sourceId);
      if (!sourceEntity) {
        throw new Error("Source entity not found");
      }
      if (sourceEntity.projectId !== args.projectId) {
        throw new Error("Source entity does not belong to this project");
      }
    } else if (args.sourceType === "project") {
      const sourceProject = await ctx.db.get("projects", args.sourceId);
      if (!sourceProject) {
        throw new Error("Source project not found");
      }
      if (sourceProject.ownerId !== currentUser.authId) {
        throw new Error("Source project not owned by this user");
      }
    } else if (args.sourceType === "historical_case") {
      const sourceHistorical = await ctx.db.get(
        "historical_evidence",
        args.sourceId,
      );
      if (!sourceHistorical) {
        throw new Error("Source historical evidence not found");
      }
    }

    // Validate targetId matches targetType
    if (args.targetType === "entity") {
      const targetEntity = await ctx.db.get("graph_entities", args.targetId);
      if (!targetEntity) {
        throw new Error("Target entity not found");
      }
      if (targetEntity.projectId !== args.projectId) {
        throw new Error("Target entity does not belong to this project");
      }
    } else if (args.targetType === "project") {
      const targetProject = await ctx.db.get("projects", args.targetId);
      if (!targetProject) {
        throw new Error("Target project not found");
      }
      if (targetProject.ownerId !== currentUser.authId) {
        throw new Error("Target project not owned by this user");
      }
    } else if (args.targetType === "historical_case") {
      const targetHistorical = await ctx.db.get(
        "historical_evidence",
        args.targetId,
      );
      if (!targetHistorical) {
        throw new Error("Target historical evidence not found");
      }
    }

    // Determine evidence reference (exactly one should be provided when present)
    const evidenceRef = args.documentId ?? args.feedbackId ?? args.evidenceId;

    // Validate evidence belongs to same project
    if (evidenceRef) {
      let evidence: any = null;
      if (args.documentId) {
        evidence = await ctx.db.get("documents", args.documentId);
        if (!evidence) throw new Error("Document evidence not found");
        if (evidence.projectId !== args.projectId) {
          throw new Error("Document does not belong to this project");
        }
      } else if (args.feedbackId) {
        evidence = await ctx.db.get("citizen_feedback", args.feedbackId);
        if (!evidence) throw new Error("Feedback evidence not found");
        if (evidence.projectId !== args.projectId) {
          throw new Error("Feedback does not belong to this project");
        }
      } else if (args.evidenceId) {
        evidence = await ctx.db.get("historical_evidence", args.evidenceId);
        if (!evidence) throw new Error("Historical evidence not found");
        // Historical evidence is global, not project-scoped
      }
    }

    const now = Date.now();

    const relationshipId = ctx.db.insert("graph_relationships", {
      projectId: args.projectId,
      sourceType: args.sourceType,
      sourceId: args.sourceId,
      targetType: args.targetType,
      targetId: args.targetId,
      relationshipType: args.relationshipType,
      evidenceRef: evidenceRef,
      sourcePassage: args.sourcePassage,
      evidenceType: args.evidenceType,
      confidence: args.confidence,
      createdBy: currentUser.authId,
      createdAt: now,
    });

    return { relationshipId };
  },
});

export const getEntity = query({
  args: { entityId: v.id("graph_entities") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const entity = await ctx.db.get(args.entityId);
    if (!entity) throw new Error("Entity not found");

    const accessLevel = await checkProjectAccess(
      ctx,
      entity.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    return entity;
  },
});

export const listProjectEntities = query({
  args: {
    projectId: v.id("projects"),
    entityType: v.optional(
      v.union(
        v.literal("activity"),
        v.literal("stakeholder"),
        v.literal("location"),
        v.literal("receptor"),
        v.literal("infrastructure_type"),
        v.literal("impact"),
        v.literal("mitigation"),
      ),
    ),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    let entities = await ctx.db
      .query("graph_entities")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    if (args.entityType) {
      entities = entities.filter((e: any) => e.entityType === args.entityType);
    }

    return entities;
  },
});

export const getEntityRelationships = query({
  args: {
    entityId: v.id("graph_entities"),
    includeEvidence: v.optional(v.boolean()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    // Get entity to check project access
    const entity = await ctx.db.get(args.entityId);
    if (!entity) throw new Error("Entity not found");

    const accessLevel = await checkProjectAccess(
      ctx,
      entity.projectId,
      currentUser,
    );
    if (accessLevel === "none")
      throw new Error("Unauthorized: Project access required");

    // Get relationships where entity is source
    const sourceRelationships = await ctx.db
      .query("graph_relationships")
      .withIndex("by_source", (q: any) => q.eq("sourceId", args.entityId))
      .collect();

    // Get relationships where entity is target
    const targetRelationships = await ctx.db
      .query("graph_relationships")
      .withIndex("by_target", (q: any) => q.eq("targetId", args.entityId))
      .collect();

    if (!args.includeEvidence) {
      return {
        outgoing: sourceRelationships,
        incoming: targetRelationships,
      };
    }

    // Fetch evidence for each relationship
    const outgoingWithEvidence = await Promise.all(
      sourceRelationships.map(async (rel: any) => {
        let evidence = null;
        if (rel.evidenceRef) {
          evidence = await ctx.db.get(rel.evidenceRef as any);
        }
        return { ...rel, evidence };
      }),
    );

    const incomingWithEvidence = await Promise.all(
      targetRelationships.map(async (rel: any) => {
        let evidence = null;
        if (rel.evidenceRef) {
          evidence = await ctx.db.get(rel.evidenceRef as any);
        }
        return { ...rel, evidence };
      }),
    );

    return {
      outgoing: outgoingWithEvidence,
      incoming: incomingWithEvidence,
    };
  },
});

export const getEvidenceForRelationship = query({
  args: { relationshipId: v.id("graph_relationships") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const relationship = await ctx.db.get(args.relationshipId);
    if (!relationship) throw new Error("Relationship not found");

    const accessLevel = await checkProjectAccess(
      ctx,
      relationship.projectId,
      currentUser,
    );
    if (accessLevel === "none")
      throw new Error("Unauthorized: Project access required");

    let evidence = null;
    if (relationship.evidenceRef) {
      evidence = await ctx.db.get(relationship.evidenceRef as any);
    }

    return {
      relationship,
      evidence,
      sourcePassage: relationship.sourcePassage,
      evidenceType: relationship.evidenceType,
      confidence: relationship.confidence,
    };
  },
});

export const findEntitiesByEvidence = query({
  args: {
    projectId: v.id("projects"),
    documentId: v.optional(v.id("documents")),
    feedbackId: v.optional(v.id("citizen_feedback")),
    evidenceId: v.optional(v.id("historical_evidence")),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const evidenceRef = args.documentId ?? args.feedbackId ?? args.evidenceId;
    if (!evidenceRef) return [];

    const relationships = await ctx.db
      .query("graph_relationships")
      .withIndex("by_evidence", (q: any) => q.eq("evidenceRef", evidenceRef))
      .collect();

    // Get all linked entities
    const entityIds = new Set<string>();
    for (const rel of relationships) {
      if (rel.sourceType === "entity") {
        entityIds.add(rel.sourceId);
      }
      if (rel.targetType === "entity") {
        entityIds.add(rel.targetId);
      }
    }

    const entities = [];
    for (const id of entityIds) {
      const entity = await ctx.db.get(id);
      if (entity) entities.push(entity);
    }

    return entities;
  },
});

export const getImpactTrace = query({
  args: {
    projectId: v.id("projects"),
    impactId: v.id("graph_entities"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Verify this is an impact entity
    const impact = await ctx.db.get(args.impactId);
    if (!impact) throw new Error("Impact not found");
    if (impact.entityType !== "impact")
      throw new Error("Entity is not an impact");
    if (impact.projectId !== args.projectId) {
      throw new Error("Impact does not belong to this project");
    }

    // Find AFFECTS or MAY_IMPACT relationships pointing to this impact
    const incoming = await ctx.db
      .query("graph_relationships")
      .withIndex("by_target", (q: any) => q.eq("targetId", args.impactId))
      .collect();

    const affecting = incoming.filter(
      (rel: any) =>
        rel.relationshipType === "AFFECTS" ||
        rel.relationshipType === "MAY_IMPACT",
    );

    // Get source entities
    const sources = [];
    for (const rel of affecting) {
      if (rel.sourceType === "entity") {
        const source = await ctx.db.get(rel.sourceId);
        if (source) {
          sources.push({
            entity: source,
            relationship: rel,
          });
        }
      }
    }

    // Get SUPPORTED_BY relationships for evidence
    const supporting = await ctx.db
      .query("graph_relationships")
      .withIndex("by_source", (q: any) => q.eq("sourceId", args.impactId))
      .collect();

    const evidenceBacking = supporting.filter(
      (rel: any) => rel.relationshipType === "SUPPORTED_BY",
    );

    const evidence = [];
    for (const rel of evidenceBacking) {
      let ev = null;
      if (rel.evidenceRef) {
        ev = await ctx.db.get(rel.evidenceRef as any);
      }
      evidence.push({ relationship: rel, evidence: ev });
    }

    return {
      impact,
      affectingEntities: sources,
      supportingEvidence: evidence,
    };
  },
});

// Get project relationships (HAS_ACTIVITY)
export const getProjectActivities = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Find HAS_ACTIVITY relationships where project is source
    const relationships = await ctx.db
      .query("graph_relationships")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    const activities = relationships
      .filter((rel: any) => rel.relationshipType === "HAS_ACTIVITY")
      .filter((rel: any) => rel.sourceType === "project")
      .map((rel: any) => ({
        relationship: rel,
        activity: rel.targetType === "entity" ? ctx.db.get(rel.targetId) : null,
      }));

    return { relationships: activities };
  },
});

// Get historical cases related to a project
export const getHistoricalCases = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Find RELATED_TO relationships where project is source and target is historical_case
    const relationships = await ctx.db
      .query("graph_relationships")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    const historicalCases = relationships
      .filter((rel: any) => rel.relationshipType === "RELATED_TO")
      .filter((rel: any) => rel.targetType === "historical_case")
      .map((rel: any) => ({
        relationship: rel,
        historicalCase: ctx.db.get(rel.targetId),
      }));

    return { relationships: historicalCases };
  },
});

export const deleteEntity = mutation({
  args: { entityId: v.id("graph_entities") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const entity = await ctx.db.get(args.entityId);
    if (!entity) throw new Error("Entity not found");

    const accessLevel = await checkProjectAccess(
      ctx,
      entity.projectId,
      currentUser,
    );
    if (accessLevel !== "owner") {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Delete all relationships pointing to this entity
    const outgoing = await ctx.db
      .query("graph_relationships")
      .withIndex("by_source", (q: any) => q.eq("sourceId", args.entityId))
      .collect();

    for (const rel of outgoing) {
      await ctx.db.delete(rel._id);
    }

    const incoming = await ctx.db
      .query("graph_relationships")
      .withIndex("by_target", (q: any) => q.eq("targetId", args.entityId))
      .collect();

    for (const rel of incoming) {
      await ctx.db.delete(rel._id);
    }

    await ctx.db.delete(args.entityId);

    return { success: true };
  },
});

export const deleteRelationship = mutation({
  args: { relationshipId: v.id("graph_relationships") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const relationship = await ctx.db.get(args.relationshipId);
    if (!relationship) throw new Error("Relationship not found");

    const accessLevel = await checkProjectAccess(
      ctx,
      relationship.projectId,
      currentUser,
    );
    if (accessLevel !== "owner") {
      throw new Error("Unauthorized: Project owner access required");
    }

    await ctx.db.delete(args.relationshipId);

    return { success: true };
  },
});
