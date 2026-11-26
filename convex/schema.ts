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
});
