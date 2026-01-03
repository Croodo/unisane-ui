"use client";

import React, { useCallback } from "react";
import {
  cn,
  Icon,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@unisane/ui";
import type { ExportFormat } from "../../utils/export";
import type { ExportHandler } from "./types";
import { ToolbarDropdownButton, SegmentedDropdownButton } from "./buttons";
import { useI18n } from "../../i18n";
import { useFeedback } from "../../feedback";

// ─── EXPORT FORMAT CONFIG ───────────────────────────────────────────────────

interface FormatConfig {
  labelKey: "exportCsv" | "exportExcel" | "exportPdf" | "exportJson";
  icon: string;
  descriptionKey: "exportCsvDesc" | "exportExcelDesc" | "exportPdfDesc" | "exportJsonDesc";
}

const FORMAT_CONFIG: Record<ExportFormat, FormatConfig> = {
  csv: {
    labelKey: "exportCsv",
    icon: "csv",
    descriptionKey: "exportCsvDesc",
  },
  excel: {
    labelKey: "exportExcel",
    icon: "table_chart",
    descriptionKey: "exportExcelDesc",
  },
  pdf: {
    labelKey: "exportPdf",
    icon: "picture_as_pdf",
    descriptionKey: "exportPdfDesc",
  },
  json: {
    labelKey: "exportJson",
    icon: "data_object",
    descriptionKey: "exportJsonDesc",
  },
};

const DEFAULT_FORMATS: ExportFormat[] = ["csv", "excel", "pdf", "json"];

// ─── EXPORT DROPDOWN ────────────────────────────────────────────────────────

export interface ExportDropdownProps {
  handler: ExportHandler;
  segmented?: boolean;
  /** Icon-only mode for mobile */
  compact?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ExportDropdown({
  handler,
  segmented = false,
  compact = false,
  isFirst = false,
  isLast = false,
}: ExportDropdownProps) {
  const { t } = useI18n();
  const { feedback } = useFeedback();
  const { onExport, formats = DEFAULT_FORMATS, exporting } = handler;

  const isExporting = exporting !== null && exporting !== undefined;
  const iconSymbol = isExporting ? "hourglass_empty" : "download";

  // Wrap onExport to add feedback
  const handleExport = useCallback(
    async (format: ExportFormat) => {
      try {
        feedback("exportStarted", { format: format.toUpperCase() });
        await onExport(format);
        feedback("exportSuccess", { format: format.toUpperCase() });
      } catch {
        feedback("exportFailed");
      }
    },
    [onExport, feedback]
  );

  const trigger = segmented ? (
    <SegmentedDropdownButton
      icon={iconSymbol}
      isFirst={isFirst}
      isLast={isLast}
    />
  ) : compact ? (
    <button
      className={cn(
        // Touch-friendly: 44px on mobile
        "flex items-center justify-center w-11 h-11 rounded-lg transition-colors",
        "text-on-surface-variant hover:text-on-surface hover:bg-on-surface/8",
        isExporting && "animate-pulse"
      )}
      aria-label={t("export")}
      title={t("export")}
    >
      <Icon symbol={iconSymbol} className="w-5 h-5" />
    </button>
  ) : (
    <ToolbarDropdownButton
      label={t("export")}
      icon={iconSymbol}
      as="div"
    />
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        {formats.map((format) => {
          const config = FORMAT_CONFIG[format];
          const isCurrentExporting = exporting === format;

          return (
            <DropdownMenuItem
              key={format}
              onClick={() => handleExport(format)}
              disabled={isExporting}
              icon={
                isCurrentExporting ? (
                  <Icon symbol="hourglass_empty" className="w-5 h-5 animate-spin" />
                ) : (
                  <Icon symbol={config.icon} className="w-5 h-5" />
                )
              }
            >
              <div className="flex flex-col">
                <span>{t(config.labelKey)}</span>
                <span className="text-label-small text-on-surface-variant">
                  {t(config.descriptionKey)}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
