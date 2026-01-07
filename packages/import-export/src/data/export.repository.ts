export type { ImportJobView as ImportJob, ExportJobView as ExportJob } from '../domain/types';
import type { JobsRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { JobsRepoMongo } from './export.repository.mongo';

export const JobsRepo = selectRepo<JobsRepoPort>({ mongo: JobsRepoMongo });
