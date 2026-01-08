import { getSetting } from '@unisane/settings';
import { renderWelcome } from './welcome';
import { renderAuthVerifyEmail } from './auth_verify_email';
import { renderAuthPasswordReset } from './auth_password_reset';

export type RenderInput = {
  tenantId?: string | null;
  template: string;
  props?: Record<string, unknown>;
  locale?: string;
};

export type RenderOutput = { subject: string; html: string; text: string };

type Renderer = (args: RenderInput & { brand: { name: string } }) => RenderOutput;

const registry: Record<string, Renderer> = {
  welcome: ({ brand, props }) => renderWelcome({ brand, ...(props ? { props } : {}) }),
  auth_verify_email: ({ brand, props }) => renderAuthVerifyEmail({ brand, ...(props ? { props: props as { url?: string } } : {}) }),
  auth_password_reset: ({ brand, props }) => renderAuthPasswordReset({ brand, ...(props ? { props: props as { url?: string } } : {}) }),
};

export async function renderEmail(input: RenderInput): Promise<RenderOutput> {
  const brand = await getBrand(input.tenantId ?? null);
  const r = registry[input.template] ?? defaultRenderer;
  return r({ ...input, brand });
}

async function getBrand(tenantId: string | null): Promise<{ name: string }> {
  try {
    const s = await getSetting({ tenantId, ns: 'branding', key: 'name' });
    if (s && typeof s.value === 'string' && s.value.trim()) return { name: String(s.value) };
  } catch {}
  return { name: 'Your App' };
}

function defaultRenderer(args: RenderInput & { brand: { name: string } }): RenderOutput {
  const { template, props } = args;
  const subject = template;
  return {
    subject,
    html: `<div><h2>${escapeHtml(subject)}</h2><pre>${escapeHtml(JSON.stringify(props ?? {}, null, 2))}</pre></div>`,
    text: `Subject: ${subject}\n\n${JSON.stringify(props ?? {}, null, 2)}`,
  };
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}
