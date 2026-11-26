import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
      .withIndex("authId", (q) => q.eq("authId", identity.subject as string))
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
