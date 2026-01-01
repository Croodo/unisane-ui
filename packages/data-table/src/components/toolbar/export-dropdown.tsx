"use client";

import {
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
  isFirst?: boolean;
  isLast?: boolean;
}

export function ExportDropdown({
  handler,
  segmented = false,
  isFirst = false,
  isLast = false,
}: ExportDropdownProps) {
  const { t } = useI18n();
  const { onExport, formats = DEFAULT_FORMATS, exporting } = handler;

  const isExporting = exporting !== null && exporting !== undefined;

  const trigger = segmented ? (
    <SegmentedDropdownButton
      icon={isExporting ? "hourglass_empty" : "download"}
      isFirst={isFirst}
      isLast={isLast}
    />
  ) : (
    <ToolbarDropdownButton
      label={t("export")}
      icon={isExporting ? "hourglass_empty" : "download"}
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
              onClick={() => onExport(format)}
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
