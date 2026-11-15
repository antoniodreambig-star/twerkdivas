export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { checkPassword, sessionValue, COOKIE, cookieOpts, ensureAdmin } from '@/lib/auth';
const fails = new Map();
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now();
  const f = (fails.get(ip) || []).filter((t) => now - t < 9e5); if (f.length >= 8) return NextResponse.json({ error: 'Too many tries. Wait 15 minutes.' }, { status: 429 });
  await ensureAdmin();
  const b = await req.json().catch(() => ({})); const email = String(b.email || '').trim().toLowerCase();
  const u = (await db.list('users')).find((x) => x.email === email);
  // Same work and same message whether the email exists or not.
  const ok = checkPassword(b.password, u?.hash || 'scrypt$00$00');
  if (!u || !ok || u.suspended) { fails.set(ip, [...f, now]); return NextResponse.json({ error: u?.suspended && ok ? 'This account is paused. Contact TwerkDivas.' : 'Wrong email or password' }, { status: 401 }); }
  const res = NextResponse.json({ ok: true, role: u.role }); res.cookies.set(COOKIE, sessionValue(u.id), cookieOpts); return res;
}
