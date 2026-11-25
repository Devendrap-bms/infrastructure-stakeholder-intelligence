import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getUserWithRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Return identity info
    // Role will be stored in Better Auth's internal user table
    // Access via identity.role field after session customization
    return {
      email: identity.email,
      subject: identity.subject,
      role: (identity as any).role || "analyst",
    };
  },
});

export const assignRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("analyst"), v.literal("planner")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const currentUser = await ctx.db
      .query("users" as any)
      .filter((u: any) => u.email === identity.email)
      .first();

    if (!currentUser || (currentUser as any).role !== "admin") {
      throw new Error("Unauthorized: Admin access required");
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, { role: args.role });
    return { success: true };
  },
});
