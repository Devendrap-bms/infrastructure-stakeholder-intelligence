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

  // Better Auth session table
  session: defineTable({
    expiresAt: v.number(),
    token: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    ipAddress: v.optional(v.union(v.null(), v.string())),
    userAgent: v.optional(v.union(v.null(), v.string())),
    userId: v.string(),
  })
    .index("expiresAt", ["expiresAt"])
    .index("expiresAt_userId", ["expiresAt", "userId"])
    .index("token", ["token"])
    .index("userId", ["userId"]),

  // Better Auth account table (for OAuth)
  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.string(),
    accessToken: v.optional(v.union(v.null(), v.string())),
    refreshToken: v.optional(v.union(v.null(), v.string())),
    idToken: v.optional(v.union(v.null(), v.string())),
    accessTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    refreshTokenExpiresAt: v.optional(v.union(v.null(), v.number())),
    scope: v.optional(v.union(v.null(), v.string())),
    password: v.optional(v.union(v.null(), v.string())),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("accountId", ["accountId"])
    .index("accountId_providerId", ["accountId", "providerId"])
    .index("accountId_providerId_userId", ["accountId", "providerId", "userId"])
    .index("providerId_userId", ["providerId", "userId"])
    .index("userId", ["userId"]),

  // Better Auth verification table
  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("expiresAt", ["expiresAt"])
    .index("identifier", ["identifier"]),

  // Better Auth twoFactor table
  twoFactor: defineTable({
    secret: v.string(),
    backupCodes: v.string(),
    userId: v.string(),
    verified: v.optional(v.union(v.null(), v.boolean())),
    failedVerificationCount: v.optional(v.union(v.null(), v.number())),
    lockedUntil: v.optional(v.union(v.null(), v.number())),
  }).index("userId", ["userId"]),

  // Better Auth jwks table
  jwks: defineTable({
    publicKey: v.string(),
    privateKey: v.string(),
    createdAt: v.number(),
    expiresAt: v.optional(v.union(v.null(), v.number())),
    alg: v.optional(v.union(v.null(), v.string())),
    crv: v.optional(v.union(v.null(), v.string())),
  }),

  // Better Auth rateLimit table
  rateLimit: defineTable({
    key: v.string(),
    count: v.number(),
    lastRequest: v.number(),
  })
    .index("key", ["key"])
    .index("lastRequest", ["lastRequest"]),
});
