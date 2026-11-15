import crypto from 'crypto';
import { cookies } from 'next/headers';
import * as db from './db';

export const COOKIE = 'td_session';
const DAYS = 30;
function secret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV !== 'production') return 'dev-only-secret-not-for-production';
  throw new Error('Set SESSION_SECRET (16+ random characters) in your environment variables.');
}
const mac = (v) => crypto.createHmac('sha256', secret()).update(v).digest('base64url');
const same = (a, b) => { const x = Buffer.from(String(a)), y = Buffer.from(String(b)); return x.length === y.length && crypto.timingSafeEqual(x, y); };

export function hashPassword(pw) { const salt = crypto.randomBytes(16).toString('hex'); return `scrypt$${salt}$${crypto.scryptSync(pw, salt, 64).toString('hex')}`; }
export function checkPassword(pw, stored) {
  const [alg, salt, hash] = String(stored || '').split('$'); if (alg !== 'scrypt' || !salt || !hash) return false;
  return same(crypto.scryptSync(String(pw), salt, 64).toString('hex'), hash);
}
export function sessionValue(userId) { const body = `${userId}.${Date.now() + DAYS * 864e5}`; return `${body}.${mac(body)}`; }
export function readSessionValue(v) {
  const p = String(v || '').split('.'); if (p.length !== 3) return null;
  const body = `${p[0]}.${p[1]}`; if (!same(mac(body), p[2])) return null;
  return Number(p[1]) > Date.now() ? p[0] : null;
}
// When the session was issued (ms), so a password reset can end every older session.
export function sessionIssuedAt(v) { const p = String(v || '').split('.'); return Number(p[1]) - DAYS * 864e5; }
export const cookieOpts = { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: DAYS * 86400 };

// Makes the first admin from environment variables, so there is never a public "become admin" door.
let boot = null;
export function ensureAdmin() {
  if (!boot) boot = (async () => {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase(), pw = process.env.ADMIN_PASSWORD;
    if (!email || !pw) return;
    const users = await db.list('users'); if (users.some((u) => u.email === email)) return;
    const id = `u-${db.uid()}`;
    await db.put('users', id, { id, email, name: process.env.ADMIN_NAME || 'Admin', role: 'admin', hash: hashPassword(pw), createdAt: new Date().toISOString(), agreedAt: new Date().toISOString() });
  })().catch(() => { boot = null; });
  return boot;
}
export async function currentUser() {
  await ensureAdmin();
  const id = readSessionValue(cookies().get(COOKIE)?.value); if (!id) return null;
  const u = await db.get('users', id).catch(() => null);
  if (!u || u.suspended) return null;
  if (u.sessionsAfter && sessionIssuedAt(cookies().get(COOKIE)?.value) < u.sessionsAfter) return null;
  return u;
}
// Active subscription, a free pass from the admin, or the admin themself.
export function hasAccess(u) {
  if (!u || u.suspended) return false;
  if (u.role === 'admin' || u.comp) return true;
  const st = u.sub?.status; return st === 'active' || st === 'trialing' || st === 'past_due';
}
export const safeUser = (u) => u && ({ id: u.id, name: u.name, email: u.email, role: u.role, comp: !!u.comp, sub: u.sub ? { status: u.sub.status, periodEnd: u.sub.periodEnd, cancelAtEnd: !!u.sub.cancelAtEnd } : null, bio: u.bio || '', photo: u.photo || '', city: u.city || '', phone: u.phone || '', cpr: u.cpr || null, agreedAt: u.agreedAt || null, createdAt: u.createdAt, suspended: !!u.suspended, listed: u.listed !== false });
