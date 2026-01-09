"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  useRef,
} from "react";
import { toast } from "@unisane/ui";
import { useI18n } from "../i18n";
import type {
  FeedbackContextValue,
  FeedbackProviderProps,
  FeedbackType,
  FeedbackParams,
  FeedbackOptions,
} from "./types";
import type { ToastVariant } from "@unisane/ui";

// ─── CONTEXT ────────────────────────────────────────────────────────────────

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

// ─── HOOK ───────────────────────────────────────────────────────────────────

export function useFeedback(): FeedbackContextValue {
  const context = useContext(FeedbackContext);
  if (!context) {
    // Return a no-op implementation if used outside provider
    // This allows components to optionally use feedback without requiring the provider
    return {
      feedback: () => {},
      customFeedback: () => {},
      announce: () => {},
      enabled: false,
    };
  }
  return context;
}

// ─── ARIA LIVE REGION ───────────────────────────────────────────────────────
// Invisible region for screen reader announcements

interface AriaLiveRegionProps {
  message: string;
  politeness: "polite" | "assertive";
}

function AriaLiveRegion({ message, politeness }: AriaLiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ─── PROVIDER ───────────────────────────────────────────────────────────────

export function FeedbackProvider({
  children,
  disabled = false,
  disableToasts = false,
  disableAnnouncements = false,
}: FeedbackProviderProps) {
  const { t } = useI18n();

  // State for ARIA live region announcements
  const [announcement, setAnnouncement] = useState<{
    message: string;
    politeness: "polite" | "assertive";
    key: number;
  } | null>(null);

  const announcementKey = useRef(0);

  // Clear announcement after it's been read
  useEffect(() => {
    if (announcement) {
      const timer = setTimeout(() => setAnnouncement(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [announcement]);

  // Get message and variant for a feedback type
  const getFeedbackConfig = useCallback(
    (
      type: FeedbackType,
      params: FeedbackParams = {}
    ): { message: string; variant: ToastVariant; srMessage?: string } => {
      switch (type) {
        // ─── Clipboard Operations ───
        case "copy":
          return {
            message: t("srCellsCopied", { count: params.count ?? 1 }),
            variant: "success",
          };
        case "copyFailed":
          return {
            message: t("pasteFailed"),
            variant: "error",
          };
        case "paste":
          return {
            message: t("pasteSuccess", { count: params.count ?? 1 }),
            variant: "success",
            srMessage: t("srCellsPasted", { count: params.count ?? 1 }),
          };
        case "pasteFailed":
          return {
            message: t("pasteFailed"),
            variant: "error",
          };
        case "pasteValidationError":
          return {
            message: t("pasteValidationError", { count: params.count ?? 1 }),
            variant: "warning",
          };

        // ─── Export Operations ───
        case "exportStarted":
          return {
            message: t("exportStarted", { format: params.format ?? "file" }),
            variant: "info",
          };
        case "exportSuccess":
          return {
            message: t("exportSuccess", { format: params.format ?? "file" }),
            variant: "success",
          };
        case "exportFailed":
          return {
            message: t("exportFailed"),
            variant: "error",
          };

        // ─── Selection Operations ───
        case "rowSelected":
          return {
            message: t("srRowSelected", { id: params.id ?? "" }),
            variant: "default",
            srMessage: t("srRowSelected", { id: params.id ?? "" }),
          };
        case "rowDeselected":
          return {
            message: t("srRowDeselected", { id: params.id ?? "" }),
            variant: "default",
            srMessage: t("srRowDeselected", { id: params.id ?? "" }),
          };
        case "allSelected":
          return {
            message: t("srAllSelected", { count: params.count ?? 0 }),
            variant: "success",
            srMessage: t("srAllSelected", { count: params.count ?? 0 }),
          };
        case "allDeselected":
          return {
            message: t("srAllDeselected"),
            variant: "default",
            srMessage: t("srAllDeselected"),
          };
        case "selectionCleared":
          return {
            message: t("srAllDeselected"),
            variant: "default",
            srMessage: t("srAllDeselected"),
          };

        // ─── Sort/Filter Operations ───
        case "sortApplied":
          return {
            message: t("srSortedAsc", { column: params.column ?? "" }),
            variant: "default",
            srMessage: t("srSortedAsc", { column: params.column ?? "" }),
          };
        case "sortCleared":
          return {
            message: t("srNotSorted"),
            variant: "default",
            srMessage: t("srNotSorted"),
          };
        case "filterApplied":
          return {
            message: t("srFilterApplied", { count: params.count ?? 1 }),
            variant: "default",
            srMessage: t("srFilterApplied", { count: params.count ?? 1 }),
          };
        case "filterCleared":
          return {
            message: t("srFilterCleared"),
            variant: "default",
            srMessage: t("srFilterCleared"),
          };

        // ─── Grouping Operations ───
        case "groupApplied":
          return {
            message: t("groupApplied", { column: params.column ?? "" }),
            variant: "default",
          };
        case "groupRemoved":
          return {
            message: t("removeGrouping"),
            variant: "default",
          };
        case "groupExpanded":
          return {
            message: t("srGroupExpanded", { label: params.label ?? "" }),
            variant: "default",
            srMessage: t("srGroupExpanded", { label: params.label ?? "" }),
          };
        case "groupCollapsed":
          return {
            message: t("srGroupCollapsed", { label: params.label ?? "" }),
            variant: "default",
            srMessage: t("srGroupCollapsed", { label: params.label ?? "" }),
          };

        // ─── Row Operations ───
        case "rowMoved":
          return {
            message: t("srRowMoved", {
              from: params.from ?? 0,
              to: params.to ?? 0,
            }),
            variant: "success",
            srMessage: t("srRowMoved", {
              from: params.from ?? 0,
              to: params.to ?? 0,
            }),
          };
        case "rowEdited":
          return {
            message: t("cellUpdated"),
            variant: "success",
          };
        case "rowDeleted":
          return {
            message: t("rowDeleted"),
            variant: "success",
          };

        // ─── Undo/Redo Operations ───
        case "undone":
          return {
            message: t("srUndone", {
              description: params.description ?? "change",
            }),
            variant: "default",
            srMessage: t("srUndone", {
              description: params.description ?? "change",
            }),
          };
        case "redone":
          return {
            message: t("srRedone", {
              description: params.description ?? "change",
            }),
            variant: "default",
            srMessage: t("srRedone", {
              description: params.description ?? "change",
            }),
          };
        case "nothingToUndo":
          return {
            message: t("nothingToUndo"),
            variant: "info",
          };
        case "nothingToRedo":
          return {
            message: t("nothingToRedo"),
            variant: "info",
          };

        // ─── Preset Operations ───
        case "presetSaved":
          return {
            message: t("presetSaved", { name: params.name ?? "" }),
            variant: "success",
            srMessage: t("srPresetSaved", { name: params.name ?? "" }),
          };
        case "presetApplied":
          return {
            message: t("presetApplied", { name: params.name ?? "" }),
            variant: "success",
            srMessage: t("srPresetApplied", { name: params.name ?? "" }),
          };
        case "presetDeleted":
          return {
            message: t("presetDeleted", { name: params.name ?? "" }),
            variant: "success",
          };

        // ─── General ───
        case "success":
          return {
            message: params.description ?? "Success",
            variant: "success",
          };
        case "error":
          return {
            message: params.description ?? "Error",
            variant: "error",
          };
        case "info":
          return {
            message: params.description ?? "Info",
            variant: "info",
          };
        case "warning":
          return {
            message: params.description ?? "Warning",
            variant: "warning",
          };

        default:
          return {
            message: "Unknown action",
            variant: "default",
          };
      }
    },
    [t]
  );

  // Announce to screen readers
  const announce = useCallback(
    (message: string, politeness: "polite" | "assertive" = "polite") => {
      if (disabled || disableAnnouncements) return;

      announcementKey.current += 1;
      setAnnouncement({
        message,
        politeness,
        key: announcementKey.current,
      });
    },
    [disabled, disableAnnouncements]
  );

  // Show feedback notification
  const feedback = useCallback(
    (type: FeedbackType, params: FeedbackParams = {}) => {
      if (disabled) return;

      const config = getFeedbackConfig(type, params);

      // Show toast notification
      if (!disableToasts) {
        toast.show({
          message: config.message,
          variant: config.variant,
          duration: 3000,
        });
      }

      // Announce for screen readers
      if (!disableAnnouncements && config.srMessage) {
        announce(config.srMessage);
      }
    },
    [disabled, disableToasts, disableAnnouncements, getFeedbackConfig, announce]
  );

  // Show custom feedback notification
  const customFeedback = useCallback(
    (options: FeedbackOptions) => {
      if (disabled) return;

      const {
        message,
        description,
        variant = "default",
        duration = 5000,
        showToast = true,
        announce: shouldAnnounce = true,
        politeness = "polite",
        action,
      } = options;

      // Show toast notification
      if (showToast && !disableToasts) {
        toast.show({
          message,
          description,
          variant,
          duration,
          action,
        });
      }

      // Announce for screen readers
      if (shouldAnnounce && !disableAnnouncements) {
        const srMessage = description ? `${message}. ${description}` : message;
        announce(srMessage, politeness);
      }
    },
    [disabled, disableToasts, disableAnnouncements, announce]
  );

  const value: FeedbackContextValue = {
    feedback,
    customFeedback,
    announce,
    enabled: !disabled,
  };

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      {/* ARIA live region for screen reader announcements */}
      {announcement && (
        <AriaLiveRegion
          key={announcement.key}
          message={announcement.message}
          politeness={announcement.politeness}
        />
      )}
    </FeedbackContext.Provider>
  );
}
