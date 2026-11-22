import crypto from 'crypto';
import * as db from './db';
import { sendEmail, layout, button, esc } from './email';
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const code = () => Array.from(crypto.randomBytes(8), (b) => ALPHA[b % 31]).join('');
export const normCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
export async function markPassPaid(passId, { session = '', pi = '' } = {}) {
  let p = await db.get('passes', passId); if (!p || p.status === 'active') return p; if (p.status !== 'held') return p;
  const taken = new Set((await db.list('passes')).map((x) => x.code)); let c; do c = code(); while (taken.has(c));
  p = { ...p, status: 'active', code: c, session, pi, paidAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 365 * 864e5).toISOString() }; await db.put('passes', p.id, p);
  const base = (process.env.APP_URL || p.origin || '').replace(/\/$/, '');
  await sendEmail({ to: p.email, subject: `Your class pack: ${p.credits} credits`, html: layout('Your class pack is ready', `<p>Hi ${esc(String(p.name).split(' ')[0])}, you now have <b>${p.credits} class credits</b>.</p><p style="font-size:28px;font-weight:800;letter-spacing:.1em;color:#E0105F">${esc(c)}</p><p>Use this code and your email at checkout on any ticketed class. Valid until ${esc(new Date(p.expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))}.</p>${button(`${base}/classes`, 'Find a class')}`) }).catch(() => {});
  return p;
}
// Checks a pack code against the buyer's email and takes the credits. Returns the pass and the value of one credit.
export async function takeCredits({ code: c, email, qty }) {
  const k = normCode(c); const p = (await db.list('passes')).find((x) => x.code === k && x.status === 'active');
  if (!p || p.email !== String(email).toLowerCase()) throw new Error('That pack code does not match this email');
  if (Date.parse(p.expiresAt) < Date.now()) throw new Error('That pack has expired');
  if (p.credits - (p.used || 0) < qty) throw new Error(`That pack has ${p.credits - (p.used || 0)} credit${p.credits - (p.used || 0) === 1 ? '' : 's'} left`);
  await db.put('passes', p.id, { ...p, used: (p.used || 0) + qty });
  const again = await db.get('passes', p.id); if (again.used > again.credits) { await db.put('passes', p.id, { ...again, used: again.used - qty }); throw new Error('That pack has no credits left'); }
  return { pass: p, unit: Math.round(p.price / p.credits) };
}
