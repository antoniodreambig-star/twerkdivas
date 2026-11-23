export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { paymentsOn, connectCreate, connectLink, connectStatus, connectDashboard } from '@/lib/stripe';
import { appUrl } from '@/lib/email';
const err = (m, s = 400) => NextResponse.json({ error: m }, { status: s });
// Instructors link a Stripe Express account here so ticket money reaches them automatically.
export async function POST(req) {
  const u = await currentUser(); if (!u) return err('Please sign in', 401); if (!paymentsOn()) return err('Payments are not switched on yet', 503);
  try {
    const { action } = await req.json().catch(() => ({})); let acct = u.connect?.acct || '';
    if (action === 'start') { if (!acct) { acct = await connectCreate(u); await db.put('users', u.id, { ...u, connect: { acct, ready: false, detailsSubmitted: false, updatedAt: new Date().toISOString() } }); } return NextResponse.json({ url: await connectLink(acct, appUrl(req)) }); }
    if (!acct) return err('Payout setup has not been started');
    if (action === 'status') { const s = await connectStatus(acct); await db.put('users', u.id, { ...u, connect: { acct, ...s, updatedAt: new Date().toISOString() } }); return NextResponse.json({ ...s }); }
    if (action === 'dashboard') return NextResponse.json({ url: await connectDashboard(acct) });
    return err('Unknown action');
  } catch (e) { return err(e.message, 502); }
}
