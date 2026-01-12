/**
 * Webhooks Schemas Tests
 *
 * Tests for Zod validation schemas in the webhooks module.
 */

import { describe, it, expect } from 'vitest';
import { ZListWebhookEventsQuery } from '../domain/schemas';

describe('ZListWebhookEventsQuery', () => {
  describe('valid data', () => {
    it('should accept empty query with defaults', () => {
      const result = ZListWebhookEventsQuery.safeParse({});

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20); // default from ZLimitCoerce
      }
    });

    it('should accept cursor string', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        cursor: 'abc123xyz789',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('abc123xyz789');
      }
    });

    it('should accept custom limit', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        limit: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(50);
      }
    });

    it('should accept direction "in"', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        direction: 'in',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.direction).toBe('in');
      }
    });

    it('should accept direction "out"', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        direction: 'out',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.direction).toBe('out');
      }
    });

    it('should accept status filter', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        status: 'failed',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('failed');
      }
    });

    it('should accept all parameters', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        cursor: 'cursor_abc123',
        limit: 100,
        direction: 'out',
        status: 'delivered',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.cursor).toBe('cursor_abc123');
        expect(result.data.limit).toBe(100);
        expect(result.data.direction).toBe('out');
        expect(result.data.status).toBe('delivered');
      }
    });

    it('should coerce string limit to number', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        limit: '75',
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(75);
      }
    });
  });

  describe('invalid data', () => {
    it('should reject invalid direction', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        direction: 'both',
      });

      expect(result.success).toBe(false);
    });

    it('should reject limit over maximum (200)', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        limit: 201,
      });

      expect(result.success).toBe(false);
    });

    it('should reject limit of 0', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        limit: 0,
      });

      expect(result.success).toBe(false);
    });

    it('should reject negative limit', () => {
      const result = ZListWebhookEventsQuery.safeParse({
        limit: -10,
      });

      expect(result.success).toBe(false);
    });
  });
});
