import { describe, it, expect, vi, beforeEach } from "vitest";
import { SettingsRepoMongo } from "../data/settings.repository.mongo";
import * as kernel from "@unisane/kernel";

// Mock MongoDB collection
const mockFindOne = vi.fn();
const mockFindOneAndUpdate = vi.fn();

vi.mock("@unisane/kernel", async () => {
  const actual = await vi.importActual<typeof kernel>("@unisane/kernel");
  return {
    ...actual,
    col: vi.fn(() => ({
      findOne: mockFindOne,
      findOneAndUpdate: mockFindOneAndUpdate,
    })),
    COLLECTIONS: { SETTINGS: "settings" },
  };
});

describe("Settings Repository (MongoDB)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("findOne", () => {
    it("should find a setting by env, scopeId, namespace, and key", async () => {
      const mockDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "theme",
        value: "dark",
        version: 3,
        updatedBy: "user123",
        updatedAt: new Date("2024-01-15"),
      };

      mockFindOne.mockResolvedValueOnce(mockDoc);

      const result = await SettingsRepoMongo.findOne(
        "test",
        "tenant1",
        "app",
        "theme"
      );

      expect(result).toEqual({
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "theme",
        value: "dark",
        version: 3,
        updatedBy: "user123",
        updatedAt: new Date("2024-01-15"),
      });

      expect(mockFindOne).toHaveBeenCalledWith({
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "theme",
      });
    });

    it("should return null when setting does not exist", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const result = await SettingsRepoMongo.findOne(
        "test",
        "tenant1",
        "app",
        "nonexistent"
      );

      expect(result).toBeNull();
    });

    it("should handle platform-scoped settings with null scopeId", async () => {
      const mockDoc = {
        env: "production",
        scopeId: null,
        namespace: "platform",
        key: "maintenance_mode",
        value: false,
        version: 1,
      };

      mockFindOne.mockResolvedValueOnce(mockDoc);

      const result = await SettingsRepoMongo.findOne(
        "production",
        null,
        "platform",
        "maintenance_mode"
      );

      expect(result).toEqual({
        env: "production",
        scopeId: null,
        namespace: "platform",
        key: "maintenance_mode",
        value: false,
        version: 1,
      });

      expect(mockFindOne).toHaveBeenCalledWith({
        env: "production",
        scopeId: null,
        namespace: "platform",
        key: "maintenance_mode",
      });
    });

    it("should map undefined value to null", async () => {
      const mockDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "unset",
        value: undefined,
        version: 2,
      };

      mockFindOne.mockResolvedValueOnce(mockDoc);

      const result = await SettingsRepoMongo.findOne(
        "test",
        "tenant1",
        "app",
        "unset"
      );

      expect(result?.value).toBeNull();
    });

    it("should default version to 0 if missing", async () => {
      const mockDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "key",
        value: "val",
      };

      mockFindOne.mockResolvedValueOnce(mockDoc);

      const result = await SettingsRepoMongo.findOne(
        "test",
        "tenant1",
        "app",
        "key"
      );

      expect(result?.version).toBe(0);
    });

    it("should omit updatedBy and updatedAt when not present", async () => {
      const mockDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "new_setting",
        value: "initial",
        version: 0,
      };

      mockFindOne.mockResolvedValueOnce(mockDoc);

      const result = await SettingsRepoMongo.findOne(
        "test",
        "tenant1",
        "app",
        "new_setting"
      );

      expect(result).not.toHaveProperty("updatedBy");
      expect(result).not.toHaveProperty("updatedAt");
    });
  });

  describe("upsertPatch", () => {
    it("should insert a new setting when it does not exist", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const mockAfter = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "new_key",
        value: "new_value",
        version: 1,
        updatedBy: "user123",
        updatedAt: new Date(),
      };

      mockFindOneAndUpdate.mockResolvedValueOnce({ value: mockAfter });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "new_key",
        value: "new_value",
        actorId: "user123",
      });

      expect(result).toHaveProperty("ok", true);
      if ("ok" in result) {
        expect(result.setting.namespace).toBe("app");
        expect(result.setting.key).toBe("new_key");
        expect(result.setting.value).toBe("new_value");
        expect(result.setting.version).toBe(1);
      }

      expect(mockFindOne).toHaveBeenCalledWith({
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "new_key",
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "new_key",
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            value: "new_value",
            updatedBy: "user123",
          }),
          $inc: { version: 1 },
        }),
        { upsert: true, returnDocument: "after" }
      );
    });

    it("should update an existing setting", async () => {
      const existingDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "theme",
        value: "light",
        version: 2,
      };

      mockFindOne.mockResolvedValueOnce(existingDoc);

      const mockAfter = {
        ...existingDoc,
        value: "dark",
        version: 3,
        updatedBy: "user456",
        updatedAt: new Date(),
      };

      mockFindOneAndUpdate.mockResolvedValueOnce({ value: mockAfter });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "theme",
        value: "dark",
        actorId: "user456",
      });

      expect(result).toHaveProperty("ok", true);
      if ("ok" in result) {
        expect(result.setting.value).toBe("dark");
        expect(result.setting.version).toBe(3);
      }
    });

    it("should return conflict when expectedVersion does not match", async () => {
      const existingDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "counter",
        value: 10,
        version: 5,
      };

      mockFindOne.mockResolvedValueOnce(existingDoc);

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "counter",
        value: 11,
        expectedVersion: 4,
      });

      expect(result).toHaveProperty("conflict", true);
      if ("conflict" in result) {
        expect(result.expected).toBe(5);
      }

      // Should not call findOneAndUpdate on conflict
      expect(mockFindOneAndUpdate).not.toHaveBeenCalled();
    });

    it("should succeed with correct expectedVersion", async () => {
      const existingDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "billing",
        key: "subscription",
        value: "basic",
        version: 3,
      };

      mockFindOne.mockResolvedValueOnce(existingDoc);

      const mockAfter = {
        ...existingDoc,
        value: "premium",
        version: 4,
        updatedAt: new Date(),
      };

      mockFindOneAndUpdate.mockResolvedValueOnce({ value: mockAfter });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "billing",
        key: "subscription",
        value: "premium",
        expectedVersion: 3,
      });

      expect(result).toHaveProperty("ok", true);
      if ("ok" in result) {
        expect(result.setting.value).toBe("premium");
        expect(result.setting.version).toBe(4);
      }
    });

    it("should handle unset operation", async () => {
      const existingDoc = {
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "optional",
        value: "something",
        version: 1,
      };

      mockFindOne.mockResolvedValueOnce(existingDoc);

      const mockAfter = {
        ...existingDoc,
        value: undefined,
        version: 2,
        updatedAt: new Date(),
      };

      mockFindOneAndUpdate.mockResolvedValueOnce({ value: mockAfter });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "optional",
        unset: true,
        actorId: "user789",
      });

      expect(result).toHaveProperty("ok", true);
      if ("ok" in result) {
        expect(result.setting.value).toBeNull();
        expect(result.setting.version).toBe(2);
      }

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $unset: { value: "" },
          $inc: { version: 1 },
        }),
        expect.any(Object)
      );
    });

    it("should allow unset without expectedVersion", async () => {
      mockFindOne.mockResolvedValueOnce({
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "temp",
        value: "old",
        version: 5,
      });

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "temp",
          value: undefined,
          version: 6,
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "temp",
        unset: true,
      });

      expect(result).toHaveProperty("ok", true);
    });

    it("should increment version on every patch", async () => {
      mockFindOne.mockResolvedValueOnce({
        env: "test",
        scopeId: "tenant1",
        namespace: "app",
        key: "version_test",
        value: "v1",
        version: 10,
      });

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "version_test",
          value: "v2",
          version: 11,
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "version_test",
        value: "v2",
      });

      if ("ok" in result) {
        expect(result.setting.version).toBe(11);
      }

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $inc: { version: 1 },
        }),
        expect.any(Object)
      );
    });

    it("should track actorId for audit trail", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "audit",
          key: "log_level",
          value: "debug",
          version: 1,
          updatedBy: "admin@example.com",
          updatedAt: new Date(),
        },
      });

      await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "audit",
        key: "log_level",
        value: "debug",
        actorId: "admin@example.com",
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({
            updatedBy: "admin@example.com",
          }),
        }),
        expect.any(Object)
      );
    });

    it("should set updatedAt timestamp", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const beforeTime = new Date();

      mockFindOneAndUpdate.mockImplementation((sel, upd) => {
        // Verify that updatedAt is a recent Date
        const setOp = (upd as any).$set;
        expect(setOp.updatedAt).toBeInstanceOf(Date);
        expect(setOp.updatedAt.getTime()).toBeGreaterThanOrEqual(
          beforeTime.getTime()
        );

        return Promise.resolve({
          value: {
            env: "test",
            scopeId: "tenant1",
            namespace: "app",
            key: "key",
            value: "val",
            version: 1,
            updatedAt: setOp.updatedAt,
          },
        });
      });

      await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "key",
        value: "val",
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalled();
    });

    it("should allow patching platform-scoped settings", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "production",
          scopeId: null,
          namespace: "platform",
          key: "feature_flag",
          value: true,
          version: 1,
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "production",
        scopeId: null,
        ns: "platform",
        key: "feature_flag",
        value: true,
        actorId: "superadmin",
      });

      expect(result).toHaveProperty("ok", true);
      if ("ok" in result) {
        expect(result.setting.namespace).toBe("platform");
        expect(result.setting.value).toBe(true);
      }

      expect(mockFindOne).toHaveBeenCalledWith(
        expect.objectContaining({
          scopeId: null,
        })
      );
    });

    it("should handle complex object values", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      const complexValue = {
        nested: {
          array: [1, 2, 3],
          bool: true,
          string: "test",
        },
      };

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "config",
          value: complexValue,
          version: 1,
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "config",
        value: complexValue,
      });

      if ("ok" in result) {
        expect(result.setting.value).toEqual(complexValue);
      }
    });

    it("should handle null value explicitly set", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "nullable",
          value: null,
          version: 1,
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "nullable",
        value: null,
      });

      if ("ok" in result) {
        expect(result.setting.value).toBeNull();
      }
    });

    it("should use upsert:true to create if not exists", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "new",
          key: "key",
          value: "val",
          version: 1,
        },
      });

      await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "new",
        key: "key",
        value: "val",
      });

      expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
        expect.objectContaining({
          upsert: true,
          returnDocument: "after",
        })
      );
    });

    it("should default version to 0 when missing in after document", async () => {
      mockFindOne.mockResolvedValueOnce(null);

      mockFindOneAndUpdate.mockResolvedValueOnce({
        value: {
          env: "test",
          scopeId: "tenant1",
          namespace: "app",
          key: "noversion",
          value: "data",
        },
      });

      const result = await SettingsRepoMongo.upsertPatch({
        env: "test",
        scopeId: "tenant1",
        ns: "app",
        key: "noversion",
        value: "data",
      });

      if ("ok" in result) {
        expect(result.setting.version).toBe(0);
      }
    });
  });
});
