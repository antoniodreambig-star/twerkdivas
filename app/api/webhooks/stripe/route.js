export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { verifyWebhook, handleEvent } from '@/lib/stripe';
export async function POST(req) {
  const raw = await req.text();
  if (!verifyWebhook(raw, req.headers.get('stripe-signature'))) return NextResponse.json({ error: 'Bad signature' }, { status: 400 });
  try { await handleEvent(JSON.parse(raw)); return NextResponse.json({ received: true }); } catch (e) { return NextResponse.json({ error: e.message }, { status: 500 }); }
}
