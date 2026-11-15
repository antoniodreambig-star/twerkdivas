export const dynamic = 'force-dynamic';
import crypto from 'crypto';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { hashPassword, sessionValue, COOKIE, cookieOpts } from '@/lib/auth';
export async function POST(req) {
  const b = await req.json().catch(() => ({})); const pw = String(b.password || '');
  if (pw.length < 8) return NextResponse.json({ error: 'Use a password of at least 8 characters' }, { status: 400 });
  const id = crypto.createHash('sha256').update(String(b.token || '')).digest('hex'); const r = await db.get('resets', id);
  if (!r || r.exp < Date.now()) return NextResponse.json({ error: 'This reset link has expired. Ask for a new one.' }, { status: 400 });
  const u = await db.get('users', r.userId); if (!u || u.suspended) return NextResponse.json({ error: 'This account cannot be reset. Contact TwerkDivas.' }, { status: 400 });
  await db.put('users', u.id, { ...u, hash: hashPassword(pw), sessionsAfter: Date.now() });
  await db.del('resets', id);
  for (const o of (await db.list('resets')).filter((x) => x.userId === u.id || x.exp < Date.now())) await db.del('resets', o.id);
  const res = NextResponse.json({ ok: true }); res.cookies.set(COOKIE, sessionValue(u.id), cookieOpts); return res;
}
