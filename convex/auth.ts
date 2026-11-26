/**
 * Better Auth setup for Convex
 * This file configures email/password authentication with role-based access control
 *
 * Required environment variables:
 * - BETTER_AUTH_SECRET: A random secret string (64 chars recommended)
 * - BETTER_AUTH_URL: Your app URL (e.g., http://localhost:3000)
 * - CONVEX_SITE_URL: Your Convex deployment URL
 */

import { convex } from "@convex-dev/better-auth/plugins";
import { betterAuth, type DBFieldType } from "better-auth";
import authConfig from "./auth.config";

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
    baseURL:
      process.env.BETTER_AUTH_URL ||
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
      "http://localhost:3000",
    database: ctx,
    emailAndPassword: emailConfig,
    user: userConfig,
    secret: process.env.BETTER_AUTH_SECRET,
    plugins: [
      convex({
        authConfig,
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
