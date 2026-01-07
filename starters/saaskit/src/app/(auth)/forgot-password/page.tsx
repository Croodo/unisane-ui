
import type { Metadata } from "next";
import { ForgotPasswordForm } from "./request-reset-form";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Reset access to your account.",
};

export default async function ForgotPasswordPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tokenParam = sp?.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam;
  const emailParam = sp?.email;
  const email = Array.isArray(emailParam) ? emailParam[0] : emailParam;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="flex w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border bg-card shadow-none md:flex-row md:shadow-xl md:shadow-black/2">
        <div className="flex flex-1 flex-col justify-center bg-muted/10 p-8 md:p-16">
          <div className="max-w-sm">
            <div className="mb-8">
              <div className="h-8 w-8 rounded-full bg-primary/20" />
            </div>
            <h1 className="text-4xl font-normal tracking-tight text-foreground md:text-5xl">
              {token ? 'Reset password' : 'Forgot password?'}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              {token ? 'Enter your new password below' : 'Enter your email to reset your password'}
            </p>
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center p-8 md:p-16">
          <div className="mx-auto w-full max-w-sm">
            {token ? <ResetPasswordForm token={token ?? ''} email={email ?? ''} /> : <ForgotPasswordForm />}
          </div>
        </div>
      </div>
      <div className="mt-8 flex w-full max-w-5xl justify-end gap-6 text-xs text-muted-foreground">
        <a href="/terms" className="hover:text-primary">
          Terms of Service
        </a>
        <a href="/privacy" className="hover:text-primary">
          Privacy Policy
        </a>
      </div>
    </div>
  );
}
