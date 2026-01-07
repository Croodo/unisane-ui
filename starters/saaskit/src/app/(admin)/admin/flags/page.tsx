import { getEnv } from '@unisane/kernel';
import { FlagsClient } from './FlagsClient';

export const runtime = 'nodejs';

export default async function AdminFlagsPage() {
  const env = getEnv().APP_ENV;
  return <FlagsClient env={env} />;
}

