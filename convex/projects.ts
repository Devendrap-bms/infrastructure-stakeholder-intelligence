import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Helper type for application user
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

// Get current application user from Better Auth
// Uses identity.subject which contains the Better Auth user _id
// Maps to application user by querying the user table via authId index
async function getCurrentAppUser(ctx: unknown): Promise<AppUser | null> {
  const db = (ctx as any).db;
  const auth = (ctx as any).auth;

  const identity = await auth.getUserIdentity();
  if (!identity) return null;

  // Validate session is not expired - use .get() for direct _id lookup
  const session = await db.get(identity.sessionId as string);

  if (!session || session.expiresAt < Date.now()) return null;

  // identity.subject contains the Better Auth user _id
  // which equals the user.authId in our schema
  const user = await db
    .query("user")
    .withIndex("authId", (q: { eq: (key: string, value: string) => unknown }) =>
      q.eq("authId", identity.subject as string),
    )
    .first();

  return user ?? null;
}

// Helper to check if user is authenticated, not blocked, and registered
async function checkUserAuthorized(ctx: unknown): Promise<AppUser> {
  const user = await getCurrentAppUser(ctx);
  if (!user) throw new Error("Not authenticated");
  if (user.isBlocked) throw new Error("Account is blocked");
  if (!user.registrationCompleted) throw new Error("Account not registered");
  return user;
}

// List projects owned by current user
export const listOwnedProjects = query({
  handler: async (ctx) => {
    const user = await checkUserAuthorized(ctx);

    return await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user.authId))
      .collect();
  },
});

// List all projects user has access to (owned or member)
export const listProjects = query({
  handler: async (ctx) => {
    const user = await checkUserAuthorized(ctx);

    // Get owned projects
    const owned = await ctx.db
      .query("projects")
      .withIndex("by_owner", (q) => q.eq("ownerId", user.authId))
      .collect();

    // Get projects where user is a member
    const memberships = await ctx.db
      .query("project_members")
      .withIndex("user_projects", (q) => q.eq("userId", user.authId))
      .collect();

    if (memberships.length === 0) {
      return owned;
    }

    const memberProjectIds = memberships.map((m) => m.projectId);

    // Get all projects and filter by member IDs
    const allProjects = await ctx.db.query("projects").collect();
    const memberProjects = allProjects.filter((p) =>
      memberProjectIds.includes(p._id),
    );

    // Combine owned and member projects
    const projectMap = new Map();
    for (const p of owned) projectMap.set(p._id, p);
    for (const p of memberProjects) projectMap.set(p._id, p);

    return Array.from(projectMap.values());
  },
});

// Get project details (with membership check)
export const getProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Check if user is owner
    if (project.ownerId === user.authId) {
      return {
        ...project,
        isMember: true,
        isOwner: true,
        memberRole: "owner" as const,
      };
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", user.authId),
      )
      .first();

    if (membership) {
      return {
        ...project,
        isMember: true,
        isOwner: false,
        memberRole: membership.role,
      };
    }

    // Not a member - return null
    return null;
  },
});

// Create a new project
export const createProject = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      address: v.optional(v.string()),
    }),
    startDate: v.number(),
    expectedEndDate: v.union(v.null(), v.number()),
  },
  handler: async (ctx, args) => {
    const user = await checkUserAuthorized(ctx);

    const now = Date.now();

    const projectId = await ctx.db.insert("projects", {
      name: args.name,
      description: args.description,
      location: args.location,
      startDate: args.startDate,
      expectedEndDate: args.expectedEndDate,
      status: "planning",
      createdAt: now,
      updatedAt: now,
      ownerId: user.authId,
    });

    // Add self as owner member
    await ctx.db.insert("project_members", {
      projectId,
      userId: user.authId,
      role: "owner",
      joinedAt: now,
    });

    return projectId;
  },
});

// Update project
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(
      v.object({
        lat: v.number(),
        lng: v.number(),
        address: v.optional(v.string()),
      }),
    ),
    startDate: v.optional(v.number()),
    expectedEndDate: v.union(v.null(), v.number()),
    status: v.optional(
      v.union(
        v.literal("planning"),
        v.literal("active"),
        v.literal("completed"),
        v.literal("cancelled"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const user = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can update
    if (project.ownerId !== user.authId) {
      throw new Error("Unauthorized: Project owner access required");
    }

    const updates: Record<string, unknown> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.location !== undefined) updates.location = args.location;
    if (args.startDate !== undefined) updates.startDate = args.startDate;
    if (args.expectedEndDate !== undefined)
      updates.expectedEndDate = args.expectedEndDate;
    if (args.status !== undefined) updates.status = args.status;

    updates.updatedAt = Date.now();

    await ctx.db.patch(args.projectId, updates);

    return args.projectId;
  },
});

// Delete project (only owner, with safety checks)
export const deleteProject = mutation({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can delete
    if (project.ownerId !== user.authId) {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Delete all project members first
    const members = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) => q.eq("projectId", args.projectId))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete the project
    await ctx.db.delete(args.projectId);

    return { success: true };
  },
});

// Add project member
export const addProjectMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can add members
    if (project.ownerId !== currentUser.authId) {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Verify target user exists and is fully registered
    const targetUser = await ctx.db
      .query("user")
      .withIndex("authId", (q) => q.eq("authId", args.userId))
      .first();

    if (!targetUser) throw new Error("User not found");
    if (!targetUser.registrationCompleted)
      throw new Error("User not registered");
    if (targetUser.isBlocked) throw new Error("User account is blocked");

    // Check if already a member
    const existing = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId),
      )
      .first();

    if (existing) {
      throw new Error("User is already a project member");
    }

    await ctx.db.insert("project_members", {
      projectId: args.projectId,
      userId: args.userId,
      role: args.role,
      joinedAt: Date.now(),
    });

    return { success: true };
  },
});

// List project members
export const listProjectMembers = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const user = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only members can see member list
    if (project.ownerId !== user.authId) {
      const membership = await ctx.db
        .query("project_members")
        .withIndex("project_user", (q) =>
          q.eq("projectId", args.projectId).eq("userId", user.authId),
        )
        .first();

      if (!membership) {
        throw new Error("Unauthorized: Project member access required");
      }
    }

    const members = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) => q.eq("projectId", args.projectId))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const memberUser = await ctx.db
          .query("user")
          .withIndex("authId", (q) => q.eq("authId", member.userId))
          .first();

        return {
          userId: member.userId,
          name: memberUser?.name ?? "Unknown",
          email: memberUser?.email ?? "",
          role: member.role,
          joinedAt: member.joinedAt,
        };
      }),
    );

    return memberDetails;
  },
});

// Update project member role
export const updateProjectMemberRole = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    role: v.union(v.literal("owner"), v.literal("editor"), v.literal("viewer")),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can update member roles
    if (project.ownerId !== currentUser.authId) {
      throw new Error("Unauthorized: Project owner access required");
    }

    const member = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId),
      )
      .first();

    if (!member) {
      throw new Error("User is not a project member");
    }

    await ctx.db.patch(member._id, { role: args.role });

    return { success: true };
  },
});

// Remove project member
export const removeProjectMember = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Only owner can remove members
    if (project.ownerId !== currentUser.authId) {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Can't remove yourself (owner must transfer ownership or delete project first)
    if (args.userId === project.ownerId) {
      throw new Error(
        "Cannot remove project owner. Transfer ownership or delete project first.",
      );
    }

    const member = await ctx.db
      .query("project_members")
      .withIndex("project_user", (q) =>
        q.eq("projectId", args.projectId).eq("userId", args.userId),
      )
      .first();

    if (!member) {
      throw new Error("User is not a project member");
    }

    await ctx.db.delete(member._id);

    return { success: true };
  },
});
