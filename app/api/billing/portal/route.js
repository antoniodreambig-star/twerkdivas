export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { portal, stripeOn } from '@/lib/stripe';
export async function POST(req) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Sign in first' }, { status: 401 });
  if (!stripeOn()) return NextResponse.json({ error: 'Billing is not switched on yet' }, { status: 503 });
  try { return NextResponse.json({ url: await portal(u, new URL(req.url).origin) }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 400 }); }
}
