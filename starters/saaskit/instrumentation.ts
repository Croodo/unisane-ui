/**
 * Next.js Instrumentation
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * This file is called once when the Node.js runtime starts.
 * Used to initialize database connections, configure providers, etc.
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { bootstrap } = await import('@/src/bootstrap');
    await bootstrap();
  }
}
