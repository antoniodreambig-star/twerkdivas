export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { getSession } from '@/lib/stripe';
import { markPassPaid } from '@/lib/packs';
export async function POST(req) {
  try { const { passId, session } = await req.json(); const p = await db.get('passes', String(passId)); if (!p) return NextResponse.json({ error: 'Unknown pack' }, { status: 404 });
    if (p.status === 'held') { const s = await getSession(session); if (s.client_reference_id !== p.id || s.payment_status !== 'paid') return NextResponse.json({ status: 'held' }); await markPassPaid(p.id, { session: s.id, pi: typeof s.payment_intent === 'string' ? s.payment_intent : '' }); }
    const n = await db.get('passes', p.id); return NextResponse.json({ status: n.status, code: n.status === 'active' ? n.code : '', credits: n.credits }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
