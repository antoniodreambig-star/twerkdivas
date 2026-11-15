export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser, hasAccess } from '@/lib/auth';
import { syncCheckout, stripeOn } from '@/lib/stripe';
export async function POST(req) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  if (!stripeOn()) return NextResponse.json({ error: 'Billing is not switched on' }, { status: 503 });
  try { const { session } = await req.json(); const n = await syncCheckout(u, session); return NextResponse.json({ active: hasAccess(n) }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
