export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser, hasAccess } from '@/lib/auth';
import { checkout, stripeOn } from '@/lib/stripe';
export async function POST(req) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  if (hasAccess(u)) return NextResponse.json({ error: 'Your membership is already active' }, { status: 400 });
  if (!stripeOn()) return NextResponse.json({ error: 'Billing is not switched on yet. Contact TwerkDivas.' }, { status: 503 });
  try { return NextResponse.json({ url: await checkout(u, new URL(req.url).origin) }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 502 }); }
}
