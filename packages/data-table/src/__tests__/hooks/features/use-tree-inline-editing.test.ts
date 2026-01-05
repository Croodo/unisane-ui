import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTreeData } from "../../../hooks/features/use-tree-data";
import { useInlineEditing } from "../../../hooks/features/use-inline-editing";

// ─── TEST DATA ───────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  name: string;
  role: string;
  department: string;
  children?: Employee[];
}

const createTestData = (): Employee[] => [
  {
    id: "ceo-1",
    name: "Alice CEO",
    role: "CEO",
    department: "Executive",
    children: [
      {
        id: "vp-1",
        name: "Bob VP",
        role: "VP Engineering",
        department: "Engineering",
        children: [
          {
            id: "dev-1",
            name: "Charlie Dev",
            role: "Senior Developer",
            department: "Engineering",
            children: [],
          },
          {
            id: "dev-2",
            name: "Diana Dev",
            role: "Developer",
            department: "Engineering",
            children: [],
          },
        ],
      },
      {
        id: "vp-2",
        name: "Eve VP",
        role: "VP Sales",
        department: "Sales",
        children: [
          {
            id: "sales-1",
            name: "Frank Sales",
            role: "Sales Rep",
            department: "Sales",
            children: [],
          },
        ],
      },
    ],
  },
];

// ─── TEST SUITE ──────────────────────────────────────────────────────────────

describe("Tree Data + Inline Editing Integration", () => {
  let testData: Employee[];
  let mockOnCellChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    testData = createTestData();
    mockOnCellChange = vi.fn();
  });

  describe("Basic Integration", () => {
    it("should correctly flatten tree data for editing", () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      // Verify all nodes are flattened
      expect(treeResult.current.flattenedRows.length).toBe(6);

      // Verify correct hierarchy
      const ceo = treeResult.current.flattenedRows[0];
      expect(ceo?.data.id).toBe("ceo-1");
      expect(ceo?.level).toBe(0);

      const vp1 = treeResult.current.flattenedRows[1];
      expect(vp1?.data.id).toBe("vp-1");
      expect(vp1?.level).toBe(1);
      expect(vp1?.parentId).toBe("ceo-1");

      const dev1 = treeResult.current.flattenedRows[2];
      expect(dev1?.data.id).toBe("dev-1");
      expect(dev1?.level).toBe(2);
      expect(dev1?.parentId).toBe("vp-1");
    });

    it("should allow editing cells in tree rows", () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      // Get flattened rows for editing
      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Start editing a leaf node
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      expect(editResult.current.editingCell).toEqual({
        rowId: "dev-1",
        columnKey: "name",
      });
      expect(editResult.current.pendingValue).toBe("Charlie Dev");
    });

    it("should commit edits on tree rows", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Start editing and change value
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      act(() => {
        editResult.current.updateValue("Charles Developer");
      });

      // Commit
      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "dev-1",
        "name",
        "Charles Developer",
        expect.objectContaining({ id: "dev-1" })
      );
    });
  });

  describe("Editing Across Tree Levels", () => {
    it("should edit root node cells", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Edit root node
      act(() => {
        editResult.current.startEdit("ceo-1", "role", "CEO");
      });

      act(() => {
        editResult.current.updateValue("Chief Executive Officer");
      });

      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "ceo-1",
        "role",
        "Chief Executive Officer",
        expect.objectContaining({ id: "ceo-1", name: "Alice CEO" })
      );
    });

    it("should edit intermediate node cells", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Edit VP node (intermediate level)
      act(() => {
        editResult.current.startEdit("vp-1", "department", "Engineering");
      });

      act(() => {
        editResult.current.updateValue("R&D");
      });

      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "vp-1",
        "department",
        "R&D",
        expect.objectContaining({ id: "vp-1" })
      );
    });
  });

  describe("Tree Operations During Editing", () => {
    it("should maintain edit state when tree is collapsed", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Start editing a leaf node
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      act(() => {
        editResult.current.updateValue("New Name");
      });

      // Collapse parent - editing state should persist
      act(() => {
        treeResult.current.collapseNode("vp-1");
      });

      // Edit state should still be active
      expect(editResult.current.editingCell).toEqual({
        rowId: "dev-1",
        columnKey: "name",
      });
      expect(editResult.current.pendingValue).toBe("New Name");
    });

    it("should be able to commit edit after parent is collapsed and expanded", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      // Create a mutable reference to flatData
      let flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult, rerender } = renderHook(
        ({ data }) =>
          useInlineEditing({
            data,
            onCellChange: mockOnCellChange,
          }),
        { initialProps: { data: flatData } }
      );

      // Start editing
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      act(() => {
        editResult.current.updateValue("Updated Name");
      });

      // Collapse parent
      act(() => {
        treeResult.current.collapseNode("vp-1");
      });

      // Expand parent again
      act(() => {
        treeResult.current.expandNode("vp-1");
      });

      // Update flatData reference
      flatData = treeResult.current.flattenedRows.map((r) => r.data);
      rerender({ data: flatData });

      // Should still be able to commit
      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "dev-1",
        "name",
        "Updated Name",
        expect.objectContaining({ id: "dev-1" })
      );
    });
  });

  describe("Validation in Tree Context", () => {
    it("should validate cells in tree rows", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const validateCell = vi.fn((rowId: string, columnKey: string, value: unknown) => {
        if (columnKey === "name" && typeof value === "string" && value.length < 2) {
          return "Name must be at least 2 characters";
        }
        return null;
      });

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
          validateCell,
        })
      );

      // Start editing
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      // Try to set invalid value
      act(() => {
        editResult.current.updateValue("A");
      });

      // Validation error should be shown
      expect(editResult.current.validationError).toBe("Name must be at least 2 characters");

      // Commit should fail
      let result: boolean;
      await act(async () => {
        result = await editResult.current.commitEdit();
      });

      expect(result!).toBe(false);
      expect(mockOnCellChange).not.toHaveBeenCalled();
    });

    it("should validate based on node level", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      // Create a level-aware validation
      const validateCell = vi.fn((rowId: string, columnKey: string, value: unknown) => {
        const node = treeResult.current.flattenedRows.find((r) => r.data.id === rowId);
        if (node && node.level === 0 && columnKey === "role") {
          // Root level roles must be executive
          if (typeof value === "string" && !value.toLowerCase().includes("executive") && !value.toLowerCase().includes("ceo")) {
            return "Root level must have executive role";
          }
        }
        return null;
      });

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
          validateCell,
        })
      );

      // Edit root node role with invalid value
      act(() => {
        editResult.current.startEdit("ceo-1", "role", "CEO");
      });

      act(() => {
        editResult.current.updateValue("Manager");
      });

      // Should fail validation
      expect(editResult.current.validationError).toBe("Root level must have executive role");
    });
  });

  describe("Edit History with Tree Data", () => {
    it("should track original values correctly for tree nodes", () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Start edit
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      // Update value
      act(() => {
        editResult.current.updateValue("New Name");
      });

      // Cancel should revert
      act(() => {
        editResult.current.cancelEdit();
      });

      expect(editResult.current.editingCell).toBeNull();
      expect(editResult.current.pendingValue).toBeNull();
    });
  });

  describe("Edge Cases", () => {
    it("should handle editing row that becomes unavailable", async () => {
      let currentData = createTestData();

      const { result: treeResult, rerender: rerenderTree } = renderHook(
        ({ data }) =>
          useTreeData({
            data,
            config: {
              getSubRows: (row) => row.children,
              defaultExpanded: true,
            },
          }),
        { initialProps: { data: currentData } }
      );

      let flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult, rerender: rerenderEdit } = renderHook(
        ({ data }) =>
          useInlineEditing({
            data,
            onCellChange: mockOnCellChange,
          }),
        { initialProps: { data: flatData } }
      );

      // Start editing
      act(() => {
        editResult.current.startEdit("dev-1", "name", "Charlie Dev");
      });

      // Remove the node from tree data (simulating deletion)
      currentData = [
        {
          ...currentData[0]!,
          children: [
            {
              ...currentData[0]!.children![0]!,
              children: [
                // dev-1 removed, only dev-2 remains
                currentData[0]!.children![0]!.children![1]!,
              ],
            },
            currentData[0]!.children![1]!,
          ],
        },
      ];

      rerenderTree({ data: currentData });
      flatData = treeResult.current.flattenedRows.map((r) => r.data);
      rerenderEdit({ data: flatData });

      // Attempt to commit should handle missing row gracefully
      await act(async () => {
        await editResult.current.commitEdit();
      });

      // Edit should be cancelled since row doesn't exist
      expect(editResult.current.editingCell).toBeNull();
      expect(mockOnCellChange).not.toHaveBeenCalled();
    });

    it("should handle deeply nested tree editing", async () => {
      // Create deeply nested data
      const deepData: Employee[] = [
        {
          id: "level-0",
          name: "Level 0",
          role: "Role 0",
          department: "Dept",
          children: [
            {
              id: "level-1",
              name: "Level 1",
              role: "Role 1",
              department: "Dept",
              children: [
                {
                  id: "level-2",
                  name: "Level 2",
                  role: "Role 2",
                  department: "Dept",
                  children: [
                    {
                      id: "level-3",
                      name: "Level 3",
                      role: "Role 3",
                      department: "Dept",
                      children: [
                        {
                          id: "level-4",
                          name: "Level 4",
                          role: "Role 4",
                          department: "Dept",
                          children: [],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ];

      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: deepData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Verify all levels are accessible
      expect(treeResult.current.flattenedRows.length).toBe(5);

      // Edit deepest level
      act(() => {
        editResult.current.startEdit("level-4", "name", "Level 4");
      });

      act(() => {
        editResult.current.updateValue("Deepest Node Updated");
      });

      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "level-4",
        "name",
        "Deepest Node Updated",
        expect.objectContaining({ id: "level-4" })
      );

      // Verify correct level
      const deepNode = treeResult.current.flattenedRows.find((r) => r.data.id === "level-4");
      expect(deepNode?.level).toBe(4);
    });

    it("should handle empty tree gracefully", () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: [],
          config: {
            getSubRows: (row: Employee) => row.children,
            defaultExpanded: true,
          },
        })
      );

      expect(treeResult.current.flattenedRows.length).toBe(0);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: [],
          onCellChange: mockOnCellChange,
        })
      );

      // Should not crash when trying to edit non-existent row
      act(() => {
        editResult.current.startEdit("non-existent", "name", "value");
      });

      // Edit state is set but commit will fail
      expect(editResult.current.editingCell).toEqual({
        rowId: "non-existent",
        columnKey: "name",
      });
    });

    it("should handle sibling editing (same level, different parents)", async () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      const flatData = treeResult.current.flattenedRows.map((r) => r.data);

      const { result: editResult } = renderHook(() =>
        useInlineEditing({
          data: flatData,
          onCellChange: mockOnCellChange,
        })
      );

      // Edit first VP
      act(() => {
        editResult.current.startEdit("vp-1", "name", "Bob VP");
      });

      act(() => {
        editResult.current.updateValue("Bob Updated");
      });

      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "vp-1",
        "name",
        "Bob Updated",
        expect.objectContaining({ id: "vp-1" })
      );

      // Edit second VP (sibling at same level)
      act(() => {
        editResult.current.startEdit("vp-2", "name", "Eve VP");
      });

      act(() => {
        editResult.current.updateValue("Eve Updated");
      });

      await act(async () => {
        await editResult.current.commitEdit();
      });

      expect(mockOnCellChange).toHaveBeenCalledWith(
        "vp-2",
        "name",
        "Eve Updated",
        expect.objectContaining({ id: "vp-2" })
      );
    });
  });

  describe("Path-based operations", () => {
    it("should provide correct path for edited nodes", () => {
      const { result: treeResult } = renderHook(() =>
        useTreeData({
          data: testData,
          config: {
            getSubRows: (row) => row.children,
            defaultExpanded: true,
          },
        })
      );

      // Verify path for deeply nested node
      const devNode = treeResult.current.flattenedRows.find((r) => r.data.id === "dev-1");
      expect(devNode?.path).toEqual(["ceo-1", "vp-1", "dev-1"]);

      // Verify path for root
      const ceoNode = treeResult.current.flattenedRows.find((r) => r.data.id === "ceo-1");
      expect(ceoNode?.path).toEqual(["ceo-1"]);
    });
  });
});
