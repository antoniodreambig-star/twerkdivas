export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { hashPassword, sessionValue, COOKIE, cookieOpts, ensureAdmin } from '@/lib/auth';
import { isEmail, str, AGREEMENT_VERSION } from '@/lib/rules';
const hits = new Map();
export async function POST(req) {
  try {
    const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
    const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 8) return NextResponse.json({ error: 'Too many sign-ups from here. Try again later.' }, { status: 429 }); hits.set(ip, [...h, now]);
    await ensureAdmin();
    const b = await req.json(); const email = str(b.email, 120).toLowerCase(), name = str(b.name, 80), pw = String(b.password || '');
    if (!name) throw new Error('Add your name'); if (!isEmail(email)) throw new Error('Enter a valid email');
    if (pw.length < 8) throw new Error('Use a password of at least 8 characters'); if (!b.agree) throw new Error('Please accept the instructor agreement');
    if ((await db.list('users')).some((u) => u.email === email)) throw new Error('That email already has an account. Sign in instead.');
    const id = `u-${db.uid()}`;
    await db.put('users', id, { id, email, name, role: 'member', hash: hashPassword(pw), city: str(b.city, 60), createdAt: new Date().toISOString(), agreedAt: new Date().toISOString(), agreedVersion: AGREEMENT_VERSION });
    const res = NextResponse.json({ ok: true }); res.cookies.set(COOKIE, sessionValue(id), cookieOpts); return res;
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
