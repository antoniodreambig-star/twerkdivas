// Transactional email through Brevo (https://www.brevo.com). Needs BREVO_API_KEY and EMAIL_FROM (a sender you verified in Brevo).
export const emailOn = () => !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function appUrl(req) { const e = (process.env.APP_URL || '').trim().replace(/\/$/, ''); return e || new URL(req.url).origin; }
export function layout(title, body) {
  return `<div style="font-family:Arial,sans-serif;background:#f6f1ff;padding:24px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5d9fb"><div style="background:#4a14c7;padding:18px 24px;color:#fff;font-weight:800;font-size:20px;letter-spacing:.04em">TWERK<span style="color:#f4ff3a">DIVAS</span></div><div style="padding:24px;color:#1d0b4a;line-height:1.55"><h2 style="margin:0 0 12px">${esc(title)}</h2>${body}</div></div></div>`;
}
export const button = (href, label) => `<p><a href="${esc(href)}" style="display:inline-block;background:#ff2d8a;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px">${esc(label)}</a></p>`;
export async function sendEmail({ to, subject, html }) {
  if (!emailOn()) return { sent: false, reason: 'not configured' };
  const m = /^(.*)<(.+)>$/.exec(process.env.EMAIL_FROM.trim()); const sender = m ? { name: m[1].trim().replace(/^"|"$/g, '') || 'TwerkDivas', email: m[2].trim() } : { name: 'TwerkDivas', email: process.env.EMAIL_FROM.trim() };
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html }), cache: 'no-store' });
    return { sent: r.ok, reason: r.ok ? '' : `Brevo ${r.status}` };
  } catch (e) { return { sent: false, reason: e.message }; }
}
