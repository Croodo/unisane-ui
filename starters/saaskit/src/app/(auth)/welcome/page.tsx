"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
// Use the browser auto SDK for creating a tenant

import { RequireAuth } from '@/src/components/auth/RequireAuth';

export default function WelcomePage() {
  const router = useRouter();
  // Using SDK client for simple create
  const [name, setName] = useState('My Workspace');
  const [slug, setSlug] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { createApi } = await import('@/src/sdk');
      const api = await createApi();
      const t = await api.tenants.create({ name, ...(slug.trim() ? { slug: slug.trim() } : {}) });
      const dest = t.slug ? `/w/${t.slug}` : '/';
      router.replace(dest);
      router.refresh();
    } catch (e) {
      const msg = (e as { message?: string }).message ?? 'Failed to create workspace';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RequireAuth>
      <main className="mx-auto max-w-lg p-6">
        <h1 className="mb-2 text-xl font-semibold">Create your workspace</h1>
        <p className="mb-4 text-sm text-muted-foreground">You don’t have a workspace yet. Create one to get started.</p>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <label className="text-sm">
            <div className="mb-1">Name</div>
            <input className="w-full rounded border px-3 py-2" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={80} />
          </label>
          <label className="text-sm">
            <div className="mb-1">Slug (optional)</div>
            <input className="w-full rounded border px-3 py-2" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. acme" />
            <div className="mt-1 text-xs text-muted-foreground">Lowercase letters, numbers, and dashes only. We’ll make it unique if taken.</div>
          </label>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button type="submit" disabled={isSubmitting} className="mt-1 rounded bg-primary px-4 py-2 text-white disabled:opacity-50">
            {isSubmitting ? 'Creating…' : 'Create workspace'}
          </button>
        </form>
      </main>
    </RequireAuth>
  );
}
