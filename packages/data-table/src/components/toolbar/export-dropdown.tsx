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

// ─── EXPORT FORMAT CONFIG ───────────────────────────────────────────────────

interface FormatConfig {
  label: string;
  icon: string;
  description: string;
}

const FORMAT_CONFIG: Record<ExportFormat, FormatConfig> = {
  csv: {
    label: "CSV",
    icon: "csv",
    description: "Comma-separated values",
  },
  excel: {
    label: "Excel",
    icon: "table_chart",
    description: "Microsoft Excel (.xlsx)",
  },
  pdf: {
    label: "PDF",
    icon: "picture_as_pdf",
    description: "Portable Document Format",
  },
  json: {
    label: "JSON",
    icon: "data_object",
    description: "JavaScript Object Notation",
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
      label="Export"
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
                <span>{config.label}</span>
                <span className="text-label-small text-on-surface-variant">
                  {config.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
