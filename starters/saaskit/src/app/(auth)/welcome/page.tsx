"use client";

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { Button } from '@unisane/ui/components/button';
import { TextField } from '@unisane/ui/components/text-field';
import { Typography } from '@unisane/ui/components/typography';
import { Card } from '@unisane/ui/components/card';
import { Alert } from '@unisane/ui/components/alert';

export default function WelcomePage() {
  const router = useRouter();
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
        <Card variant="outlined" className="p-6">
          <Typography variant="headlineSmall" className="mb-2">Create your workspace</Typography>
          <Typography variant="bodyMedium" className="mb-6 text-on-surface-variant">
            You don't have a workspace yet. Create one to get started.
          </Typography>
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <TextField
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={80}
            />
            <TextField
              label="Slug (optional)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g. acme"
              helperText="Lowercase letters, numbers, and dashes only. We'll make it unique if taken."
            />
            {error && (
              <Alert variant="error" title="Error">
                {error}
              </Alert>
            )}
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creating…' : 'Create workspace'}
            </Button>
          </form>
        </Card>
      </main>
    </RequireAuth>
  );
}
