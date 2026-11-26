import {
  type AuthFunctions,
  createClient,
  type GenericCtx,
} from "@convex-dev/better-auth";
import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { components, internal } from "./_generated/api";
import type { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

const siteUrl = process.env.SITE_URL!;
const authFunctions: AuthFunctions = internal.auth;

export const authComponent = createClient<DataModel>(components.betterAuth, {
  authFunctions,
  triggers: {
    user: {
      onCreate: async (ctx, authUser) => {
        await ctx.db.insert("user", {
          authId: authUser._id,
          name: authUser.name ?? "",
          email: authUser.email,
          role: "analyst",
          verificationStatus: "unverified",
          isBlocked: false,
          registrationCompleted: false,
          createdAt: Date.now(),
        });
      },
      onDelete: async (ctx, authUser) => {
        const profile = await ctx.db
          .query("user")
          .withIndex("authId", (q) => q.eq("authId", authUser._id))
          .first();
        if (profile) await ctx.db.delete(profile._id);
      },
    },
  },
});

export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

export function createAuth(ctx: GenericCtx<DataModel>) {
  return betterAuth({
    baseURL: siteUrl,
    secret: process.env.BETTER_AUTH_SECRET,
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [convex({ authConfig })],
  });
}

export const getUserWithRole = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("user")
      .withIndex("authId", (q) => q.eq("authId", identity.subject as string))
      .first();

    if (!user) return null;

    return {
      email: user.email,
      subject: identity.subject,
      role: user.role || "analyst",
    };
  },
});
