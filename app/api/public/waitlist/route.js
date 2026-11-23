export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { isEmail, str } from '@/lib/rules';
import { appUrl } from '@/lib/email';
import { newId, snapshot, availability, onSale } from '@/lib/tickets';
import { addSubscriber } from '@/lib/subscribers';
const hits = new Map(); const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
export async function POST(req) {
  const ip = (req.headers.get('x-forwarded-for') || 'x').split(',')[0]; const now = Date.now(); const h = (hits.get(ip) || []).filter((t) => now - t < 36e5); if (h.length >= 10) return err('Too many attempts. Please try again later.', 429); hits.set(ip, [...h, now]);
  try {
    const b = await req.json(); const name = str(b.name, 80), email = str(b.email, 120).toLowerCase(); if (!name) return err('Add your name'); if (!isEmail(email)) return err('Enter a valid email');
    const snap = await snapshot(); const cls = snap.cb[str(b.classId, 80)]; if (!cls || !onSale(cls, snap.now) || cls.bookUrl || cls.bookNote) return err('That class is not available', 404);
    if (availability(cls, snap).left > 0) return err('There are spots available right now. Go ahead and book!');
    const qty = Math.min(6, Math.max(1, Math.floor(Number(b.qty) || 1))); const all = await db.list('waitlist'); const mine = all.find((w) => w.classId === cls.id && w.email === email && !w.notifiedAt);
    if (mine) return NextResponse.json({ ok: true, position: all.filter((w) => w.classId === cls.id && !w.notifiedAt && w.createdAt <= mine.createdAt).length, already: true });
    const w = { id: newId('wl'), classId: cls.id, name, email, qty, createdAt: new Date().toISOString(), origin: appUrl(req) }; await db.put('waitlist', w.id, w);
    if (b.optIn === true) addSubscriber({ email, name, source: 'waitlist' }).catch(() => {});
    return NextResponse.json({ ok: true, position: all.filter((x) => x.classId === cls.id && !x.notifiedAt).length + 1 });
  } catch (e) { return err(e.message); }
}
