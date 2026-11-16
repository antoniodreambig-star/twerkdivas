export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { cancelByBuyer } from '@/lib/tickets';
import { settings } from '@/lib/data';
import { str } from '@/lib/rules';
export async function POST(req) {
  try { const b = await req.json(); const set = await settings(); const o = await cancelByBuyer(str(b.orderId, 80), set.cancelHours ?? 48); return NextResponse.json({ ok: true, status: o.status }); }
  catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
