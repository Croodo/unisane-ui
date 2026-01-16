import { describe, it, expect } from "vitest";
import { ZGetSetting, ZSettingOut, ZPatchSetting } from "../domain/schemas";

describe("Settings Schemas", () => {
  describe("ZGetSetting", () => {
    it("should accept valid input with required fields", () => {
      const result = ZGetSetting.safeParse({
        ns: "app",
        key: "theme",
      });
      expect(result.success).toBe(true);
    });

    it("should accept valid input with optional env", () => {
      const result = ZGetSetting.safeParse({
        ns: "auth",
        key: "session_timeout",
        env: "production",
      });
      expect(result.success).toBe(true);
    });

    it("should reject namespace shorter than 2 characters", () => {
      const result = ZGetSetting.safeParse({
        ns: "a",
        key: "test",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["ns"]);
      }
    });

    it("should reject empty key", () => {
      const result = ZGetSetting.safeParse({
        ns: "app",
        key: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.path).toEqual(["key"]);
      }
    });

    it("should reject missing namespace", () => {
      const result = ZGetSetting.safeParse({
        key: "test",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing key", () => {
      const result = ZGetSetting.safeParse({
        ns: "app",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ZSettingOut", () => {
    it("should accept valid output with all fields", () => {
      const result = ZSettingOut.safeParse({
        env: "development",
        namespace: "app",
        key: "theme",
        value: "dark",
        version: 1,
      });
      expect(result.success).toBe(true);
    });

    it("should accept null value", () => {
      const result = ZSettingOut.safeParse({
        namespace: "app",
        key: "feature_flag",
        value: null,
        version: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept output without env", () => {
      const result = ZSettingOut.safeParse({
        namespace: "billing",
        key: "currency",
        value: "USD",
        version: 5,
      });
      expect(result.success).toBe(true);
    });

    it("should accept complex value types", () => {
      const result = ZSettingOut.safeParse({
        namespace: "notify",
        key: "email_config",
        value: {
          smtp: "smtp.example.com",
          port: 587,
          enabled: true,
        },
        version: 3,
      });
      expect(result.success).toBe(true);
    });

    it("should reject non-integer version", () => {
      const result = ZSettingOut.safeParse({
        namespace: "app",
        key: "test",
        value: "value",
        version: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing version", () => {
      const result = ZSettingOut.safeParse({
        namespace: "app",
        key: "test",
        value: "value",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("ZPatchSetting", () => {
    it("should accept valid patch with value", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "theme",
        value: "light",
      });
      expect(result.success).toBe(true);
    });

    it("should accept patch with unset flag", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "deprecated_setting",
        unset: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept patch with expectedVersion", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "billing",
        key: "subscription_plan",
        value: "premium",
        expectedVersion: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should accept patch with env", () => {
      const result = ZPatchSetting.safeParse({
        env: "staging",
        namespace: "flags",
        key: "new_feature",
        value: true,
      });
      expect(result.success).toBe(true);
    });

    it("should reject namespace shorter than 2 characters", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "x",
        key: "test",
        value: "value",
      });
      expect(result.success).toBe(false);
    });

    it("should reject empty key", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "",
        value: "value",
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative expectedVersion", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "test",
        value: "value",
        expectedVersion: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should accept expectedVersion of 0", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "new_setting",
        value: "initial",
        expectedVersion: 0,
      });
      expect(result.success).toBe(true);
    });

    it("should accept patch with both value and unset (edge case)", () => {
      // Note: This is allowed by schema but business logic may prevent it
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "test",
        value: "value",
        unset: true,
      });
      expect(result.success).toBe(true);
    });

    it("should accept patch with null value", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "app",
        key: "nullable_setting",
        value: null,
      });
      expect(result.success).toBe(true);
    });

    it("should accept complex value types in patch", () => {
      const result = ZPatchSetting.safeParse({
        namespace: "ai",
        key: "model_config",
        value: {
          model: "gpt-4",
          temperature: 0.7,
          max_tokens: 1000,
        },
      });
      expect(result.success).toBe(true);
    });

    it("should reject missing both namespace and key", () => {
      const result = ZPatchSetting.safeParse({
        value: "test",
      });
      expect(result.success).toBe(false);
    });
  });
});
