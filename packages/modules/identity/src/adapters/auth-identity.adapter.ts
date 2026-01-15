/**
 * Auth-Identity Adapter
 *
 * Implementation of AuthIdentityPort for the identity module.
 * This adapter is registered at app bootstrap to allow auth module
 * to interact with identity without direct coupling.
 */

import type {
  AuthIdentityPort,
  AuthUserRef,
  AuthCreateUserInput,
  AuthUpdateUserInput,
} from "@unisane/kernel";
import {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserByPhone,
  updateUserById,
  ensureUserByEmail as ensureUserByEmailService,
  getUserId,
} from "../service/users";
import { usersRepository, membershipsRepository } from "../data/repo";

/**
 * Maps internal user row to AuthUserRef.
 * Handles null values from the database by converting them to undefined.
 */
function toAuthUserRef(
  user: { id: string; email?: string | null; phone?: string | null; displayName?: string | null } | null
): AuthUserRef | null {
  if (!user) return null;
  return {
    id: user.id,
    emailNorm: user.email ?? undefined,
    phoneNorm: user.phone ?? undefined,
    displayName: user.displayName,
  };
}

/**
 * Auth-Identity adapter implementation.
 */
export const authIdentityAdapter: AuthIdentityPort = {
  // User lookup functions
  async findUserByEmail(emailNorm: string): Promise<AuthUserRef | null> {
    const user = await findUserByEmail(emailNorm);
    return toAuthUserRef(user);
  },

  async findUserByPhone(phoneNorm: string): Promise<AuthUserRef | null> {
    const user = await findUserByPhone(phoneNorm);
    return toAuthUserRef(user);
  },

  async findUserByUsername(username: string): Promise<AuthUserRef | null> {
    const user = await findUserByUsername(username);
    return toAuthUserRef(user);
  },

  // User creation
  async createUser(input: AuthCreateUserInput): Promise<{ id: string }> {
    const result = await createUser({
      email: input.email,
      displayName: input.displayName,
      username: input.username,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      locale: input.locale,
      timezone: input.timezone,
    });
    return { id: result.id };
  },

  // User updates
  async updateUserById(
    userId: string,
    input: AuthUpdateUserInput
  ): Promise<void> {
    await updateUserById(userId, {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.phoneVerified !== undefined ? { phoneVerified: input.phoneVerified } : {}),
      ...(input.authUserId !== undefined ? { authUserId: input.authUserId } : {}),
    });
  },

  // Ensure user exists
  async ensureUserByEmail(
    emailNorm: string,
    opts?: { createIfMissing?: boolean }
  ): Promise<string> {
    // ensureUserByEmail already normalizes, but we pass the normalized version
    return ensureUserByEmailService(emailNorm);
  },

  // Utility
  getUserId(user: AuthUserRef): string {
    return getUserId(user);
  },

  // Repository access for phone verification flows
  async findUserByPhoneNorm(phoneNorm: string): Promise<AuthUserRef | null> {
    const user = await usersRepository.findByPhone(phoneNorm);
    return toAuthUserRef(user);
  },

  async updateUserPhoneVerified(
    userId: string,
    verified: boolean
  ): Promise<void> {
    await usersRepository.updateById(userId, { phoneVerified: verified });
  },

  // Membership access for phone verification
  async findMembershipByUserAndTenant(
    userId: string,
    tenantId: string
  ): Promise<{ id: string } | null> {
    // membershipsRepository.findByScopeAndUser takes (scopeId, userId)
    const membership = await membershipsRepository.findByScopeAndUser(tenantId, userId);
    if (!membership) return null;
    // Membership uses composite key (scopeId, userId), return scopeId as id
    return { id: membership.scopeId };
  },
};
