"use client";

import { useCallback } from "react";
import {
  useFilterPresets,
  type UseFilterPresetsOptions,
  type UseFilterPresetsReturn,
  type FilterPreset,
  type FilterPresetInput,
} from "./use-filter-presets";
import { useFeedback } from "../../feedback";

export interface UseFilterPresetsWithFeedbackOptions
  extends UseFilterPresetsOptions {
  /**
   * Show toast notification on preset operations.
   * @default true
   */
  showFeedback?: boolean;
}

export interface UseFilterPresetsWithFeedbackReturn
  extends UseFilterPresetsReturn {}

/**
 * Enhanced filter presets hook with integrated feedback notifications.
 *
 * This is a convenience wrapper around useFilterPresets that automatically
 * triggers toast notifications and ARIA announcements for preset operations.
 *
 * @example
 * ```tsx
 * const presets = useFilterPresetsWithFeedback({
 *   storageKey: "my-table-presets",
 * });
 *
 * // Preset operations will automatically show feedback
 * presets.savePreset({ name: "My Filter", filters: currentFilters });
 * presets.applyPreset("preset-id");
 * presets.deletePreset("preset-id");
 * ```
 */
export function useFilterPresetsWithFeedback({
  showFeedback = true,
  ...options
}: UseFilterPresetsWithFeedbackOptions): UseFilterPresetsWithFeedbackReturn {
  const { feedback } = useFeedback();
  const presetsHook = useFilterPresets(options);

  // Wrap savePreset to add feedback
  const savePresetWithFeedback = useCallback(
    (input: FilterPresetInput): FilterPreset | null => {
      const preset = presetsHook.savePreset(input);
      if (showFeedback && preset) {
        feedback("presetSaved", { name: preset.name });
      }
      return preset;
    },
    [presetsHook, feedback, showFeedback]
  );

  // Wrap applyPreset to add feedback
  const applyPresetWithFeedback = useCallback(
    (presetOrId: FilterPreset | string): boolean => {
      const id = typeof presetOrId === "string" ? presetOrId : presetOrId.id;
      const preset = presetsHook.presets.find((p) => p.id === id);
      const success = presetsHook.applyPreset(presetOrId);
      if (success && showFeedback && preset) {
        feedback("presetApplied", { name: preset.name });
      }
      return success;
    },
    [presetsHook, feedback, showFeedback]
  );

  // Wrap deletePreset to add feedback
  const deletePresetWithFeedback = useCallback(
    (id: string): boolean => {
      const preset = presetsHook.presets.find((p) => p.id === id);
      const success = presetsHook.deletePreset(id);
      if (success && showFeedback && preset) {
        feedback("presetDeleted", { name: preset.name });
      }
      return success;
    },
    [presetsHook, feedback, showFeedback]
  );

  return {
    ...presetsHook,
    savePreset: savePresetWithFeedback,
    applyPreset: applyPresetWithFeedback,
    deletePreset: deletePresetWithFeedback,
  };
}

export default useFilterPresetsWithFeedback;
