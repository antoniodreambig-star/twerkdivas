export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { str } from '@/lib/rules';
// One review per paid order, after the class has ended. The order link acts as the buyer's proof.
export async function POST(req) {
  try {
    const b = await req.json(); const o = await db.get('orders', str(b.orderId, 80)); if (!o || o.status !== 'paid') return NextResponse.json({ error: 'We could not find that order' }, { status: 404 });
    const c = await db.get('classes', o.classId); if (!c || c.canceled) return NextResponse.json({ error: 'This class was canceled' }, { status: 400 });
    const end = c.end ? Date.parse(c.end) : Date.parse(c.start) + 90 * 60000; if (end > Date.now()) return NextResponse.json({ error: 'You can rate the class after it ends' }, { status: 400 });
    if (await db.get('reviews', o.id)) return NextResponse.json({ error: 'You already rated this class. Thank you!' }, { status: 400 });
    const rating = Math.round(Number(b.rating)); if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: 'Pick 1 to 5 stars' }, { status: 400 });
    const parts = String(o.name).split(/\s+/); const name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
    await db.put('reviews', o.id, { id: o.id, orderId: o.id, classId: c.id, classTitle: c.title, userId: c.userId, name, rating, text: str(b.text, 600), createdAt: new Date().toISOString(), hidden: false });
    return NextResponse.json({ ok: true });
  } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
