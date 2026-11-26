import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserWithRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("user")
      .filter((u) => u.email === identity.email)
      .first();

    if (!user) return null;

    return {
      email: identity.email,
      subject: identity.subject,
      role: user.role || "analyst",
    };
  },
});

export const assignRole = mutation({
  args: {
    userId: v.id("user"),
    role: v.union(
      v.literal("analyst"),
      v.literal("planner"),
      v.literal("admin"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("user")
      .filter((u) => u.email === identity.email)
      .first();

    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { role: args.role });
    return { success: true };
  },
});
