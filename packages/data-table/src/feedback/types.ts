// ─── FEEDBACK SYSTEM TYPES ──────────────────────────────────────────────────
// Types for the DataTable feedback system that handles toasts and ARIA announcements

import type { ToastVariant } from "@unisane/ui";

/**
 * Feedback notification options
 */
export interface FeedbackOptions {
  /** Main message to display */
  message: string;
  /** Optional description with more details */
  description?: string;
  /** Visual variant for toast */
  variant?: ToastVariant;
  /** Duration in ms (0 = persistent). Default: 5000 */
  duration?: number;
  /** Whether to show as toast. Default: true */
  showToast?: boolean;
  /** Whether to announce for screen readers. Default: true */
  announce?: boolean;
  /** ARIA live politeness. Default: "polite" */
  politeness?: "polite" | "assertive";
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Pre-configured feedback types for common operations
 */
export type FeedbackType =
  // Clipboard operations
  | "copy"
  | "copyFailed"
  | "paste"
  | "pasteFailed"
  | "pasteValidationError"
  // Export operations
  | "exportStarted"
  | "exportSuccess"
  | "exportFailed"
  // Selection operations
  | "rowSelected"
  | "rowDeselected"
  | "allSelected"
  | "allDeselected"
  | "selectionCleared"
  // Sort/Filter operations
  | "sortApplied"
  | "sortCleared"
  | "filterApplied"
  | "filterCleared"
  // Grouping operations
  | "groupApplied"
  | "groupRemoved"
  | "groupExpanded"
  | "groupCollapsed"
  // Row operations
  | "rowMoved"
  | "rowEdited"
  | "rowDeleted"
  // Undo/Redo operations
  | "undone"
  | "redone"
  | "nothingToUndo"
  | "nothingToRedo"
  // Preset operations
  | "presetSaved"
  | "presetApplied"
  | "presetDeleted"
  // General
  | "success"
  | "error"
  | "info"
  | "warning";

/**
 * Parameters for feedback messages that need interpolation
 */
export interface FeedbackParams {
  count?: number;
  column?: string;
  label?: string;
  name?: string;
  from?: number;
  to?: number;
  description?: string;
  format?: string;
  id?: string;
}

/**
 * Feedback context value
 */
export interface FeedbackContextValue {
  /** Show a feedback notification */
  feedback: (type: FeedbackType, params?: FeedbackParams) => void;
  /** Show a custom feedback notification */
  customFeedback: (options: FeedbackOptions) => void;
  /** Announce to screen readers only (no toast) */
  announce: (message: string, politeness?: "polite" | "assertive") => void;
  /** Whether feedback system is enabled */
  enabled: boolean;
}

/**
 * Provider props
 */
export interface FeedbackProviderProps {
  children: React.ReactNode;
  /** Disable all feedback (useful for testing). Default: false */
  disabled?: boolean;
  /** Disable toast notifications. Default: false */
  disableToasts?: boolean;
  /** Disable ARIA announcements. Default: false */
  disableAnnouncements?: boolean;
}
