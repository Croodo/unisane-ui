import type { TenantsRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { TenantsRepoMongo } from './tenants.repository.mongo';

export const TenantsRepo = selectRepo<TenantsRepoPort>({ mongo: TenantsRepoMongo });

