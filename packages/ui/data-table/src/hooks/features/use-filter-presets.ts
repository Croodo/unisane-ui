"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import type { FilterState } from "../../types";

// ─── TYPES ───────────────────────────────────────────────────────────────────

/**
 * A saved filter preset configuration
 */
export interface FilterPreset {
  /** Unique identifier for the preset */
  id: string;
  /** Display name for the preset */
  name: string;
  /** The filter configuration */
  filters: FilterState;
  /** Optional description */
  description?: string;
  /** Whether this is a default/built-in preset */
  isDefault?: boolean;
  /** Whether this is a quick filter (shown as button) */
  isQuickFilter?: boolean;
  /** Icon name for the preset (Material Symbol) */
  icon?: string;
  /** Custom color for the preset button */
  color?: string;
  /** Creation timestamp */
  createdAt?: number;
  /** Last modified timestamp */
  updatedAt?: number;
}

/**
 * Preset creation input (without id/timestamps)
 */
export type FilterPresetInput = Omit<FilterPreset, "id" | "createdAt" | "updatedAt">;

export interface UseFilterPresetsOptions {
  /**
   * Whether presets are enabled.
   * @default true
   */
  enabled?: boolean;

  /**
   * Initial presets to load.
   */
  initialPresets?: FilterPreset[];

  /**
   * Built-in default presets that cannot be deleted.
   */
  defaultPresets?: FilterPreset[];

  /**
   * Current active filters (for comparison and preset detection).
   */
  currentFilters?: FilterState;

  /**
   * Callback when filters should be applied.
   */
  onApplyFilters?: (filters: FilterState) => void;

  /**
   * Persist presets to localStorage with this key.
   */
  storageKey?: string;

  /**
   * Maximum number of custom presets allowed.
   * @default 20
   */
  maxPresets?: number;

  /**
   * Callback when presets change.
   */
  onPresetsChange?: (presets: FilterPreset[]) => void;
}

export interface UseFilterPresetsReturn {
  /**
   * All available presets (default + custom).
   */
  presets: FilterPreset[];

  /**
   * Only custom (user-created) presets.
   */
  customPresets: FilterPreset[];

  /**
   * Only quick filter presets.
   */
  quickFilters: FilterPreset[];

  /**
   * Currently active preset (if current filters match a preset).
   */
  activePreset: FilterPreset | null;

  /**
   * Save current filters as a new preset.
   */
  savePreset: (input: FilterPresetInput) => FilterPreset | null;

  /**
   * Update an existing preset.
   */
  updatePreset: (id: string, updates: Partial<FilterPresetInput>) => boolean;

  /**
   * Delete a preset by ID.
   */
  deletePreset: (id: string) => boolean;

  /**
   * Apply a preset's filters.
   */
  applyPreset: (presetOrId: FilterPreset | string) => boolean;

  /**
   * Clear current filters.
   */
  clearFilters: () => void;

  /**
   * Check if current filters match a specific preset.
   */
  isPresetActive: (presetOrId: FilterPreset | string) => boolean;

  /**
   * Duplicate an existing preset.
   */
  duplicatePreset: (id: string, newName?: string) => FilterPreset | null;

  /**
   * Rename a preset.
   */
  renamePreset: (id: string, newName: string) => boolean;

  /**
   * Toggle quick filter status.
   */
  toggleQuickFilter: (id: string) => boolean;

  /**
   * Get a preset by ID.
   */
  getPreset: (id: string) => FilterPreset | undefined;

  /**
   * Check if we can add more presets.
   */
  canAddPreset: boolean;

  /**
   * Number of custom presets.
   */
  customPresetCount: number;

  /**
   * Import presets from JSON.
   */
  importPresets: (json: string) => { imported: number; errors: string[] };

  /**
   * Export presets to JSON.
   */
  exportPresets: () => string;
}

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

const DEFAULT_MAX_PRESETS = 20;
const STORAGE_DEBOUNCE_MS = 300;

// ─── UTILITIES ───────────────────────────────────────────────────────────────

let presetIdCounter = 0;

function generatePresetId(): string {
  return `preset-${Date.now()}-${++presetIdCounter}`;
}

/**
 * Deep compare two filter states
 */
function areFiltersEqual(a: FilterState, b: FilterState): boolean {
  const keysA = Object.keys(a).filter((k) => a[k] != null && a[k] !== "");
  const keysB = Object.keys(b).filter((k) => b[k] != null && b[k] !== "");

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = a[key];
    const valB = b[key];

    if (valA === valB) continue;

    // Handle arrays
    if (Array.isArray(valA) && Array.isArray(valB)) {
      if (valA.length !== valB.length) return false;
      if (!valA.every((v, i) => v === valB[i])) return false;
      continue;
    }

    // Handle objects (ranges)
    if (typeof valA === "object" && typeof valB === "object" && valA && valB) {
      const objKeysA = Object.keys(valA);
      const objKeysB = Object.keys(valB);
      if (objKeysA.length !== objKeysB.length) return false;
      if (!objKeysA.every((k) => (valA as Record<string, unknown>)[k] === (valB as Record<string, unknown>)[k])) return false;
      continue;
    }

    return false;
  }

  return true;
}

/**
 * Validate preset input
 */
function validatePresetInput(input: FilterPresetInput): string | null {
  if (!input.name || input.name.trim().length === 0) {
    return "Preset name is required";
  }
  if (input.name.length > 50) {
    return "Preset name must be 50 characters or less";
  }
  if (!input.filters || typeof input.filters !== "object") {
    return "Filters must be provided";
  }
  return null;
}

// ─── HOOK ────────────────────────────────────────────────────────────────────

/**
 * Hook for managing filter presets in data tables.
 *
 * Features:
 * - Save and load filter configurations
 * - Quick filter buttons for common filters
 * - Detect when current filters match a preset
 * - Optional localStorage persistence
 * - Import/export presets as JSON
 *
 * @example
 * ```tsx
 * const { presets, quickFilters, savePreset, applyPreset, activePreset } = useFilterPresets({
 *   currentFilters: filters,
 *   onApplyFilters: setFilters,
 *   storageKey: "my-table-filters",
 *   defaultPresets: [
 *     { id: "all", name: "All Items", filters: {}, isDefault: true, isQuickFilter: true },
 *     { id: "active", name: "Active Only", filters: { status: "active" }, isDefault: true, isQuickFilter: true },
 *   ],
 * });
 *
 * // Quick filter buttons
 * {quickFilters.map(preset => (
 *   <Button
 *     key={preset.id}
 *     variant={activePreset?.id === preset.id ? "filled" : "outlined"}
 *     onClick={() => applyPreset(preset)}
 *   >
 *     {preset.name}
 *   </Button>
 * ))}
 *
 * // Save current filters
 * savePreset({ name: "My Filter", filters: currentFilters });
 * ```
 */
export function useFilterPresets({
  enabled = true,
  initialPresets,
  defaultPresets = [],
  currentFilters = {},
  onApplyFilters,
  storageKey,
  maxPresets = DEFAULT_MAX_PRESETS,
  onPresetsChange,
}: UseFilterPresetsOptions = {}): UseFilterPresetsReturn {
  // ─── INITIAL STATE ────────────────────────────────────────────────────────

  const getInitialPresets = useCallback((): FilterPreset[] => {
    // Try localStorage first
    if (storageKey && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      } catch {
        // Ignore parse errors
      }
    }

    // Fall back to initialPresets prop
    return initialPresets ?? [];
  }, [storageKey, initialPresets]);

  // ─── STATE ────────────────────────────────────────────────────────────────

  const [customPresets, setCustomPresets] = useState<FilterPreset[]>(getInitialPresets);

  // Debounce timer ref for storage
  const storageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── DERIVED STATE ────────────────────────────────────────────────────────

  // Combine default and custom presets
  const presets = useMemo(() => {
    return [...defaultPresets, ...customPresets];
  }, [defaultPresets, customPresets]);

  // Quick filter presets only
  const quickFilters = useMemo(() => {
    return presets.filter((p) => p.isQuickFilter);
  }, [presets]);

  // Find active preset (matching current filters)
  const activePreset = useMemo(() => {
    if (!enabled) return null;

    // Check if any preset matches current filters
    for (const preset of presets) {
      if (areFiltersEqual(preset.filters, currentFilters)) {
        return preset;
      }
    }
    return null;
  }, [enabled, presets, currentFilters]);

  const canAddPreset = customPresets.length < maxPresets;
  const customPresetCount = customPresets.length;

  // ─── STORAGE PERSISTENCE ──────────────────────────────────────────────────

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    // Debounce storage writes
    if (storageTimerRef.current) {
      clearTimeout(storageTimerRef.current);
    }

    storageTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(customPresets));
      } catch {
        // Ignore storage errors
      }
    }, STORAGE_DEBOUNCE_MS);

    return () => {
      if (storageTimerRef.current) {
        clearTimeout(storageTimerRef.current);
      }
    };
  }, [customPresets, storageKey]);

  // ─── CHANGE CALLBACK ──────────────────────────────────────────────────────

  useEffect(() => {
    onPresetsChange?.(presets);
  }, [presets, onPresetsChange]);

  // ─── ACTIONS ──────────────────────────────────────────────────────────────

  const savePreset = useCallback(
    (input: FilterPresetInput): FilterPreset | null => {
      if (!enabled) return null;

      const error = validatePresetInput(input);
      if (error) {
        console.warn("Invalid preset:", error);
        return null;
      }

      if (!canAddPreset) {
        console.warn(`Maximum preset limit (${maxPresets}) reached`);
        return null;
      }

      const now = Date.now();
      const preset: FilterPreset = {
        ...input,
        id: generatePresetId(),
        createdAt: now,
        updatedAt: now,
      };

      setCustomPresets((prev) => [...prev, preset]);
      return preset;
    },
    [enabled, canAddPreset, maxPresets]
  );

  const updatePreset = useCallback(
    (id: string, updates: Partial<FilterPresetInput>): boolean => {
      if (!enabled) return false;

      // Can't update default presets
      const isDefault = defaultPresets.some((p) => p.id === id);
      if (isDefault) {
        console.warn("Cannot update default presets");
        return false;
      }

      let found = false;
      setCustomPresets((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            found = true;
            return {
              ...p,
              ...updates,
              updatedAt: Date.now(),
            };
          }
          return p;
        })
      );

      return found;
    },
    [enabled, defaultPresets]
  );

  const deletePreset = useCallback(
    (id: string): boolean => {
      if (!enabled) return false;

      // Can't delete default presets
      const isDefault = defaultPresets.some((p) => p.id === id);
      if (isDefault) {
        console.warn("Cannot delete default presets");
        return false;
      }

      let found = false;
      setCustomPresets((prev) => {
        const index = prev.findIndex((p) => p.id === id);
        if (index !== -1) {
          found = true;
          return [...prev.slice(0, index), ...prev.slice(index + 1)];
        }
        return prev;
      });

      return found;
    },
    [enabled, defaultPresets]
  );

  const applyPreset = useCallback(
    (presetOrId: FilterPreset | string): boolean => {
      if (!enabled) return false;

      const preset =
        typeof presetOrId === "string"
          ? presets.find((p) => p.id === presetOrId)
          : presetOrId;

      if (!preset) {
        console.warn("Preset not found");
        return false;
      }

      onApplyFilters?.(preset.filters);
      return true;
    },
    [enabled, presets, onApplyFilters]
  );

  const clearFilters = useCallback(() => {
    if (!enabled) return;
    onApplyFilters?.({});
  }, [enabled, onApplyFilters]);

  const isPresetActive = useCallback(
    (presetOrId: FilterPreset | string): boolean => {
      if (!enabled) return false;

      const preset =
        typeof presetOrId === "string"
          ? presets.find((p) => p.id === presetOrId)
          : presetOrId;

      if (!preset) return false;
      return areFiltersEqual(preset.filters, currentFilters);
    },
    [enabled, presets, currentFilters]
  );

  const duplicatePreset = useCallback(
    (id: string, newName?: string): FilterPreset | null => {
      if (!enabled || !canAddPreset) return null;

      const original = presets.find((p) => p.id === id);
      if (!original) return null;

      return savePreset({
        name: newName ?? `${original.name} (copy)`,
        filters: { ...original.filters },
        description: original.description,
        isQuickFilter: false, // Don't copy quick filter status
        icon: original.icon,
        color: original.color,
      });
    },
    [enabled, canAddPreset, presets, savePreset]
  );

  const renamePreset = useCallback(
    (id: string, newName: string): boolean => {
      return updatePreset(id, { name: newName });
    },
    [updatePreset]
  );

  const toggleQuickFilter = useCallback(
    (id: string): boolean => {
      const preset = presets.find((p) => p.id === id);
      if (!preset) return false;

      return updatePreset(id, { isQuickFilter: !preset.isQuickFilter });
    },
    [presets, updatePreset]
  );

  const getPreset = useCallback(
    (id: string): FilterPreset | undefined => {
      return presets.find((p) => p.id === id);
    },
    [presets]
  );

  // ─── IMPORT/EXPORT ────────────────────────────────────────────────────────

  const importPresets = useCallback(
    (json: string): { imported: number; errors: string[] } => {
      if (!enabled) {
        return { imported: 0, errors: ["Presets disabled"] };
      }

      const errors: string[] = [];
      let imported = 0;

      try {
        const parsed = JSON.parse(json);
        if (!Array.isArray(parsed)) {
          return { imported: 0, errors: ["Invalid format: expected array"] };
        }

        const newPresets: FilterPreset[] = [];
        for (const item of parsed) {
          const error = validatePresetInput(item);
          if (error) {
            errors.push(`Skipped "${item.name || "unnamed"}": ${error}`);
            continue;
          }

          if (newPresets.length + customPresets.length >= maxPresets) {
            errors.push(`Maximum preset limit (${maxPresets}) reached`);
            break;
          }

          const now = Date.now();
          newPresets.push({
            ...item,
            id: generatePresetId(),
            isDefault: false, // Imported presets are never default
            createdAt: now,
            updatedAt: now,
          });
          imported++;
        }

        if (newPresets.length > 0) {
          setCustomPresets((prev) => [...prev, ...newPresets]);
        }
      } catch (e) {
        errors.push(`Parse error: ${e instanceof Error ? e.message : "Unknown error"}`);
      }

      return { imported, errors };
    },
    [enabled, customPresets.length, maxPresets]
  );

  const exportPresets = useCallback((): string => {
    return JSON.stringify(customPresets, null, 2);
  }, [customPresets]);

  // ─── RETURN ───────────────────────────────────────────────────────────────

  return {
    presets,
    customPresets,
    quickFilters,
    activePreset,
    savePreset,
    updatePreset,
    deletePreset,
    applyPreset,
    clearFilters,
    isPresetActive,
    duplicatePreset,
    renamePreset,
    toggleQuickFilter,
    getPreset,
    canAddPreset,
    customPresetCount,
    importPresets,
    exportPresets,
  };
}

export default useFilterPresets;
