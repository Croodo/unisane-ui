import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  formatGroupLabel,
  calculateAggregation,
  buildNestedGroups,
  buildGroupedData,
  getNestedValue,
  type BuildGroupsOptions,
} from "../../utils/grouping";
import type { Column } from "../../types";

// ─── TEST DATA ──────────────────────────────────────────────────────────────

interface TestRow {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  amount: number;
  active: boolean;
}

const testData: TestRow[] = [
  { id: "1", name: "Item A", category: "Electronics", subCategory: "Phones", amount: 100, active: true },
  { id: "2", name: "Item B", category: "Electronics", subCategory: "Laptops", amount: 200, active: false },
  { id: "3", name: "Item C", category: "Clothing", subCategory: "Shirts", amount: 50, active: true },
  { id: "4", name: "Item D", category: "Electronics", subCategory: "Phones", amount: 150, active: true },
  { id: "5", name: "Item E", category: "Clothing", subCategory: "Pants", amount: 75, active: false },
];

// ─── formatGroupLabel TESTS ─────────────────────────────────────────────────

describe("formatGroupLabel", () => {
  describe("null and undefined values", () => {
    it("should return '(Empty)' for null", () => {
      expect(formatGroupLabel(null)).toBe("(Empty)");
    });

    it("should return '(Empty)' for undefined", () => {
      expect(formatGroupLabel(undefined)).toBe("(Empty)");
    });
  });

  describe("boolean values", () => {
    it("should return 'Yes' for true", () => {
      expect(formatGroupLabel(true)).toBe("Yes");
    });

    it("should return 'No' for false", () => {
      expect(formatGroupLabel(false)).toBe("No");
    });
  });

  describe("string values", () => {
    it("should return string as-is", () => {
      expect(formatGroupLabel("Electronics")).toBe("Electronics");
      expect(formatGroupLabel("")).toBe("");
    });
  });

  describe("number values", () => {
    it("should convert numbers to string", () => {
      expect(formatGroupLabel(42)).toBe("42");
      expect(formatGroupLabel(0)).toBe("0");
      expect(formatGroupLabel(-10)).toBe("-10");
      expect(formatGroupLabel(3.14)).toBe("3.14");
    });
  });

  describe("other types", () => {
    it("should convert objects to string", () => {
      expect(formatGroupLabel({ key: "value" })).toBe("[object Object]");
    });

    it("should convert arrays to string", () => {
      expect(formatGroupLabel([1, 2, 3])).toBe("1,2,3");
    });
  });
});

// ─── calculateAggregation TESTS ─────────────────────────────────────────────

describe("calculateAggregation", () => {
  describe("sum aggregation", () => {
    it("should calculate sum of numeric values", () => {
      const rows = testData.slice(0, 3); // amounts: 100, 200, 50
      expect(calculateAggregation(rows, "amount", "sum")).toBe(350);
    });

    it("should return 0 for empty sum", () => {
      const rows = [{ id: "1", name: null, amount: 10 }];
      expect(calculateAggregation(rows, "amount", "sum")).toBe(10);
    });
  });

  describe("average aggregation", () => {
    it("should calculate average of numeric values", () => {
      const rows = testData.slice(0, 3); // amounts: 100, 200, 50
      expect(calculateAggregation(rows, "amount", "average")).toBe(350 / 3);
    });

    it("should return correct average for single item", () => {
      const rows = [{ id: "1", amount: 100 }];
      expect(calculateAggregation(rows, "amount", "average")).toBe(100);
    });
  });

  describe("count aggregation", () => {
    it("should count numeric values", () => {
      const rows = testData.slice(0, 3);
      expect(calculateAggregation(rows, "amount", "count")).toBe(3);
    });

    it("should only count valid numbers", () => {
      const rows = [
        { id: "1", amount: 10 },
        { id: "2", amount: null },
        { id: "3", amount: 20 },
      ];
      expect(calculateAggregation(rows as unknown as TestRow[], "amount", "count")).toBe(2);
    });
  });

  describe("min aggregation", () => {
    it("should find minimum value", () => {
      expect(calculateAggregation(testData, "amount", "min")).toBe(50);
    });

    it("should handle single value", () => {
      const rows = [{ id: "1", amount: 100 }];
      expect(calculateAggregation(rows, "amount", "min")).toBe(100);
    });
  });

  describe("max aggregation", () => {
    it("should find maximum value", () => {
      expect(calculateAggregation(testData, "amount", "max")).toBe(200);
    });

    it("should handle single value", () => {
      const rows = [{ id: "1", amount: 100 }];
      expect(calculateAggregation(rows, "amount", "max")).toBe(100);
    });
  });

  describe("edge cases", () => {
    it("should return null for empty rows", () => {
      expect(calculateAggregation([], "amount", "sum")).toBeNull();
    });

    it("should return null when no numeric values found", () => {
      const rows = [
        { id: "1", value: "string" },
        { id: "2", value: null },
      ];
      expect(calculateAggregation(rows, "value", "sum")).toBeNull();
    });

    it("should handle nested key paths", () => {
      const rows = [
        { id: "1", data: { value: 10 } },
        { id: "2", data: { value: 20 } },
      ];
      expect(calculateAggregation(rows, "data.value", "sum")).toBe(30);
    });

    it("should filter out non-numeric values", () => {
      const rows = [
        { id: "1", amount: 10 },
        { id: "2", amount: "not a number" },
        { id: "3", amount: 20 },
      ];
      expect(calculateAggregation(rows as unknown as TestRow[], "amount", "sum")).toBe(30);
    });

    it("should handle zero values", () => {
      const rows = [
        { id: "1", amount: 0 },
        { id: "2", amount: 10 },
      ];
      expect(calculateAggregation(rows, "amount", "sum")).toBe(10);
      expect(calculateAggregation(rows, "amount", "min")).toBe(0);
    });

    it("should handle negative values", () => {
      const rows = [
        { id: "1", amount: -10 },
        { id: "2", amount: 20 },
      ];
      expect(calculateAggregation(rows, "amount", "sum")).toBe(10);
      expect(calculateAggregation(rows, "amount", "min")).toBe(-10);
    });
  });
});

// ─── buildNestedGroups TESTS ────────────────────────────────────────────────

describe("buildNestedGroups", () => {
  const mockIsExpanded = vi.fn(() => false);
  const emptyAggregationColumns: Column<TestRow>[] = [];

  beforeEach(() => {
    mockIsExpanded.mockClear();
  });

  describe("single level grouping", () => {
    it("should group rows by single key", () => {
      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      expect(groups).toHaveLength(2); // Electronics, Clothing
      expect(groups.map((g) => g.groupLabel).sort()).toEqual(["Clothing", "Electronics"]);
    });

    it("should include rows in groups at deepest level", () => {
      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      expect(electronicsGroup?.rows).toHaveLength(3);

      const clothingGroup = groups.find((g) => g.groupLabel === "Clothing");
      expect(clothingGroup?.rows).toHaveLength(2);
    });

    it("should set correct group properties", () => {
      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const group = groups[0];
      expect(group?.type).toBe("group");
      expect(group?.depth).toBe(0);
      expect(group?.groupByKey).toBe("category");
      expect(group?.parentGroupId).toBeNull();
    });
  });

  describe("multi-level grouping", () => {
    it("should create nested groups for multiple keys", () => {
      const groups = buildNestedGroups(
        testData,
        ["category", "subCategory"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      // Top level: Electronics, Clothing
      expect(groups).toHaveLength(2);

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      expect(electronicsGroup?.childGroups).toHaveLength(2); // Phones, Laptops
      expect(electronicsGroup?.rows).toHaveLength(0); // No rows at non-deepest level
    });

    it("should include rows only at deepest level", () => {
      const groups = buildNestedGroups(
        testData,
        ["category", "subCategory"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      const phonesGroup = electronicsGroup?.childGroups?.find((g) => g.groupLabel === "Phones");

      expect(phonesGroup?.rows).toHaveLength(2); // Items A and D
      expect(phonesGroup?.childGroups).toBeUndefined();
    });

    it("should create correct compound group IDs", () => {
      const groups = buildNestedGroups(
        testData,
        ["category", "subCategory"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      const phonesGroup = electronicsGroup?.childGroups?.find((g) => g.groupLabel === "Phones");

      expect(phonesGroup?.parentGroupId).toBe("Electronics");
      expect(phonesGroup?.groupId).toBe("Electronics::Phones");
    });

    it("should set correct depth for nested groups", () => {
      const groups = buildNestedGroups(
        testData,
        ["category", "subCategory"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const topGroup = groups[0];
      expect(topGroup?.depth).toBe(0);

      const childGroup = topGroup?.childGroups?.[0];
      expect(childGroup?.depth).toBe(1);
    });
  });

  describe("aggregations", () => {
    it("should calculate aggregations for specified columns", () => {
      const aggregationColumns: Column<TestRow>[] = [
        { key: "amount", header: "Total Amount", aggregation: "sum" },
      ];

      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        aggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      expect(electronicsGroup?.aggregations["Total Amount"]).toBe(450); // 100 + 200 + 150
    });

    it("should handle multiple aggregations", () => {
      const aggregationColumns: Column<TestRow>[] = [
        { key: "amount", header: "Sum", aggregation: "sum" },
        { key: "amount", header: "Average", aggregation: "average" },
      ];

      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        aggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      expect(electronicsGroup?.aggregations["Sum"]).toBe(450);
      expect(electronicsGroup?.aggregations["Average"]).toBe(150);
    });
  });

  describe("expansion state", () => {
    it("should call isGroupExpanded with group ID", () => {
      buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      expect(mockIsExpanded).toHaveBeenCalledWith("Clothing");
      expect(mockIsExpanded).toHaveBeenCalledWith("Electronics");
    });

    it("should set isExpanded based on callback result", () => {
      const isExpanded = (id: string) => id === "Electronics";

      const groups = buildNestedGroups(
        testData,
        ["category"],
        0,
        null,
        isExpanded,
        emptyAggregationColumns
      );

      const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
      const clothingGroup = groups.find((g) => g.groupLabel === "Clothing");

      expect(electronicsGroup?.isExpanded).toBe(true);
      expect(clothingGroup?.isExpanded).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should return empty array for empty groupByKeys", () => {
      const groups = buildNestedGroups(
        testData,
        [],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      expect(groups).toHaveLength(0);
    });

    it("should return empty array for empty rows", () => {
      const groups = buildNestedGroups(
        [],
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      expect(groups).toHaveLength(0);
    });

    it("should handle null values in group key", () => {
      const dataWithNull = [
        ...testData,
        { id: "6", name: "Item F", category: null as unknown as string, amount: 25, active: true },
      ];

      const groups = buildNestedGroups(
        dataWithNull,
        ["category"],
        0,
        null,
        mockIsExpanded,
        emptyAggregationColumns
      );

      const nullGroup = groups.find((g) => g.groupValue === null);
      expect(nullGroup).toBeDefined();
      expect(nullGroup?.groupLabel).toBe("(Empty)");
    });

    it("should sort groups alphabetically", () => {
      const unsortedData = [
        { id: "1", category: "Zebra", amount: 10 },
        { id: "2", category: "Apple", amount: 20 },
        { id: "3", category: "Mango", amount: 30 },
      ];

      const groups = buildNestedGroups(
        unsortedData,
        ["category"],
        0,
        null,
        mockIsExpanded,
        []
      );

      expect(groups.map((g) => g.groupLabel)).toEqual(["Apple", "Mango", "Zebra"]);
    });
  });
});

// ─── buildGroupedData TESTS ─────────────────────────────────────────────────

describe("buildGroupedData", () => {
  it("should build grouped data from options object", () => {
    const options: BuildGroupsOptions<TestRow> = {
      data: testData,
      groupByKeys: ["category"],
      isGroupExpanded: () => false,
      aggregationColumns: [],
    };

    const groups = buildGroupedData(options);

    expect(groups).toHaveLength(2);
    expect(groups.map((g) => g.groupLabel).sort()).toEqual(["Clothing", "Electronics"]);
  });

  it("should return empty array for empty groupByKeys", () => {
    const options: BuildGroupsOptions<TestRow> = {
      data: testData,
      groupByKeys: [],
      isGroupExpanded: () => false,
      aggregationColumns: [],
    };

    const groups = buildGroupedData(options);

    expect(groups).toHaveLength(0);
  });

  it("should pass all options to buildNestedGroups", () => {
    const isExpanded = vi.fn(() => true);
    const aggregationColumns: Column<TestRow>[] = [
      { key: "amount", header: "Total", aggregation: "sum" },
    ];

    const options: BuildGroupsOptions<TestRow> = {
      data: testData,
      groupByKeys: ["category"],
      isGroupExpanded: isExpanded,
      aggregationColumns,
    };

    const groups = buildGroupedData(options);

    expect(isExpanded).toHaveBeenCalled();
    expect(groups[0]?.isExpanded).toBe(true);
    expect(Object.keys(groups[0]?.aggregations ?? {}).length).toBeGreaterThan(0);
  });
});

// ─── getNestedValue RE-EXPORT TEST ──────────────────────────────────────────

describe("getNestedValue re-export", () => {
  it("should export getNestedValue for backwards compatibility", () => {
    expect(getNestedValue).toBeDefined();
    expect(typeof getNestedValue).toBe("function");
  });

  it("should work correctly when called", () => {
    const obj = { a: { b: { c: 42 } } };
    expect(getNestedValue(obj, "a.b.c")).toBe(42);
  });
});

// ─── INTEGRATION TESTS ──────────────────────────────────────────────────────

describe("grouping integration", () => {
  it("should produce correct structure for rendering", () => {
    const expandedGroups = new Set(["Electronics"]);

    const groups = buildGroupedData({
      data: testData,
      groupByKeys: ["category"],
      isGroupExpanded: (id) => expandedGroups.has(id),
      aggregationColumns: [
        { key: "amount", header: "Total", aggregation: "sum" },
      ],
    });

    // Verify structure for rendering
    for (const group of groups) {
      expect(group.type).toBe("group");
      expect(group.groupId).toBeDefined();
      expect(group.groupLabel).toBeDefined();
      expect(group.rows).toBeDefined();
      expect(group.aggregations).toBeDefined();
      expect(typeof group.isExpanded).toBe("boolean");
    }

    // Verify Electronics is expanded
    const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");
    expect(electronicsGroup?.isExpanded).toBe(true);

    // Verify Clothing is not expanded
    const clothingGroup = groups.find((g) => g.groupLabel === "Clothing");
    expect(clothingGroup?.isExpanded).toBe(false);
  });

  it("should handle three-level grouping", () => {
    const threeLevel = [
      { id: "1", a: "A", b: "B1", c: "C1", value: 1 },
      { id: "2", a: "A", b: "B1", c: "C2", value: 2 },
      { id: "3", a: "A", b: "B2", c: "C1", value: 3 },
    ];

    const groups = buildGroupedData({
      data: threeLevel,
      groupByKeys: ["a", "b", "c"],
      isGroupExpanded: () => true,
      aggregationColumns: [],
    });

    // Level 0: A
    expect(groups).toHaveLength(1);
    expect(groups[0]?.groupLabel).toBe("A");
    expect(groups[0]?.rows).toHaveLength(0);

    // Level 1: B1, B2
    expect(groups[0]?.childGroups).toHaveLength(2);

    // Level 2 (B1 -> C1, C2)
    const b1Group = groups[0]?.childGroups?.find((g) => g.groupLabel === "B1");
    expect(b1Group?.childGroups).toHaveLength(2);

    // Level 2 rows (deepest level)
    const c1Group = b1Group?.childGroups?.find((g) => g.groupLabel === "C1");
    expect(c1Group?.rows).toHaveLength(1);
    expect(c1Group?.childGroups).toBeUndefined();
  });

  it("should aggregate correctly at each level", () => {
    const groups = buildGroupedData({
      data: testData,
      groupByKeys: ["category"],
      isGroupExpanded: () => true,
      aggregationColumns: [
        { key: "amount", header: "Sum", aggregation: "sum" },
        { key: "amount", header: "Count", aggregation: "count" },
        { key: "amount", header: "Avg", aggregation: "average" },
        { key: "amount", header: "Min", aggregation: "min" },
        { key: "amount", header: "Max", aggregation: "max" },
      ],
    });

    const electronicsGroup = groups.find((g) => g.groupLabel === "Electronics");

    // Electronics: 100, 200, 150
    expect(electronicsGroup?.aggregations["Sum"]).toBe(450);
    expect(electronicsGroup?.aggregations["Count"]).toBe(3);
    expect(electronicsGroup?.aggregations["Avg"]).toBe(150);
    expect(electronicsGroup?.aggregations["Min"]).toBe(100);
    expect(electronicsGroup?.aggregations["Max"]).toBe(200);

    const clothingGroup = groups.find((g) => g.groupLabel === "Clothing");

    // Clothing: 50, 75
    expect(clothingGroup?.aggregations["Sum"]).toBe(125);
    expect(clothingGroup?.aggregations["Count"]).toBe(2);
    expect(clothingGroup?.aggregations["Avg"]).toBe(62.5);
    expect(clothingGroup?.aggregations["Min"]).toBe(50);
    expect(clothingGroup?.aggregations["Max"]).toBe(75);
  });
});
