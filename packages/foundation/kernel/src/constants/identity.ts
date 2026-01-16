import { z } from 'zod';

export const GLOBAL_ROLES = ['super_admin', 'support_admin'] as const;
export type GlobalRole = (typeof GLOBAL_ROLES)[number];
export const ZGlobalRole = z.enum(GLOBAL_ROLES);

/**
 * Reasons for user deletion.
 * Used in user.deleted events and delete user operations.
 */
export const USER_DELETION_REASONS = ['user_request', 'admin_action', 'gdpr_compliance', 'inactive'] as const;
export type UserDeletionReason = (typeof USER_DELETION_REASONS)[number];
export const ZUserDeletionReason = z.enum(USER_DELETION_REASONS);

/**
 * Reasons for membership removal.
 * Used in membership.removed events.
 */
export const MEMBERSHIP_REMOVAL_REASONS = ['left', 'removed', 'transferred'] as const;
export type MembershipRemovalReason = (typeof MEMBERSHIP_REMOVAL_REASONS)[number];
export const ZMembershipRemovalReason = z.enum(MEMBERSHIP_REMOVAL_REASONS);
