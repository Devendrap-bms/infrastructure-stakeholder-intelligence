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
    .index("by_status", ["uploadStatus"]),

  // Citizen feedback table
  citizen_feedback: defineTable({
    projectId: v.id("projects"),
    content: v.string(),
    language: v.union(v.literal("en"), v.literal("te"), v.literal("te-Latn"), v.literal("kn"), v.literal("kn-Latn")),
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
        status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("flagged")),
        notes: v.optional(v.string()),
      }),
    ),
    // Fields populated by ML service - remain pending until ML processes
    category: v.optional(v.union(v.literal("environmental"), v.literal("social"), v.literal("technical"), v.literal("financial"), v.literal("legal"))),
    confidence: v.optional(v.number()),
    entities: v.optional(v.object({
      locations: v.optional(v.array(v.string())),
      stakeholders: v.optional(v.array(v.string())),
      infrastructureTypes: v.optional(v.array(v.string())),
      dates: v.optional(v.array(v.string())),
    })),
  })
    .index("by_project", ["projectId"])
    .index("by_submitter", ["submittedBy"])
    .index("by_language", ["language"])
    .index("by_review_status", ["humanReviewStatus"])
    .index("by_processing_status", ["processingStatus"]),

  // Feedback archive for deleted feedback (preserves content)
  feedback_archive: defineTable({
    originalFeedbackId: v.string(),
    content: v.string(),
    language: v.union(v.literal("en"), v.literal("te"), v.literal("te-Latn"), v.literal("kn"), v.literal("kn-Latn")),
    source: v.union(v.literal("web"), v.literal("mobile"), v.literal("api")),
    archivedAt: v.number(),
    archivedBy: v.string(),
    projectDeleted: v.boolean(),
  })
    .index("by_original_id", ["originalFeedbackId"])
    .index("by_archived_at", ["archivedAt"]),
});
