import { z } from "zod";
import { ZGrantEffect, ZLocale, DEFAULT_LOCALE, ZRoleId, ZPermission } from "@unisane/kernel/client";

export const ZInviteUser = z.object({
  email: z.string().email(),
  roleId: ZRoleId,
});
export const ZAddRole = z.object({
  userId: z.string().min(1),
  roleId: ZRoleId,
  expectedVersion: z.number().int().optional(),
});
export const ZRemoveRole = z.object({
  userId: z.string().min(1),
  roleId: ZRoleId,
  expectedVersion: z.number().int().optional(),
});
export const ZGrantPerm = z.object({
  userId: z.string().min(1),
  perm: ZPermission,
  effect: ZGrantEffect,
  expectedVersion: z.number().int().optional(),
});

// Route-scoped bodies (path carries tenantId/userId)
export const ZAddRoleBody = z.object({
  roleId: ZRoleId,
  expectedVersion: z.number().int().optional(),
});
export const ZGrantPermBody = z.object({
  perm: ZPermission,
  effect: ZGrantEffect,
  expectedVersion: z.number().int().optional(),
});
export const ZRemoveRoleBody = z.object({
  roleId: ZRoleId,
  expectedVersion: z.number().int().optional(),
});
export const ZRevokePermBody = z.object({
  perm: ZPermission,
  expectedVersion: z.number().int().optional(),
});

export const ZUsername = z
  .string()
  .trim()
  .regex(/^[a-z0-9_.]{3,30}$/i, "username must be 3-30 chars (a-z 0-9 _ .)")
  .transform((s) => s.replace(/^@+/, ""));

export const ZPhoneE164 = z
  .string()
  .trim()
  .regex(/^\+[1-9][0-9]{7,14}$/, "phone must be E.164 like +14155550123");

export const ZUserCreate = z.object({
  email: z.string().trim().email(),
  displayName: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.string().trim().url().optional(),
  username: ZUsername.optional(),
  firstName: z.string().trim().max(80).optional(),
  lastName: z.string().trim().max(80).optional(),
  phone: ZPhoneE164.optional(),
  locale: ZLocale.default(DEFAULT_LOCALE),
  timezone: z.string().trim().optional(),
});

const ZNullableDisplayName = z.union([
  z.string().trim().min(1).max(120),
  z.literal(null),
]);
const ZNullableImageUrl = z.union([z.string().trim().url(), z.literal(null)]);

export const ZUserUpdate = z
  .object({
    displayName: ZNullableDisplayName.optional(),
    imageUrl: ZNullableImageUrl.optional(),
    username: ZUsername.optional(),
    firstName: z.union([z.string().trim().max(80), z.literal(null)]).optional(),
    lastName: z.union([z.string().trim().max(80), z.literal(null)]).optional(),
    phone: z.union([ZPhoneE164, z.literal(null)]).optional(),
    locale: z.union([ZLocale, z.literal(null)]).optional(),
    timezone: z.union([z.string().trim(), z.literal(null)]).optional(),
  })
  .refine((val) => Object.keys(val).length > 0, {
    message: "At least one field must be provided",
  });

export const ZTenantCreate = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(
      /^[a-z0-9-]{2,80}$/i,
      "slug may contain letters, numbers, and dashes only"
    )
    .optional(),
});

// Route output DTOs
export const ZMeOut = z.object({
  userId: z.string().nullable(),
  tenantId: z.string().nullable(),
  tenantSlug: z.string().nullable().optional(),
  tenantName: z.string().nullable().optional(),
  role: z.string().nullable(),
  plan: z.string().nullable(),
  perms: z.array(z.string()),
});
