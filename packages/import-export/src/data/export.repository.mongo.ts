import { col } from "@unisane/kernel";
import { ObjectId } from 'mongodb';
import type { Document, Filter, InsertOneResult, UpdateFilter, OptionalId } from 'mongodb';
import type { JobsRepoPort } from "../domain/ports";
import type { ImportJobView, ExportJobView } from "../domain/types";
import type { JobStatus, ExportFormat, ImportFormat } from '@unisane/kernel';
import { maybeObjectId } from "@unisane/kernel";

type ImportJobDoc = {
  _id?: ObjectId;
  tenantId: string;
  resource: string;
  format: ImportFormat;
  status: JobStatus;
  source?: string | null;
  url?: string | null;
  items?: number | null;
  error?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

type ExportJobDoc = {
  _id?: ObjectId;
  tenantId: string;
  resource: string;
  format: ExportFormat;
  status: JobStatus;
  key: string;
  error?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

const importCol = () => col<ImportJobDoc>('import_jobs');
const exportCol = () => col<ExportJobDoc>('export_jobs');

export const JobsRepoMongo: JobsRepoPort = {
  async createImport(meta) {
    const now = new Date();
    const r: InsertOneResult<Document> = await importCol().insertOne({
      tenantId: meta.tenantId,
      resource: meta.resource,
      format: meta.format,
      status: "queued",
      source: meta.source ?? null,
      url: null,
      items: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    } as OptionalId<ImportJobDoc>);
    const status = 'queued' as JobStatus;
    return {
      id: String(r.insertedId),
      tenantId: meta.tenantId,
      resource: meta.resource,
      format: meta.format as ImportFormat,
      status,
      createdAt: now,
    } as ImportJobView;
  },
  async createExport(meta) {
    const now = new Date();
    const r: InsertOneResult<Document> = await exportCol().insertOne({
      tenantId: meta.tenantId,
      resource: meta.resource,
      format: meta.format,
      status: "queued",
      key: meta.key,
      error: null,
      createdAt: now,
      updatedAt: now,
    } as OptionalId<ExportJobDoc>);
    const status = 'queued' as JobStatus;
    return {
      id: String(r.insertedId),
      tenantId: meta.tenantId,
      resource: meta.resource,
      format: meta.format as ExportFormat,
      status,
      createdAt: now,
      key: meta.key,
    } as ExportJobView;
  },
  async listQueuedExports(limit = 20) {
    const rows = await exportCol()
      .find({ status: "queued" } as Filter<ExportJobDoc>)
      .sort({ createdAt: 1 })
      .limit(limit)
      .toArray();
    return rows.map((r) => ({
      id: String(r._id),
      tenantId: r.tenantId,
      resource: r.resource,
      format: r.format as ExportFormat,
      status: r.status as JobStatus,
      createdAt: r.createdAt as Date,
      key: r.key,
    }));
  },
  async markExportRunning(id: string) {
    await exportCol().updateOne(
      { _id: maybeObjectId(id) as unknown } as Filter<ExportJobDoc>,
      { $set: { status: "running", error: null, updatedAt: new Date() } } as UpdateFilter<ExportJobDoc>
    );
  },
  async markExportDone(id: string) {
    await exportCol().updateOne(
      { _id: maybeObjectId(id) as unknown } as Filter<ExportJobDoc>,
      { $set: { status: "done", updatedAt: new Date() } } as UpdateFilter<ExportJobDoc>
    );
  },
  async markExportFailed(id: string, error: string) {
    await exportCol().updateOne(
      { _id: maybeObjectId(id) as unknown } as Filter<ExportJobDoc>,
      { $set: { status: "failed", error, updatedAt: new Date() } } as UpdateFilter<ExportJobDoc>
    );
  },
  async getExportById(tenantId: string, id: string) {
    const r = await exportCol().findOne({ _id: maybeObjectId(id) as unknown, tenantId } as Filter<ExportJobDoc>);
    if (!r) return null;
    const status = r.status as JobStatus;
    return {
      id: String(r._id),
      tenantId: r.tenantId,
      resource: r.resource,
      format: r.format as ExportFormat,
      status,
      createdAt: r.createdAt as Date,
      key: r.key,
    } as ExportJobView;
  },
};
