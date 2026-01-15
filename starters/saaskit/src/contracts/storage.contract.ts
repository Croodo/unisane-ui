import { initContract } from "@ts-rest/core";
import { z } from "zod";
import { defineOpMeta, withMeta } from "./meta";
import { PERM } from "@unisane/kernel/client";
import {
  ZRequestUpload,
  ZListFiles,
  ZStorageFileResponse,
  ZUploadUrlResponse,
  ZDownloadUrlResponse,
} from "@unisane/storage/client";

const c = initContract();

export const storageContract = c.router({
  requestUpload: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/storage/upload",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      body: ZRequestUpload,
      responses: {
        200: z.object({ ok: z.literal(true), data: ZUploadUrlResponse }),
      },
      summary: "Request a presigned upload URL",
      description: "Get a presigned URL for direct-to-storage file upload. Returns a temporary upload URL and file ID. After uploading, call confirm to finalize. Requires STORAGE_WRITE permission.",
    },
    defineOpMeta({
      op: "storage.upload.request",
      perm: PERM.STORAGE_WRITE,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/storage",
        fn: "requestUpload",
        zodBody: {
          importPath: "@unisane/storage",
          name: "ZRequestUpload",
        },
        invoke: "object",
        callArgs: [
          { name: "uploaderId", from: "ctx", key: "userId" },
          { name: "input", from: "body" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  confirmUpload: withMeta(
    {
      method: "POST",
      path: "/api/rest/v1/tenants/:tenantId/storage/upload/:fileId/confirm",
      pathParams: z.object({
        tenantId: z.string().min(1),
        fileId: z.string().min(1),
      }),
      body: z.object({}),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZStorageFileResponse }),
      },
      summary: "Confirm upload completed",
      description: "Confirm that a file upload has completed successfully. Validates the file exists in storage and marks it as confirmed. Must be called after uploading to the presigned URL. Requires STORAGE_WRITE permission.",
    },
    defineOpMeta({
      op: "storage.upload.confirm",
      perm: PERM.STORAGE_WRITE,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/storage",
        fn: "confirmUpload",
        invoke: "object",
        callArgs: [
          { name: "fileId", from: "params", key: "fileId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  downloadUrl: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/storage/download/:fileId",
      pathParams: z.object({
        tenantId: z.string().min(1),
        fileId: z.string().min(1),
      }),
      responses: {
        200: z.object({ ok: z.literal(true), data: ZDownloadUrlResponse }),
      },
      summary: "Get presigned download URL",
      description: "Get a temporary presigned URL for downloading a file. The URL expires after a short period. Requires STORAGE_READ permission.",
    },
    defineOpMeta({
      op: "storage.download",
      perm: PERM.STORAGE_READ,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/storage",
        fn: "getDownloadUrl",
        invoke: "object",
        callArgs: [
          { name: "fileId", from: "params", key: "fileId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  deleteFile: withMeta(
    {
      method: "DELETE",
      path: "/api/rest/v1/tenants/:tenantId/storage/files/:fileId",
      pathParams: z.object({
        tenantId: z.string().min(1),
        fileId: z.string().min(1),
      }),
      body: z.object({}),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({ ok: z.boolean(), key: z.string() }),
        }),
      },
      summary: "Delete a file (soft delete)",
      description: "Mark a file for deletion (soft delete). The file is not immediately removed from storage but will be cleaned up by a background job. Requires STORAGE_DELETE permission.",
    },
    defineOpMeta({
      op: "storage.delete",
      perm: PERM.STORAGE_DELETE,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/storage",
        fn: "deleteFile",
        invoke: "object",
        callArgs: [
          { name: "fileId", from: "params", key: "fileId" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
  list: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/tenants/:tenantId/storage/files",
      pathParams: z.object({ tenantId: z.string().min(1) }),
      query: ZListFiles,
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            items: z.array(ZStorageFileResponse),
            nextCursor: z.string().nullable(),
          }),
        }),
      },
      summary: "List files",
      description: "List files for a tenant with optional filtering by folder or status. Supports cursor-based pagination. Returns file metadata including size, type, and upload status. Requires STORAGE_READ permission.",
    },
    defineOpMeta({
      op: "storage.list",
      perm: PERM.STORAGE_READ,
      requireTenantMatch: true,
      service: {
        importPath: "@unisane/storage",
        fn: "listFiles",
        zodQuery: {
          importPath: "@unisane/storage",
          name: "ZListFiles",
        },
        invoke: "positional",
        callArgs: [
          { name: "input", from: "query" },
        ],
        requireTenantMatch: true,
      },
    })
  ),
});
