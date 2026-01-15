/**
 * Crypto Module Tests
 *
 * Tests for cryptographic utilities: hashing, encryption, password handling.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  sha256Hex,
  randomDigits,
  randomToken,
  scryptHashPassword,
  scryptVerifyPassword,
  encryptField,
  decryptField,
  createSearchToken,
  generateEncryptionKey,
  parseEncryptionKey,
} from '../utils/crypto';

describe('sha256Hex()', () => {
  it('should hash string input', () => {
    const hash = sha256Hex('hello');
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should hash Buffer input', () => {
    const hash = sha256Hex(Buffer.from('hello'));
    expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
  });

  it('should produce 64-character hex string', () => {
    const hash = sha256Hex('test');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('should produce different hashes for different inputs', () => {
    const hash1 = sha256Hex('input1');
    const hash2 = sha256Hex('input2');
    expect(hash1).not.toBe(hash2);
  });

  it('should produce same hash for same input', () => {
    const hash1 = sha256Hex('consistent');
    const hash2 = sha256Hex('consistent');
    expect(hash1).toBe(hash2);
  });
});

describe('randomDigits()', () => {
  it('should generate 6 digits by default', () => {
    const code = randomDigits();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^\d{6}$/);
  });

  it('should generate specified number of digits', () => {
    const code4 = randomDigits(4);
    const code8 = randomDigits(8);

    expect(code4).toHaveLength(4);
    expect(code8).toHaveLength(8);
    expect(code4).toMatch(/^\d{4}$/);
    expect(code8).toMatch(/^\d{8}$/);
  });

  it('should generate different codes each time', () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(randomDigits());
    }
    // With 6 digits (1M possibilities), 100 samples should all be unique
    expect(codes.size).toBe(100);
  });

  it('should handle edge cases', () => {
    const code1 = randomDigits(1);
    expect(code1).toHaveLength(1);
    expect(code1).toMatch(/^\d$/);

    const code10 = randomDigits(10);
    expect(code10).toHaveLength(10);
  });
});

describe('randomToken()', () => {
  it('should generate 32-byte token by default', () => {
    const token = randomToken();
    // Base64url encoding: 32 bytes = 43 characters (no padding)
    expect(token.length).toBeGreaterThanOrEqual(42);
  });

  it('should generate base64url-encoded string', () => {
    const token = randomToken();
    // Base64url uses only alphanumeric, -, and _
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('should generate specified byte length', () => {
    const token16 = randomToken(16);
    const token64 = randomToken(64);

    // 16 bytes = ~22 base64url chars, 64 bytes = ~86 chars
    expect(token16.length).toBeLessThan(token64.length);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(randomToken());
    }
    expect(tokens.size).toBe(100);
  });
});

describe('scryptHashPassword() and scryptVerifyPassword()', () => {
  it('should hash password and return components', async () => {
    const result = await scryptHashPassword('mypassword');

    expect(result.algo).toBe('scrypt');
    expect(result.saltB64).toBeDefined();
    expect(result.hashB64).toBeDefined();

    // Salt should be 16 bytes = 24 base64 chars
    const saltBuffer = Buffer.from(result.saltB64, 'base64');
    expect(saltBuffer.length).toBe(16);

    // Hash should be 64 bytes = 88 base64 chars
    const hashBuffer = Buffer.from(result.hashB64, 'base64');
    expect(hashBuffer.length).toBe(64);
  });

  it('should generate different salts for same password', async () => {
    const result1 = await scryptHashPassword('password');
    const result2 = await scryptHashPassword('password');

    expect(result1.saltB64).not.toBe(result2.saltB64);
    expect(result1.hashB64).not.toBe(result2.hashB64);
  });

  it('should verify correct password', async () => {
    const password = 'correctPassword123!';
    const { saltB64, hashB64 } = await scryptHashPassword(password);

    const isValid = await scryptVerifyPassword(password, saltB64, hashB64);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const { saltB64, hashB64 } = await scryptHashPassword('correctPassword');

    const isValid = await scryptVerifyPassword('wrongPassword', saltB64, hashB64);
    expect(isValid).toBe(false);
  });

  it('should reject with tampered salt', async () => {
    const { saltB64, hashB64 } = await scryptHashPassword('password');

    // Generate a different salt
    const differentSalt = Buffer.from('0123456789abcdef').toString('base64');

    const isValid = await scryptVerifyPassword('password', differentSalt, hashB64);
    expect(isValid).toBe(false);
  });

  it('should handle special characters in password', async () => {
    const password = 'p@$$w0rd!#$%^&*()_+-=[]{}|;:\'",.<>?/`~';
    const { saltB64, hashB64 } = await scryptHashPassword(password);

    const isValid = await scryptVerifyPassword(password, saltB64, hashB64);
    expect(isValid).toBe(true);
  });

  it('should handle unicode in password', async () => {
    const password = 'пароль密码🔐';
    const { saltB64, hashB64 } = await scryptHashPassword(password);

    const isValid = await scryptVerifyPassword(password, saltB64, hashB64);
    expect(isValid).toBe(true);
  });

  it('should handle empty password', async () => {
    const password = '';
    const { saltB64, hashB64 } = await scryptHashPassword(password);

    const isValid = await scryptVerifyPassword(password, saltB64, hashB64);
    expect(isValid).toBe(true);

    const isInvalid = await scryptVerifyPassword('not-empty', saltB64, hashB64);
    expect(isInvalid).toBe(false);
  });
});

describe('AES-256-GCM Encryption', () => {
  let testKey: Buffer;

  beforeEach(() => {
    testKey = Buffer.from(generateEncryptionKey(), 'base64');
  });

  describe('encryptField()', () => {
    it('should encrypt plaintext to base64url string', () => {
      const encrypted = encryptField('sensitive data', testKey);

      expect(typeof encrypted).toBe('string');
      // Base64url encoding
      expect(encrypted).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const encrypted1 = encryptField('same data', testKey);
      const encrypted2 = encryptField('same data', testKey);

      expect(encrypted1).not.toBe(encrypted2);
    });

    it('should throw for invalid key length', () => {
      const shortKey = Buffer.from('too short');

      expect(() => encryptField('data', shortKey)).toThrow('32 bytes');
    });

    it('should handle empty string', () => {
      const encrypted = encryptField('', testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe('');
    });

    it('should handle unicode', () => {
      const plaintext = 'Привет мир 🌍 こんにちは';
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });

    it('should handle large data', () => {
      const plaintext = 'x'.repeat(100000);
      const encrypted = encryptField(plaintext, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(plaintext);
    });
  });

  describe('decryptField()', () => {
    it('should decrypt encrypted data', () => {
      const original = 'my secret data';
      const encrypted = encryptField(original, testKey);
      const decrypted = decryptField(encrypted, testKey);

      expect(decrypted).toBe(original);
    });

    it('should throw for wrong key', () => {
      const encrypted = encryptField('data', testKey);
      const wrongKey = Buffer.from(generateEncryptionKey(), 'base64');

      expect(() => decryptField(encrypted, wrongKey)).toThrow();
    });

    it('should throw for tampered ciphertext', () => {
      const encrypted = encryptField('data', testKey);
      // Tamper with the ciphertext
      const tampered = encrypted.slice(0, -5) + 'XXXXX';

      expect(() => decryptField(tampered, testKey)).toThrow();
    });

    it('should throw for truncated ciphertext', () => {
      const encrypted = encryptField('data', testKey);
      // Too short to contain IV + tag
      const truncated = encrypted.slice(0, 10);

      expect(() => decryptField(truncated, testKey)).toThrow('too short');
    });

    it('should throw for invalid key length', () => {
      const encrypted = encryptField('data', testKey);
      const shortKey = Buffer.from('short');

      expect(() => decryptField(encrypted, shortKey)).toThrow('32 bytes');
    });
  });

  describe('createSearchToken()', () => {
    it('should create deterministic token for same input', () => {
      const token1 = createSearchToken('user@example.com', testKey);
      const token2 = createSearchToken('user@example.com', testKey);

      expect(token1).toBe(token2);
    });

    it('should create different tokens for different inputs', () => {
      const token1 = createSearchToken('user1@example.com', testKey);
      const token2 = createSearchToken('user2@example.com', testKey);

      expect(token1).not.toBe(token2);
    });

    it('should create different tokens with different keys', () => {
      const key2 = Buffer.from(generateEncryptionKey(), 'base64');

      const token1 = createSearchToken('same@example.com', testKey);
      const token2 = createSearchToken('same@example.com', key2);

      expect(token1).not.toBe(token2);
    });

    it('should return hex-encoded hash', () => {
      const token = createSearchToken('data', testKey);

      // SHA-256 produces 64 hex characters
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe('generateEncryptionKey()', () => {
    it('should generate base64-encoded 32-byte key', () => {
      const key = generateEncryptionKey();
      const buffer = Buffer.from(key, 'base64');

      expect(buffer.length).toBe(32);
    });

    it('should generate unique keys', () => {
      const keys = new Set<string>();
      for (let i = 0; i < 100; i++) {
        keys.add(generateEncryptionKey());
      }
      expect(keys.size).toBe(100);
    });
  });

  describe('parseEncryptionKey()', () => {
    it('should parse valid base64 key', () => {
      const keyStr = generateEncryptionKey();
      const key = parseEncryptionKey(keyStr);

      expect(key).toBeInstanceOf(Buffer);
      expect(key.length).toBe(32);
    });

    it('should throw for invalid key length', () => {
      const shortKey = Buffer.from('too short').toString('base64');

      expect(() => parseEncryptionKey(shortKey)).toThrow('expected 32 bytes');
    });

    it('should include generation command in error', () => {
      const shortKey = Buffer.from('x').toString('base64');

      expect(() => parseEncryptionKey(shortKey)).toThrow('randomBytes');
    });
  });
});

describe('Encryption Integration', () => {
  it('should work end-to-end for PII encryption pattern', () => {
    const key = parseEncryptionKey(generateEncryptionKey());

    // Simulate encrypting an email for storage
    const email = 'user@example.com';
    const normalizedEmail = email.toLowerCase().trim();

    const record = {
      emailEncrypted: encryptField(email, key),
      emailSearchToken: createSearchToken(normalizedEmail, key),
    };

    // Verify we can decrypt
    const decryptedEmail = decryptField(record.emailEncrypted, key);
    expect(decryptedEmail).toBe(email);

    // Verify we can search
    const searchToken = createSearchToken(normalizedEmail, key);
    expect(searchToken).toBe(record.emailSearchToken);
  });
});
