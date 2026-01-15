/**
 * Database Port Tests
 *
 * Tests for the database abstraction layer including:
 * - Memory adapter CRUD operations
 * - Transaction support with session passing
 * - Rollback behavior on errors
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  MemoryDatabaseProvider,
  clearMemoryStorage,
  type BaseRecord,
} from '../database/port';

interface TestRecord extends BaseRecord {
  name: string;
  value: number;
}

describe('MemoryDatabaseProvider', () => {
  let provider: MemoryDatabaseProvider;

  beforeEach(() => {
    clearMemoryStorage();
    provider = new MemoryDatabaseProvider();
  });

  describe('collection operations', () => {
    it('should create and retrieve a record', async () => {
      const collection = provider.collection<TestRecord>('test');

      const result = await collection.create({ name: 'test1', value: 42 });

      expect(result.id).toBeDefined();
      expect(result.data.name).toBe('test1');
      expect(result.data.value).toBe(42);

      const found = await collection.findById(result.id);
      expect(found).not.toBeNull();
      expect(found?.name).toBe('test1');
    });

    it('should update a record', async () => {
      const collection = provider.collection<TestRecord>('test');
      const { id } = await collection.create({ name: 'original', value: 1 });

      const updateResult = await collection.updateById(id, {
        $set: { name: 'updated', value: 100 },
      });

      expect(updateResult.modifiedCount).toBe(1);
      expect(updateResult.data?.name).toBe('updated');
      expect(updateResult.data?.value).toBe(100);
    });

    it('should soft delete a record', async () => {
      const collection = provider.collection<TestRecord>('test');
      const { id } = await collection.create({ name: 'to-delete', value: 0 });

      await collection.softDelete(id);

      // Should not find by default
      const notFound = await collection.findById(id);
      expect(notFound).toBeNull();

      // Should find with includeSoftDeleted
      const found = await collection.findById(id, { includeSoftDeleted: true });
      expect(found).not.toBeNull();
      expect(found?.deletedAt).not.toBeNull();
    });
  });

  describe('transaction session support', () => {
    it('should accept session parameter in create', async () => {
      const collection = provider.collection<TestRecord>('test');
      const session = await provider.startTransaction();

      // Session is accepted (no-op for memory, but ensures interface compliance)
      const result = await collection.create(
        { name: 'with-session', value: 1 },
        { session }
      );

      expect(result.id).toBeDefined();
      await provider.commitTransaction(session);
    });

    it('should accept session parameter in find operations', async () => {
      const collection = provider.collection<TestRecord>('test');
      const { id } = await collection.create({ name: 'test', value: 1 });
      const session = await provider.startTransaction();

      const found = await collection.findById(id, { session });
      expect(found).not.toBeNull();

      const foundOne = await collection.findOne({ name: 'test' }, { session });
      expect(foundOne).not.toBeNull();

      const foundMany = await collection.findMany({}, { session });
      expect(foundMany.data.length).toBeGreaterThan(0);

      await provider.commitTransaction(session);
    });

    it('should accept session parameter in update operations', async () => {
      const collection = provider.collection<TestRecord>('test');
      const { id } = await collection.create({ name: 'test', value: 1 });
      const session = await provider.startTransaction();

      const result = await collection.updateById(
        id,
        { $set: { value: 2 } },
        { session }
      );
      expect(result.modifiedCount).toBe(1);

      await provider.commitTransaction(session);
    });

    it('should accept session parameter in delete operations', async () => {
      const collection = provider.collection<TestRecord>('test');
      const { id } = await collection.create({ name: 'test', value: 1 });
      const session = await provider.startTransaction();

      await collection.softDelete(id, { session });
      await collection.hardDelete(id, { session });

      await provider.commitTransaction(session);
    });

    it('should accept session parameter in count and exists', async () => {
      const collection = provider.collection<TestRecord>('test');
      await collection.create({ name: 'test', value: 1 });
      const session = await provider.startTransaction();

      const count = await collection.count({}, { session });
      expect(count).toBe(1);

      const exists = await collection.exists({ name: 'test' }, { session });
      expect(exists).toBe(true);

      await provider.commitTransaction(session);
    });
  });

  describe('withTransaction helper', () => {
    it('should execute operations within transaction context', async () => {
      const collection = provider.collection<TestRecord>('test');

      const result = await provider.withTransaction(async (session) => {
        const created = await collection.create(
          { name: 'transactional', value: 42 },
          { session }
        );
        return created;
      });

      expect(result.id).toBeDefined();
      expect(result.data.name).toBe('transactional');
    });

    it('should handle errors in transaction callback', async () => {
      const collection = provider.collection<TestRecord>('test');

      await expect(
        provider.withTransaction(async (session) => {
          await collection.create({ name: 'will-fail', value: 1 }, { session });
          throw new Error('Simulated failure');
        })
      ).rejects.toThrow('Simulated failure');
    });
  });

  describe('health check', () => {
    it('should return healthy status', async () => {
      const health = await provider.health();
      expect(health.ok).toBe(true);
      expect(health.latencyMs).toBe(0);
    });
  });
});
