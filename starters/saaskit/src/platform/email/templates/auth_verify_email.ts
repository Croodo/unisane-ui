export function renderAuthVerifyEmail(args: { brand: { name: string }; props?: { url?: string } }) {
  const url = args.props?.url ?? '#';
  const subject = `Verify your email for ${args.brand.name}`;
  const html = `
    <div>
      <h2>${escapeHtml(subject)}</h2>
      <p>Please confirm your email address to finish setting up your account.</p>
      <p><a href="${escapeAttr(url)}" target="_blank" rel="noopener">Verify email</a></p>
      <p>If the button doesn’t work, copy and paste this URL into your browser:<br/>${escapeHtml(url)}</p>
    </div>
  `;
  const text = `${subject}\n\nOpen this link to verify:\n${url}`;
  return { subject, html, text } as const;
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;').replace(/'/g, '&#039;');
}
function escapeAttr(s: string) {
  return s.replace(/"/g, '&quot;');
}

