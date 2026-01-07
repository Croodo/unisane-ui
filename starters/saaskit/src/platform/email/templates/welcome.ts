export function renderWelcome(args: { brand: { name: string }; props?: Record<string, unknown> }) {
  const user = (args.props?.user as { name?: string } | undefined) ?? {};
  const subject = `Welcome to ${args.brand.name}`;
  const body = `Hello${user.name ? ' ' + user.name : ''}, welcome to ${args.brand.name}!`;
  return {
    subject,
    html: `<div><h2>${escapeHtml(subject)}</h2><p>${escapeHtml(body)}</p></div>`,
    text: `${subject}\n\n${body}`,
  } as const;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}

