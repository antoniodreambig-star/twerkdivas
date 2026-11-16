export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { unsubOk, unsubscribe } from '@/lib/subscribers';
export async function POST(req) { const { email, t } = await req.json().catch(() => ({})); if (!unsubOk(String(email || '').toLowerCase(), t)) return NextResponse.json({ error: 'This link is not valid' }, { status: 400 }); await unsubscribe(email); return NextResponse.json({ ok: true }); }
