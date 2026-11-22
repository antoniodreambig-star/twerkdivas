// Transactional email through Brevo (https://www.brevo.com). Needs BREVO_API_KEY and EMAIL_FROM (a sender you verified in Brevo).
export const emailOn = () => !!(process.env.BREVO_API_KEY && process.env.EMAIL_FROM);
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function appUrl(req) { const e = (process.env.APP_URL || '').trim().replace(/\/$/, ''); return e || new URL(req.url).origin; }
export function layout(title, body) {
  return `<div style="font-family:Arial,sans-serif;background:#FFF4F9;padding:24px"><div style="max-width:520px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #F6D3E3"><div style="background:#0B0B10;border-bottom:4px solid #FF1A7E;padding:18px 24px;color:#fff;font-weight:800;font-style:italic;font-size:22px;letter-spacing:.06em">CAKES <span style="color:#FF1A7E">AND CORE</span><div style="font-size:11px;letter-spacing:.28em;color:#F2F2F5;font-weight:700;margin-top:2px">TWERK FITNESS</div></div><div style="padding:24px;color:#14060F;line-height:1.55"><h2 style="margin:0 0 12px">${esc(title)}</h2>${body}</div></div></div>`;
}
export const button = (href, label) => `<p><a href="${esc(href)}" style="display:inline-block;background:#FF1A7E;color:#fff;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:12px;border:2px solid #0B0B10">${esc(label)}</a></p>`;
export async function sendEmail({ to, subject, html, attachment }) {
  if (!emailOn()) return { sent: false, reason: 'not configured' };
  const m = /^(.*)<(.+)>$/.exec(process.env.EMAIL_FROM.trim()); const sender = m ? { name: m[1].trim().replace(/^"|"$/g, '') || 'Cakes and Core', email: m[2].trim() } : { name: 'Cakes and Core', email: process.env.EMAIL_FROM.trim() };
  try {
    const r = await fetch('https://api.brevo.com/v3/smtp/email', { method: 'POST', headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify({ sender, to: [{ email: to }], subject, htmlContent: html, ...(attachment ? { attachment } : {}) }), cache: 'no-store' });
    return { sent: r.ok, reason: r.ok ? '' : `Brevo ${r.status}` };
  } catch (e) { return { sent: false, reason: e.message }; }
}
