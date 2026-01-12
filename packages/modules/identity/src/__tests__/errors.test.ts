/**
 * Identity Errors Tests
 *
 * Tests for identity-specific error classes and utilities.
 */

import { describe, it, expect } from 'vitest';
import { DomainError, ErrorCode } from '@unisane/kernel';
import {
  isDuplicateKeyError,
  UserNotFoundError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  PhoneAlreadyExistsError,
  ApiKeyNotFoundError,
  ApiKeyRevokedError,
  ApiKeyLimitExceededError,
  MembershipNotFoundError,
  InsufficientRoleError,
  InvalidEmailError,
  InvalidPhoneError,
  ProfileIncompleteError,
} from '../domain/errors';

describe('isDuplicateKeyError()', () => {
  it('should detect MongoDB duplicate key error (code 11000)', () => {
    const mongoError = { code: 11000, message: 'duplicate key error' };
    expect(isDuplicateKeyError(mongoError)).toBe(true);
  });

  it('should detect MySQL duplicate key error (ER_DUP_ENTRY)', () => {
    const mysqlError = { code: 'ER_DUP_ENTRY', message: 'Duplicate entry' };
    expect(isDuplicateKeyError(mysqlError)).toBe(true);
  });

  it('should detect MySQL duplicate key error (case insensitive)', () => {
    const mysqlError = { code: 'er_dup_entry', message: 'Duplicate entry' };
    expect(isDuplicateKeyError(mysqlError)).toBe(true);
  });

  it('should detect MySQL duplicate key error (errno 1062)', () => {
    const mysqlError = { errno: 1062, message: 'Duplicate entry' };
    expect(isDuplicateKeyError(mysqlError)).toBe(true);
  });

  it('should return false for non-duplicate errors', () => {
    const otherErrors = [
      { code: 404, message: 'Not found' },
      { code: 'OTHER_ERROR', message: 'Other error' },
      { errno: 1000, message: 'Some error' },
      new Error('Regular error'),
      { message: 'No code' },
    ];

    for (const error of otherErrors) {
      expect(isDuplicateKeyError(error)).toBe(false);
    }
  });

  it('should return false for null/undefined', () => {
    expect(isDuplicateKeyError(null)).toBe(false);
    expect(isDuplicateKeyError(undefined)).toBe(false);
  });

  it('should return false for non-objects', () => {
    expect(isDuplicateKeyError('error string')).toBe(false);
    expect(isDuplicateKeyError(123)).toBe(false);
    expect(isDuplicateKeyError(true)).toBe(false);
  });
});

describe('UserNotFoundError', () => {
  it('should have correct status and code', () => {
    const error = new UserNotFoundError('user_123');

    expect(error.status).toBe(404);
    expect(error.code).toBe(ErrorCode.USER_NOT_FOUND);
    expect(error.name).toBe('UserNotFoundError');
  });

  it('should include identifier in message', () => {
    const error = new UserNotFoundError('user_123');
    expect(error.message).toBe('User not found by id: user_123');
  });

  it('should support different field types', () => {
    const byId = new UserNotFoundError('user_123', 'id');
    const byEmail = new UserNotFoundError('user@example.com', 'email');
    const byUsername = new UserNotFoundError('johndoe', 'username');

    expect(byId.message).toContain('by id');
    expect(byEmail.message).toContain('by email');
    expect(byUsername.message).toContain('by username');
  });

  it('should be instanceof DomainError', () => {
    const error = new UserNotFoundError('user_123');
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(Error);
  });
});

describe('EmailAlreadyExistsError', () => {
  it('should have correct status and code', () => {
    const error = new EmailAlreadyExistsError('user@example.com');

    expect(error.status).toBe(409);
    expect(error.code).toBe(ErrorCode.EMAIL_EXISTS);
    expect(error.name).toBe('EmailAlreadyExistsError');
  });

  it('should include email in message', () => {
    const error = new EmailAlreadyExistsError('user@example.com');
    expect(error.message).toContain('user@example.com');
    expect(error.message).toContain('already exists');
  });
});

describe('UsernameAlreadyExistsError', () => {
  it('should have correct status and code', () => {
    const error = new UsernameAlreadyExistsError('johndoe');

    expect(error.status).toBe(409);
    expect(error.code).toBe(ErrorCode.USERNAME_EXISTS);
    expect(error.name).toBe('UsernameAlreadyExistsError');
  });

  it('should include username in message', () => {
    const error = new UsernameAlreadyExistsError('johndoe');
    expect(error.message).toContain('johndoe');
    expect(error.message).toContain('already taken');
  });
});

describe('PhoneAlreadyExistsError', () => {
  it('should have correct status and code', () => {
    const error = new PhoneAlreadyExistsError('+14155550123');

    expect(error.status).toBe(409);
    expect(error.code).toBe(ErrorCode.PHONE_EXISTS);
    expect(error.name).toBe('PhoneAlreadyExistsError');
  });

  it('should not include phone in message (privacy)', () => {
    const error = new PhoneAlreadyExistsError('+14155550123');
    expect(error.message).not.toContain('+14155550123');
    expect(error.message).toContain('already registered');
  });
});

describe('ApiKeyNotFoundError', () => {
  it('should have correct status and code', () => {
    const error = new ApiKeyNotFoundError('key_123');

    expect(error.status).toBe(404);
    expect(error.code).toBe(ErrorCode.NOT_FOUND);
    expect(error.name).toBe('ApiKeyNotFoundError');
  });

  it('should include key ID in message', () => {
    const error = new ApiKeyNotFoundError('key_123');
    expect(error.message).toContain('key_123');
  });
});

describe('ApiKeyRevokedError', () => {
  it('should have correct status and code', () => {
    const error = new ApiKeyRevokedError('key_123');

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.INVALID_API_KEY);
    expect(error.name).toBe('ApiKeyRevokedError');
  });

  it('should include key ID in message', () => {
    const error = new ApiKeyRevokedError('key_123');
    expect(error.message).toContain('key_123');
    expect(error.message).toContain('revoked');
  });
});

describe('ApiKeyLimitExceededError', () => {
  it('should have correct status and code', () => {
    const error = new ApiKeyLimitExceededError(10);

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.API_KEY_LIMIT);
    expect(error.name).toBe('ApiKeyLimitExceededError');
  });

  it('should include limit in message', () => {
    const error = new ApiKeyLimitExceededError(10);
    expect(error.message).toContain('10');
    expect(error.message).toContain('limit exceeded');
  });
});

describe('MembershipNotFoundError', () => {
  it('should have correct status and code', () => {
    const error = new MembershipNotFoundError('tenant_123', 'user_456');

    expect(error.status).toBe(404);
    expect(error.code).toBe(ErrorCode.MEMBER_NOT_FOUND);
    expect(error.name).toBe('MembershipNotFoundError');
  });

  it('should include tenant and user IDs in message', () => {
    const error = new MembershipNotFoundError('tenant_123', 'user_456');
    expect(error.message).toContain('tenant_123');
    expect(error.message).toContain('user_456');
  });
});

describe('InsufficientRoleError', () => {
  it('should have correct status and code', () => {
    const error = new InsufficientRoleError('admin');

    expect(error.status).toBe(403);
    expect(error.code).toBe(ErrorCode.PERMISSION_DENIED);
    expect(error.name).toBe('InsufficientRoleError');
  });

  it('should include required role in message', () => {
    const error = new InsufficientRoleError('admin');
    expect(error.message).toContain('admin');
    expect(error.message).toContain('Required role');
  });
});

describe('InvalidEmailError', () => {
  it('should have correct status and code', () => {
    const error = new InvalidEmailError('invalid-email');

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCode.INVALID_EMAIL);
    expect(error.name).toBe('InvalidEmailError');
  });

  it('should include email in message', () => {
    const error = new InvalidEmailError('invalid-email');
    expect(error.message).toContain('invalid-email');
  });
});

describe('InvalidPhoneError', () => {
  it('should have correct status and code', () => {
    const error = new InvalidPhoneError('12345');

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(error.name).toBe('InvalidPhoneError');
  });

  it('should include phone in message', () => {
    const error = new InvalidPhoneError('12345');
    expect(error.message).toContain('12345');
  });
});

describe('ProfileIncompleteError', () => {
  it('should have correct status and code', () => {
    const error = new ProfileIncompleteError(['email', 'displayName']);

    expect(error.status).toBe(400);
    expect(error.code).toBe(ErrorCode.PROFILE_INCOMPLETE);
    expect(error.name).toBe('ProfileIncompleteError');
  });

  it('should include missing fields in message', () => {
    const error = new ProfileIncompleteError(['email', 'displayName']);
    expect(error.message).toContain('email');
    expect(error.message).toContain('displayName');
    expect(error.message).toContain('Missing fields');
  });

  it('should handle single missing field', () => {
    const error = new ProfileIncompleteError(['email']);
    expect(error.message).toContain('email');
  });
});

describe('Error HTTP Status Codes', () => {
  it('should use correct HTTP status codes for each error type', () => {
    const statusMap = [
      [new UserNotFoundError('id'), 404],
      [new EmailAlreadyExistsError('email'), 409],
      [new UsernameAlreadyExistsError('username'), 409],
      [new PhoneAlreadyExistsError('phone'), 409],
      [new ApiKeyNotFoundError('key'), 404],
      [new ApiKeyRevokedError('key'), 403],
      [new ApiKeyLimitExceededError(10), 403],
      [new MembershipNotFoundError('tenant', 'user'), 404],
      [new InsufficientRoleError('admin'), 403],
      [new InvalidEmailError('email'), 400],
      [new InvalidPhoneError('phone'), 400],
      [new ProfileIncompleteError(['field']), 400],
    ] as const;

    for (const [error, expectedStatus] of statusMap) {
      expect(error.status).toBe(expectedStatus);
    }
  });
});

describe('Error toJSON()', () => {
  it('should serialize errors correctly', () => {
    const error = new UserNotFoundError('user_123', 'email');
    const json = error.toJSON();

    expect(json.code).toBe(ErrorCode.USER_NOT_FOUND);
    expect(json.message).toContain('user_123');
    expect(json.status).toBe(404);
  });
});
