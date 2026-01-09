'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@/components/ui/input-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { CheckCircle2, LogIn, Eye, EyeOff, ArrowLeft, Lock } from 'lucide-react';

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Simple client validation
      if (password.length < 8) throw new Error('Password must be at least 8 characters long.');
      if (password !== confirm) throw new Error('Passwords do not match.');
      const res = await fetch('/api/rest/v1/auth/password/reset/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, password, email }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as { message?: string } | null;
        throw new Error(payload?.message ?? 'Unable to reset password.');
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reset failed.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="rounded-full bg-green-100 p-3 text-green-700 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Password updated</h2>
          <p className="text-sm text-muted-foreground">You can now sign in with your new password.</p>
        </div>
        <Link href="/login" className="w-full">
          <Button className="w-full gap-2 font-medium">
            <LogIn className="h-4 w-4" /> Go to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">New password</Label>
        <InputGroup>
          <InputGroupAddon>
            <Lock className="h-4 w-4 text-muted-foreground/70" />
          </InputGroupAddon>
          <InputGroupInput
            id="password"
            type={showPwd ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="placeholder:text-muted-foreground/40"
          />
          <InputGroupAddon align="inline-end" className="bg-transparent border-l-0 hover:bg-transparent pr-2">
            <InputGroupButton
              aria-label={showPwd ? 'Hide password' : 'Show password'}
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowPwd((v) => !v)}
              className="text-muted-foreground/70 hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
        <p className="text-xs text-muted-foreground">Use at least 8 characters. A mix of letters, numbers, and symbols is recommended.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm" className="text-xs font-medium text-muted-foreground">Confirm new password</Label>
        <InputGroup>
          <InputGroupAddon>
            <Lock className="h-4 w-4 text-muted-foreground/70" />
          </InputGroupAddon>
          <InputGroupInput
            id="confirm"
            type={showConfirm ? 'text' : 'password'}
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="••••••••"
            className="placeholder:text-muted-foreground/40"
          />
          <InputGroupAddon align="inline-end" className="bg-transparent border-l-0 hover:bg-transparent pr-2">
            <InputGroupButton
              aria-label={showConfirm ? 'Hide password' : 'Show password'}
              variant="ghost"
              size="icon-xs"
              onClick={() => setShowConfirm((v) => !v)}
              className="text-muted-foreground/70 hover:text-foreground"
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      {error ? (
        <Alert variant="destructive" className="py-2">
          <AlertDescription>
            {error}
            {error.includes('Invalid or expired') && (
              <div className="mt-2">
                <Link href="/forgot-password" className="font-medium underline hover:text-foreground">
                  Request a new link
                </Link>
              </div>
            )}
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-col gap-4">
        <Button type="submit" disabled={isSubmitting} className="w-full font-medium">
          {isSubmitting ? 'Updating…' : 'Update password'}
        </Button>
        <Link href="/login" className="flex items-center justify-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </form>
  );
}
