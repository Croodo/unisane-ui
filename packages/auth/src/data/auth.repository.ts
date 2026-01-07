import type { AuthCredentialRepoPort } from '../domain/ports';
import { selectRepo } from '@unisane/kernel';
import { AuthCredentialRepoMongo } from './auth.repository.mongo';

export const AuthCredentialRepo = selectRepo<AuthCredentialRepoPort>({ mongo: AuthCredentialRepoMongo });
