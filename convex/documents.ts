import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { authComponent } from "./auth";

// File size limits
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed MIME types for document upload
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

// Document type constants (not used yet, but kept for future validation)
const _DOCUMENT_TYPES = [
  "DPR",
  "EIA",
  "ESIA",
  "EMP",
  "SIA",
  "feasibility_report",
  "public_hearing_record",
] as const;

// Get current application user from Better Auth
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

async function getCurrentAppUser(ctx: unknown): Promise<AppUser | null> {
  const db = (ctx as any).db;

  const betterAuthUser = await authComponent.safeGetAuthUser(ctx as any);
  if (!betterAuthUser) return null;

  // Cast the user object to get proper type inference
  const userRecord = betterAuthUser as { _id: string };

  const user = await db
    .query("user")
    .withIndex("authId", (q: { eq: (key: string, value: string) => unknown }) =>
      q.eq("authId", userRecord._id),
    )
    .first();

  return user ?? null;
}

async function checkUserAuthorized(ctx: unknown): Promise<AppUser> {
  const user = await getCurrentAppUser(ctx);
  if (!user) throw new Error("Not authenticated");
  if (user.isBlocked) throw new Error("Account is blocked");
  // registrationCompleted doesn't apply for document uploads
  return user;
}

// Check if user has access to a project (is owner or member)
async function checkProjectAccess(
  ctx: unknown,
  projectId: string,
  currentUser: AppUser,
): Promise<"owner" | "member" | "none"> {
  const db = (ctx as any).db;

  const project = await db.get(projectId);
  if (!project) throw new Error("Project not found");

  if (project.ownerId === currentUser.authId) return "owner";

  // Use any to avoid type inference issues with chained eq calls
  const membership = (await db
    .query("project_members")
    .withIndex("project_user", (q: any) =>
      q.eq("projectId", projectId).eq("userId", currentUser.authId),
    )
    .first()) as any;

  return membership ? "member" : "none";
}

// Generate a pre-signed upload URL for document upload
// Frontend flow:
// 1. Call this function to get upload URL
// 2. Upload file directly to URL (client-side)
// 3. Call storeDocument to save metadata
export const generateUploadUrl = mutation({
  args: {
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
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(args.mimeType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    // Generate upload URL - Convex generates a storage ID internally
    const uploadUrl =
      ctx.storage?.generateUploadUrl?.() || `https://api.convex.dev/v1/storage`;

    return { uploadUrl };
  },
});

// Store document metadata after successful upload (validates actual file metadata)
export const storeDocument = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
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
    provenance: v.string(),
    metadata: v.object({
      pages: v.optional(v.number()),
      author: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Retrieve actual storage metadata - do not trust client-provided values
    let storageMetadata: { size?: number; contentType?: string } | null = null;
    try {
      storageMetadata = await (ctx.db as any).system?.get?.(
        "_storage",
        args.storageId,
      );
    } catch (_e) {
      // Storage object not found or other error
    }

    if (!storageMetadata) {
      throw new Error("Storage object not found for provided storageId");
    }

    // Validate actual file size
    const actualFileSize = storageMetadata.size ?? 0;
    if (actualFileSize > MAX_FILE_SIZE) {
      throw new Error("File size exceeds maximum allowed (50MB)");
    }

    // Validate actual content type against allowed MIME types
    const actualContentType = storageMetadata.contentType;
    if (!actualContentType || !ALLOWED_MIME_TYPES.includes(actualContentType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    const now = Date.now();

    const documentId = ctx.db.insert("documents", {
      projectId: args.projectId,
      fileName: args.fileName,
      documentType: args.documentType,
      mimeType: actualContentType,
      fileSize: actualFileSize,
      storageId: args.storageId,
      version: 1,
      provenance: args.provenance,
      uploadStatus: "completed",
      processingStatus: "pending",
      uploadedBy: currentUser.authId,
      uploadedAt: now,
      updatedAt: now,
      downloadCount: 0,
      metadata: {
        pages: args.metadata.pages,
        author: args.metadata.author,
        title: args.metadata.title,
        description: args.metadata.description,
      },
    });

    return { documentId };
  },
});

// Upload a document to a project (combined flow with metadata validation)
export const uploadDocument = mutation({
  args: {
    projectId: v.id("projects"),
    storageId: v.string(),
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
    provenance: v.string(),
    metadata: v.object({
      pages: v.optional(v.number()),
      author: v.optional(v.string()),
      title: v.optional(v.string()),
      description: v.optional(v.string()),
    }),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Retrieve actual storage metadata - do not trust client-provided values
    let storageMetadata: { size?: number; contentType?: string } | null = null;
    try {
      storageMetadata = await (ctx.db as any).system?.get?.(
        "_storage",
        args.storageId,
      );
    } catch (_e) {
      // Storage object not found or other error
    }

    if (!storageMetadata) {
      throw new Error("Storage object not found for provided storageId");
    }

    // Validate actual file size
    const actualFileSize = storageMetadata.size ?? 0;
    if (actualFileSize > MAX_FILE_SIZE) {
      throw new Error("File size exceeds maximum allowed (50MB)");
    }

    // Validate actual content type against allowed MIME types
    const actualContentType = storageMetadata.contentType;
    if (!actualContentType || !ALLOWED_MIME_TYPES.includes(actualContentType)) {
      throw new Error(
        `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`,
      );
    }

    const now = Date.now();

    const documentId = ctx.db.insert("documents", {
      projectId: args.projectId,
      fileName: args.fileName,
      documentType: args.documentType,
      mimeType: actualContentType,
      fileSize: actualFileSize,
      storageId: args.storageId,
      version: 1,
      provenance: args.provenance,
      uploadStatus: "completed",
      processingStatus: "pending",
      uploadedBy: currentUser.authId,
      uploadedAt: now,
      updatedAt: now,
      downloadCount: 0,
      metadata: {
        pages: args.metadata.pages,
        author: args.metadata.author,
        title: args.metadata.title,
        description: args.metadata.description,
      },
    });

    return { documentId };
  },
});

// Get a document by ID (with access check)
export const getDocument = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const document = await ctx.db
      .query("documents")
      .filter((q: any) => q.eq("_id", args.documentId))
      .first();

    if (!document) throw new Error("Document not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      document.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    return document;
  },
});

// Get download URL for a document
export const getDownloadUrl = query({
  args: { documentId: v.id("documents") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const document = await ctx.db
      .query("documents")
      .filter((q: any) => q.eq("_id", args.documentId))
      .first();

    if (!document) throw new Error("Document not found");

    // Check project access
    const accessLevel = await checkProjectAccess(
      ctx,
      document.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    // Get download URL from Convex storage
    const downloadUrl = ctx.storage?.getDownloadUrl?.(document.storageId) || "";

    // Increment download count
    ctx.db.patch(args.documentId, {
      downloadCount: document.downloadCount + 1,
    });

    return { downloadUrl, document };
  },
});

// List all documents for a project
export const listProjectDocuments = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);
    const accessLevel = await checkProjectAccess(
      ctx,
      args.projectId,
      currentUser,
    );

    if (accessLevel === "none") {
      throw new Error("Unauthorized: Project access required");
    }

    const documents = await ctx.db
      .query("documents")
      .withIndex("by_project", (q: any) => q.eq("projectId", args.projectId))
      .collect();

    return documents;
  },
});

// Update document metadata
export const updateDocument = mutation({
  args: {
    documentId: v.id("documents"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    metadata: v.optional(
      v.object({
        pages: v.optional(v.number()),
        author: v.optional(v.string()),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const document = await ctx.db
      .query("documents")
      .filter((q: any) => q.eq("_id", args.documentId))
      .first();

    if (!document) throw new Error("Document not found");

    // Only owner can update
    const accessLevel = await checkProjectAccess(
      ctx,
      document.projectId,
      currentUser,
    );
    if (accessLevel !== "owner") {
      throw new Error("Unauthorized: Project owner access required");
    }

    const updates: Record<string, unknown> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.metadata !== undefined) updates.metadata = args.metadata;

    updates.updatedAt = Date.now();

    await ctx.db.patch(args.documentId, updates);

    return { success: true };
  },
});

// Delete a document (only owner, with storage cleanup)
export const deleteDocument = mutation({
  args: { documentId: v.id("documents") },
  handler: async (ctx: any, args) => {
    const currentUser = await checkUserAuthorized(ctx);

    const document = await ctx.db
      .query("documents")
      .filter((q: any) => q.eq("_id", args.documentId))
      .first();

    if (!document) throw new Error("Document not found");

    // Only owner can delete
    const accessLevel = await checkProjectAccess(
      ctx,
      document.projectId,
      currentUser,
    );
    if (accessLevel !== "owner") {
      throw new Error("Unauthorized: Project owner access required");
    }

    // Delete from storage - Convex handles storage cleanup when using proper storage IDs
    try {
      if (ctx.storage?.delete) {
        await ctx.storage.delete(document.storageId);
      }
    } catch (e) {
      // Log but continue deletion
      console.error("Failed to delete from storage:", e);
    }

    // Delete document record
    ctx.db.delete(args.documentId);

    return { success: true };
  },
});
