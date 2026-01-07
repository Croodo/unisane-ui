import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ZGlobalRole } from '@unisane/kernel';
import { ZPlanId } from '@unisane/kernel';
import { ZRoleId } from '@unisane/kernel';
import { ZPermission } from '@unisane/kernel';
import { defineOpMeta, withMeta } from './meta';

const c = initContract();

export const ZMeOut = z.object({
  userId: z.string().nullable(),
  tenantId: z.string().nullable(),
  tenantSlug: z.string().nullable().optional(),
  tenantName: z.string().nullable().optional(),
  role: ZRoleId.nullable(),
  plan: ZPlanId.nullable(),
  // Optional user profile fields for UI
  displayName: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  // Global role visibility (admin tools)
  globalRole: ZGlobalRole.nullable().optional(),
  // Convenience override flag for admin UI
  isSuperAdmin: z.boolean().optional(),
  perms: z.array(ZPermission),
});

export const meContract = c.router({
  get: withMeta({
    method: 'GET',
    path: '/api/rest/v1/me',
    responses: { 200: z.object({ ok: z.literal(true), data: ZMeOut }) },
    summary: 'Current user summary',
  }, defineOpMeta({
    op: 'me.get',
    allowUnauthed: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'getMeSummary',
      invoke: 'object',
      callArgs: [
        { name: 'userId', from: 'ctx', key: 'userId' },
        { name: 'perms', from: 'ctx', key: 'perms', optional: true },
        { name: 'isSuperAdmin', from: 'ctx', key: 'isSuperAdmin', optional: true },
      ],
    },
  })),
  memberships: withMeta({
    method: 'GET',
    path: '/api/rest/v1/me/memberships',
    query: z.object({ cursor: z.string().optional(), limit: z.coerce.number().int().positive().max(500).default(50) }).optional(),
    responses: {
      200: z.object({
        ok: z.literal(true),
        data: z.object({
          items: z.array(
            z.object({
              tenantId: z.string(),
              tenantSlug: z.string().nullable().optional(),
              tenantName: z.string().nullable().optional(),
              roles: z.array(ZRoleId),
              updatedAt: z.string().nullable().optional(),
            })
          ),
          nextCursor: z.string().optional(),
        }),
      }),
    },
    summary: 'List my memberships',
  }, defineOpMeta({ op: 'memberships.listMine', requireUser: true, service: { importPath: '@unisane/identity', fn: 'listMyMemberships', zodQuery: { importPath: '@unisane/kernel', name: 'ZSeekPageQuery' }, invoke: 'object', callArgs: [ { name: 'userId', from: 'ctx', key: 'userId' }, { name: 'limit', from: 'query', key: 'limit' }, { name: 'cursor', from: 'query', key: 'cursor', optional: true } ] } })),
  profileGet: withMeta({
    method: 'GET',
    path: '/api/rest/v1/me/profile',
    responses: {
      200: z.object({ ok: z.literal(true), data: z.object({
        id: z.string(),
        email: z.string().email(),
        displayName: z.string().nullable(),
        imageUrl: z.string().url().nullable(),
        username: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        phone: z.string().nullable(),
        emailVerified: z.boolean().nullable(),
        phoneVerified: z.boolean().nullable(),
        locale: z.string().nullable(),
        timezone: z.string().nullable(),
      }).nullable() })
    },
    summary: 'Get my profile',
  }, defineOpMeta({
    op: 'me.profile.get',
    requireUser: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'getMyProfile',
      invoke: 'object',
      callArgs: [ { name: 'userId', from: 'ctx', key: 'userId' } ],
      audit: { resourceType: 'user', resourceIdExpr: 'ctx.userId' },
    },
  })),
  profilePatch: withMeta({
    method: 'PATCH',
    path: '/api/rest/v1/me/profile',
    body: z.object({}).passthrough(),
    responses: {
      200: z.object({ ok: z.literal(true), data: z.object({
        id: z.string(),
        email: z.string().email(),
        displayName: z.string().nullable(),
        imageUrl: z.string().url().nullable(),
        role: z.string().nullable().optional(),
      }) })
    },
    summary: 'Update my profile',
  }, defineOpMeta({
    op: 'me.profile.patch',
    requireUser: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'updateMyProfile',
      zodBody: { importPath: '@unisane/identity', name: 'ZUserUpdate' },
      invoke: 'object',
      callArgs: [
        { name: 'userId', from: 'ctx', key: 'userId' },
        { name: 'patch', from: 'body' },
      ],
      audit: { resourceType: 'user', resourceIdExpr: 'ctx.userId', afterExpr: 'result' },
    },
  })),
});
