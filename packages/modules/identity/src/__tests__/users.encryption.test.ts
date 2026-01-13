/**
 * Users Repository - PII Encryption Tests
 *
 * Tests for email and phone encryption functionality in the users repository.
 * These tests verify that:
 * 1. PII fields are encrypted when DATA_ENCRYPTION_KEY is set
 * 2. SearchToken lookups work correctly
 * 3. Decryption returns correct plaintext values
 *
 * Note: Integration tests that require MongoDB are marked as skip until
 * proper test database setup is in place (see ISSUES-ROADMAP Phase 2).
 */

import { describe, it, expect, beforeAll, afterEach } from "vitest";
import {
  encryptField,
  decryptField,
  createSearchToken,
  parseEncryptionKey,
  generateEncryptionKey,
} from "@unisane/kernel";

describe("Users Repository - PII Encryption", () => {
  const originalEnvKey = process.env.DATA_ENCRYPTION_KEY;

  beforeAll(() => {
    // Set up test encryption key
    if (!process.env.DATA_ENCRYPTION_KEY) {
      process.env.DATA_ENCRYPTION_KEY = generateEncryptionKey();
    }
  });

  afterEach(() => {
    // Restore original key
    if (originalEnvKey) {
      process.env.DATA_ENCRYPTION_KEY = originalEnvKey;
    } else {
      delete process.env.DATA_ENCRYPTION_KEY;
    }
  });

  // Integration tests - require MongoDB connection
  // These will be enabled in Phase 2 when test infrastructure is set up
  describe.skip("Email Encryption - Integration", () => {
    it("should create user with encrypted email when encryption key is set", async () => {
      const testEmail = "test-encrypt@example.com";

      const user = await mongoUsersRepository.create({
        email: testEmail,
        displayName: "Test User",
      });

      // User object returned should have decrypted email
      expect(user.email).toBe(testEmail);

      // Verify we can find by email using searchToken
      const foundUser = await mongoUsersRepository.findByEmail(testEmail);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.email).toBe(testEmail);
      expect(foundUser?.id).toBe(user.id);
    });

    it("should find user by email (case-insensitive) when encrypted", async () => {
      const testEmail = "CaseSensitive@Example.COM";

      const user = await mongoUsersRepository.create({
        email: testEmail,
        displayName: "Case Test",
      });

      // Should find with lowercase
      const found1 = await mongoUsersRepository.findByEmail(
        testEmail.toLowerCase()
      );
      expect(found1).not.toBeNull();
      expect(found1?.id).toBe(user.id);

      // Should find with original case
      const found2 = await mongoUsersRepository.findByEmail(testEmail);
      expect(found2).not.toBeNull();
      expect(found2?.id).toBe(user.id);
    });

    it("should update email and re-encrypt", async () => {
      const originalEmail = "original@example.com";
      const updatedEmail = "updated@example.com";

      const user = await mongoUsersRepository.create({
        email: originalEmail,
        displayName: "Update Test",
      });

      // Update email
      const updated = await mongoUsersRepository.updateById(user.id, {
        email: updatedEmail,
      });

      expect(updated?.email).toBe(updatedEmail);

      // Should find with new email
      const found = await mongoUsersRepository.findByEmail(updatedEmail);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);

      // Should NOT find with old email
      const notFound = await mongoUsersRepository.findByEmail(originalEmail);
      expect(notFound).toBeNull();
    });
  });

  describe.skip("Phone Encryption - Integration", () => {
    it("should create user with encrypted phone when encryption key is set", async () => {
      const testPhone = "+1234567890";

      const user = await mongoUsersRepository.create({
        email: "phone-test@example.com",
        phone: testPhone,
        displayName: "Phone Test",
      });

      // User object returned should have decrypted phone
      expect(user.phone).toBe(testPhone);

      // Verify we can find by phone using searchToken
      const foundUser = await mongoUsersRepository.findByPhone(testPhone);
      expect(foundUser).not.toBeNull();
      expect(foundUser?.phone).toBe(testPhone);
      expect(foundUser?.id).toBe(user.id);
    });

    it("should update phone and re-encrypt", async () => {
      const originalPhone = "+1111111111";
      const updatedPhone = "+2222222222";

      const user = await mongoUsersRepository.create({
        email: "phone-update@example.com",
        phone: originalPhone,
        displayName: "Phone Update Test",
      });

      // Update phone
      const updated = await mongoUsersRepository.updateById(user.id, {
        phone: updatedPhone,
      });

      expect(updated?.phone).toBe(updatedPhone);

      // Should find with new phone
      const found = await mongoUsersRepository.findByPhone(updatedPhone);
      expect(found).not.toBeNull();
      expect(found?.id).toBe(user.id);

      // Should NOT find with old phone
      const notFound = await mongoUsersRepository.findByPhone(originalPhone);
      expect(notFound).toBeNull();
    });

    it("should handle null phone (clear phone)", async () => {
      const testPhone = "+3333333333";

      const user = await mongoUsersRepository.create({
        email: "phone-clear@example.com",
        phone: testPhone,
        displayName: "Phone Clear Test",
      });

      // Clear phone
      const updated = await mongoUsersRepository.updateById(user.id, {
        phone: null,
      });

      expect(updated?.phone).toBeNull();

      // Should NOT find with old phone
      const notFound = await mongoUsersRepository.findByPhone(testPhone);
      expect(notFound).toBeNull();
    });
  });

  describe("Encryption Utilities", () => {
    it("should encrypt and decrypt field correctly", () => {
      const plaintext = "sensitive-data@example.com";
      const key = parseEncryptionKey(generateEncryptionKey());

      const encrypted = encryptField(plaintext, key);
      expect(encrypted).not.toBe(plaintext);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = decryptField(encrypted, key);
      expect(decrypted).toBe(plaintext);
    });

    it("should create deterministic search tokens", () => {
      const plaintext = "test@example.com";
      const key = parseEncryptionKey(generateEncryptionKey());

      const token1 = createSearchToken(plaintext, key);
      const token2 = createSearchToken(plaintext, key);

      // Same input should produce same token (deterministic)
      expect(token1).toBe(token2);
      expect(token1).not.toBe(plaintext);
    });

    it("should create different search tokens for different inputs", () => {
      const key = parseEncryptionKey(generateEncryptionKey());

      const token1 = createSearchToken("test1@example.com", key);
      const token2 = createSearchToken("test2@example.com", key);

      expect(token1).not.toBe(token2);
    });
  });

  describe.skip("Backward Compatibility - Integration", () => {
    it("should handle users created before encryption (migration scenario)", async () => {
      // This test simulates the migration scenario where:
      // 1. User was created before encryption (plaintext fields)
      // 2. Migration runs and adds encrypted fields
      // 3. Repository should still work correctly

      // Note: This is a conceptual test - actual migration testing should be done
      // separately. This test verifies the repository handles both encrypted
      // and plaintext fields gracefully.

      // When DATA_ENCRYPTION_KEY is not set, repository uses plaintext lookups
      // When DATA_ENCRYPTION_KEY is set, repository uses encrypted lookups

      const testEmail = "migration-test@example.com";

      // Create user (will be encrypted if key is set)
      const user = await mongoUsersRepository.create({
        email: testEmail,
        displayName: "Migration Test",
      });

      expect(user.email).toBe(testEmail);

      // Should be able to find by email regardless of encryption state
      const found = await mongoUsersRepository.findByEmail(testEmail);
      expect(found).not.toBeNull();
      expect(found?.email).toBe(testEmail);
    });
  });
});
