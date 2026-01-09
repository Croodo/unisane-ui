import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ZUserCreate, ZUserUpdate } from '@unisane/identity';
import { ZCursor, ZLimitCoerce } from '@unisane/kernel/client';
import { defineOpMeta, withMeta } from './meta';
import { PERM } from '@unisane/kernel/client';
import { ZRoleId } from '@unisane/kernel/client';

const c = initContract();

// Local DTO for outputs
const ZUserOut = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable(),
  imageUrl: z.string().url().nullable(),
  role: z.string().nullable().optional(),
});

// Admin list/export cap (≤ 50 items per page)
export const ZAdminUserFilters = z.object({
  q: z.string().optional(),
  email: z.object({ eq: z.string().email().optional(), contains: z.string().optional(), in: z.array(z.string().email()).optional() }).partial().optional(),
  displayName: z.object({ eq: z.string().optional(), contains: z.string().optional() }).partial().optional(),
  updatedAt: z.object({ gte: z.union([z.string(), z.date()]).optional(), lte: z.union([z.string(), z.date()]).optional() }).partial().optional(),
}).partial();

export const ZAdminListQuery = z.object({
  cursor: ZCursor.optional(),
  limit: z.coerce.number().int().positive().max(500).default(50),
  sort: z.string().optional(),
  filters: ZAdminUserFilters.optional(),
});

export const ZAdminStatsQuery = z.object({
  filters: ZAdminUserFilters.optional(),
});

export const usersContract = c.router({
  // Admin: memberships by user (for admin detail page)
  adminMembershipsByUser: withMeta({
    method: 'GET',
    path: '/api/rest/v1/admin/users/:id/memberships',
    pathParams: z.object({ id: z.string().min(1) }),
    query: z.object({ cursor: ZCursor.optional(), limit: ZLimitCoerce }),
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
    summary: 'Admin: memberships for a user',
  }, defineOpMeta({
    op: 'admin.users.memberships',
    requireUser: true,
    requireSuperAdmin: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'listMyMemberships',
      zodQuery: { importPath: '@unisane/kernel', name: 'ZSeekPageQuery' },
      invoke: 'object',
      callArgs: [
        { name: 'userId', from: 'params', key: 'id' },
        { name: 'limit', from: 'query', key: 'limit' },
        { name: 'cursor', from: 'query', key: 'cursor', optional: true },
      ],
      requireSuperAdmin: true,
    },
  })),

  // Admin: stats (total count + facets) with filter support
  adminStats: withMeta(
    {
      method: "GET",
      path: "/api/rest/v1/admin/users/stats",
      query: z.object({
        filters: ZAdminUserFilters.optional(),
      }),
      responses: {
        200: z.object({
          ok: z.literal(true),
          data: z.object({
            total: z.number(),
            facets: z.object({
              globalRole: z.record(z.number()),
            }),
          }),
        }),
      },
      summary: "Admin users stats",
    },
    defineOpMeta({
      op: "admin.users.stats",
      requireUser: true,
      requireSuperAdmin: true,
      service: {
        importPath: "@unisane/identity",
        fn: "getAdminUsersStats",
        zodQuery: {
          importPath: "./users.contract",
          name: "ZAdminStatsQuery",
        },
        filtersSchema: { importPath: "./users.contract", name: "ZAdminUserFilters" },
        invoke: "object",
        callArgs: [
          { name: "filters", from: "query", key: "filters", optional: true },
        ],
        requireSuperAdmin: true,
      },
    })
  ),
  // Admin: facets for sidebar filters
  adminFacets: withMeta({
    method: 'GET',
    path: '/api/rest/v1/admin/users/facets',
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ hasRole: z.object({ withRole: z.number(), withoutRole: z.number() }), roles: z.record(z.number()) }) }) },
    summary: 'Admin users facets',
  }, defineOpMeta({
    op: 'admin.users.facets',
    requireUser: true,
    requireSuperAdmin: true,
    service: { importPath: '@unisane/identity', fn: 'usersFacets', requireSuperAdmin: true },
  })),

  // Admin: platform-wide users list
  adminList: withMeta({
    method: 'GET',
    path: '/api/rest/v1/admin/users',
    query: ZAdminListQuery,
    responses: {
      200: z.object({ ok: z.literal(true), data: z.object({ items: z.array(ZUserOut), nextCursor: z.string().optional(), prevCursor: z.string().optional() }) }),
    },
    summary: 'Admin users list',
  }, defineOpMeta({
    op: 'admin.users.list',
    requireUser: true,
    requireSuperAdmin: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'listUsers',
      zodQuery: { importPath: './users.contract', name: 'ZAdminListQuery' },
      invoke: 'object',
      listKind: 'admin',
      filtersSchema: { importPath: './users.contract', name: 'ZAdminUserFilters' },
      callArgs: [
        { name: 'limit', from: 'query', key: 'limit' },
        { name: 'cursor', from: 'query', key: 'cursor', optional: true },
        { name: 'sort', from: 'query', key: 'sort', optional: true },
        { name: 'filters', from: 'query', key: 'filters', optional: true },
      ],
      requireSuperAdmin: true,
    },
  })),

  // Admin: enriched single user by id
  adminRead: withMeta({
    method: 'GET',
    path: '/api/rest/v1/admin/users/:id',
    pathParams: z.object({ id: z.string().min(1) }),
    responses: {
      200: z.object({
        ok: z.literal(true),
        data: z
          .object({
            id: z.string(),
            email: z.string().email(),
            displayName: z.string().nullable(),
            imageUrl: z.string().url().nullable(),
            username: z.string().nullable().optional(),
            firstName: z.string().nullable().optional(),
            lastName: z.string().nullable().optional(),
            phone: z.string().nullable().optional(),
            emailVerified: z.boolean().nullable().optional(),
            phoneVerified: z.boolean().nullable().optional(),
            locale: z.string().nullable().optional(),
            timezone: z.string().nullable().optional(),
            role: z.string().nullable().optional(),
            tenantsCount: z.number().optional(),
            adminTenantsCount: z.number().optional(),
            apiKeysCreatedCount: z.number().optional(),
            lastActivityAt: z.string().datetime().nullable().optional(),
            sessionsRevokedAt: z.string().datetime().nullable().optional(),
          })
          .nullable(),
      }),
    },
    summary: 'Admin user read (enriched)',
  }, defineOpMeta({
    op: 'admin.users.read',
    requireUser: true,
    requireSuperAdmin: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'readAdminUser',
      invoke: 'object',
      callArgs: [
        { name: 'userId', from: 'params', key: 'id' },
      ],
      requireSuperAdmin: true,
    },
  })),

  usernameAvailable: withMeta({
    method: 'GET',
    path: '/api/rest/v1/users/availability/username',
    query: z.object({ value: z.string().min(1) }),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ available: z.boolean() }) }) },
    summary: 'Check username availability',
  }, defineOpMeta({
    op: 'users.usernameAvailable',
    allowUnauthed: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'isUsernameAvailable',
      zodQuery: { importPath: './users.contract', name: 'ZAvailabilityQuery' },
      invoke: 'object',
      callArgs: [
        { name: 'value', from: 'query', key: 'value' },
      ],
    },
  })),
  phoneAvailable: withMeta({
    method: 'GET',
    path: '/api/rest/v1/users/availability/phone',
    query: z.object({ value: z.string().min(1) }),
    responses: { 200: z.object({ ok: z.literal(true), data: z.object({ available: z.boolean() }) }) },
    summary: 'Check phone availability (E.164)',
  }, defineOpMeta({
    op: 'users.phoneAvailable',
    allowUnauthed: true,
    service: {
      importPath: '@unisane/identity',
      fn: 'isPhoneAvailable',
      zodQuery: { importPath: './users.contract', name: 'ZAvailabilityQuery' },
      invoke: 'object',
      callArgs: [
        { name: 'value', from: 'query', key: 'value' },
      ],
    },
  })),
});

// Local reusable query schema for availability checks
export const ZAvailabilityQuery = z.object({ value: z.string().min(1) });
