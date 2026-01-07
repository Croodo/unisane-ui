export function renderAuthPasswordReset(args: { brand: { name: string }; props?: { url?: string } }) {
  const url = args.props?.url ?? '#';
  const subject = `Reset your ${args.brand.name} password`;
  const html = `
    <div>
      <h2>${escapeHtml(subject)}</h2>
      <p>We received a request to reset your password. If you didn’t make this request, you can safely ignore this email.</p>
      <p><a href="${escapeAttr(url)}" target="_blank" rel="noopener">Reset password</a></p>
      <p>If the button doesn’t work, copy and paste this URL into your browser:<br/>${escapeHtml(url)}</p>
    </div>
  `;
  const text = `${subject}\n\nOpen this link to reset:\n${url}`;
  return { subject, html, text } as const;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttr(s: string) {
  return s.replace(/"/g, '&quot;');
}

