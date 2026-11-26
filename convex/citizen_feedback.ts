import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// Get current application user from Better Auth
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

  // Cast the user object to get proper type inference
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
  // registrationCompleted doesn't apply for feedback submitters, but checking for consistency
  return user;
}

// Check if user has access to a project (is owner or member)
async function checkProjectAccess(
  ctx: unknown,
  projectId: string,
  currentUser: AppUser,
): Promise<"owner" | "member" | "none"> {
  const db = (ctx as any).db;

  const project = await db.get(projectId);
  if (!project) throw new Error("Project not found");

  if (project.ownerId === currentUser.authId) return "owner";

  // Use any to avoid type inference issues with chained eq calls
  const membership = (await db
    .query("project_members")
    .withIndex("project_user", (q: any) =>
      q.eq("projectId", projectId).eq("userId", currentUser.authId),
    )
    .first()) as any;

  return membership ? "member" : "none";
}

// Submit citizen feedback for a project
export const submitFeedback = mutation({
  args: {
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

    // Validate content length
    const MAX_CONTENT_LENGTH = 10000; // 10k characters max
    if (args.content.length > MAX_CONTENT_LENGTH) {
      throw new Error(
        `Feedback content exceeds maximum length (${MAX_CONTENT_LENGTH} characters)`,
      );
    }

    const now = Date.now();

    const feedbackId = ctx.db.insert("citizen_feedback", {
      projectId: args.projectId,
      content: args.content, // Original text preserved exactly
      language: args.language,
      source: args.source,
      submittedBy: args.submittedBy,
      submittedAt: now,
      processingStatus: "pending",
      classificationStatus: "pending",
      entitiesStatus: "pending",
      humanReviewStatus: "pending",
      reviewHistory: [],
      // Category, confidence, entities remain undefined until ML processes
    });

    return { feedbackId };
  },
});

// Get citizen feedback by ID (with access check)
export const getFeedback = query({
  args: { feedbackId: v.id("citizen_feedback") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const feedback = await ctx.db
      .query("citizen_feedback")
      .filter((q: any) => q.eq("_id", args.feedbackId))
      .first();

    if (!feedback) throw new Error("Feedback not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      feedback.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    return feedback;
  },
});

// List all feedback for a project
export const listProjectFeedback = query({
  args: {
    projectId: v.id("projects"),
    limit: v.optional(v.number()),
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

    let feedback = await ctx.db
      .query("citizen_feedback")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    // Apply limit
    if (args.limit !== undefined) {
      feedback = feedback.slice(0, args.limit);
    }

    return feedback;
  },
});

// Update processing status for feedback
export const updateProcessingStatus = mutation({
  args: {
    feedbackId: v.id("citizen_feedback"),
    processingStatus: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed"),
    ),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const feedback = await ctx.db
      .query("citizen_feedback")
      .filter((q: any) => q.eq("_id", args.feedbackId))
      .first();

    if (!feedback) throw new Error("Feedback not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      feedback.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Only owner can update processing status
    if (accessLevel !== "owner") {
      throw new Error(
        "Unauthorized: Project owner access required for status updates",
      );
    }

    await ctx.db.patch(args.feedbackId, {
      processingStatus: args.processingStatus,
    });

    return { success: true };
  },
});

// Add ML classification results (called by ML service integration)
export const addClassificationResults = mutation({
  args: {
    feedbackId: v.id("citizen_feedback"),
    category: v.union(
      v.literal("environmental"),
      v.literal("social"),
      v.literal("technical"),
      v.literal("financial"),
      v.literal("legal"),
    ),
    confidence: v.number(),
    entities: v.object({
      locations: v.optional(v.array(v.string())),
      stakeholders: v.optional(v.array(v.string())),
      infrastructureTypes: v.optional(v.array(v.string())),
      dates: v.optional(v.array(v.string())),
    }),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const feedback = await ctx.db
      .query("citizen_feedback")
      .filter((q: any) => q.eq("_id", args.feedbackId))
      .first();

    if (!feedback) throw new Error("Feedback not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      feedback.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Validate confidence is between 0 and 1
    if (args.confidence < 0 || args.confidence > 1) {
      throw new Error("Confidence must be between 0 and 1");
    }

    await ctx.db.patch(args.feedbackId, {
      category: args.category,
      confidence: args.confidence,
      entities: args.entities,
      classificationStatus: "completed",
      entitiesStatus: "completed",
      processingStatus: "completed",
    });

    return { success: true };
  },
});

// Update human review status
export const updateReviewStatus = mutation({
  args: {
    feedbackId: v.id("citizen_feedback"),
    status: v.union(
      v.literal("pending"),
      v.literal("reviewed"),
      v.literal("flagged"),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const feedback = await ctx.db
      .query("citizen_feedback")
      .filter((q: any) => q.eq("_id", args.feedbackId))
      .first();

    if (!feedback) throw new Error("Feedback not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      feedback.projectId,
      currentUser,
    );
    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Add to review history before updating status
    const newReviewEntry = {
      reviewedBy: currentUser.authId,
      reviewedAt: Date.now(),
      status: args.status,
      notes: args.notes,
    };

    const updatedHistory = [...(feedback.reviewHistory || []), newReviewEntry];

    await ctx.db.patch(args.feedbackId, {
      humanReviewStatus: args.status,
      reviewHistory: updatedHistory,
    });

    return { success: true };
  },
});

// Delete feedback (only owner, with content preservation in history)
export const deleteFeedback = mutation({
  args: { feedbackId: v.id("citizen_feedback") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const feedback = await ctx.db
      .query("citizen_feedback")
      .filter((q: any) => q.eq("_id", args.feedbackId))
      .first();

    if (!feedback) throw new Error("Feedback not found");

    // Only owner can delete
    const accessLevel = await checkProjectAccess(
      ctx,
      feedback.projectId,
      currentUser,
    );
    if (accessLevel !== "owner") {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Archive content to history before deletion
    await ctx.db.insert("feedback_archive", {
      originalFeedbackId: feedback._id,
      content: feedback.content,
      language: feedback.language,
      source: feedback.source,
      archivedAt: Date.now(),
      archivedBy: currentUser.authId,
      projectDeleted: true,
    });

    // Delete feedback record
    ctx.db.delete(args.feedbackId);

    return { success: true };
  },
});
