import type { z } from "zod";
import type {
  ZExportStart,
  ZImportStart,
} from "./schemas";
import type {
  JobStatus,
  ExportFormat,
  ImportFormat,
  ImportSource,
} from "@unisane/kernel";

export type ImportStart = z.infer<typeof ZImportStart>;
export type ExportStart = z.infer<typeof ZExportStart>;

export type ImportJobView = {
  id: string;
  tenantId: string;
  resource: string;
  format: ImportFormat;
  status: JobStatus;
  createdAt: Date;
};

export type ExportJobView = {
  id: string;
  tenantId: string;
  resource: string;
  format: ExportFormat;
  status: JobStatus;
  createdAt: Date;
  key: string;
};

export type StartExportArgs = {
  resource: string;
  format?: ExportFormat;
  filter?: Record<string, unknown>;
};

export type StartImportArgs = {
  resource: string;
  format: ImportFormat;
  source?: ImportSource;
  url?: string;
  items?: Array<Record<string, unknown>>;
  headers?: Record<string, string>;
};
