/**
 * Better Auth setup for Convex
 * This file configures email/password authentication with role-based access control
 *
 * Required environment variables:
 * - BETTER_AUTH_SECRET: A random secret string (64 chars recommended)
 * - BETTER_AUTH_URL: Your app URL (e.g., http://localhost:3000)
 */

import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type DBFieldType } from "better-auth";

// Email/password configuration
const emailConfig = {
  enabled: true,
  requireEmailVerification: false,
};

// Custom role field - cannot be set by users during signup
const userConfig = {
  additionalFields: {
    role: {
      type: "string" as DBFieldType,
      input: false, // Users cannot set this during signup
    },
  },
};

// Create Better Auth instance
// ctx parameter receives Convex context with database adapter
export function createAuth(ctx: any) {
  return betterAuth({
    baseURL: process.env.SITE_URL || "http://localhost:3000",
    database: ctx,
    emailAndPassword: emailConfig,
    user: userConfig,
    plugins: [
      convex({
        authConfig: {
          providers: [], // No OAuth providers - email/password only
        },
      }),
    ],
  });
}

// Export for component registration in convex.config.ts
export const authComponent = {
  adapter: (ctx: any) => ({
    // Better Auth adapter for Convex
  }),
};
