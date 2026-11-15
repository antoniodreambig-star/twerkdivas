export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { currentUser, hasAccess } from '@/lib/auth';
import { muxOn, muxToken } from '@/lib/mux';
import { MUX_RE } from '@/lib/video';
export async function GET(req) {
  const u = await currentUser(); if (!u || !hasAccess(u)) return NextResponse.json({ error: 'Membership required' }, { status: 402 });
  if (!muxOn()) return NextResponse.json({ error: 'Protected video is not set up yet. Contact TwerkDivas.' }, { status: 503 });
  const v = await db.get('videos', new URL(req.url).searchParams.get('id') || '');
  if (!v || (v.published === false && u.role !== 'admin') || !MUX_RE.test(v.url || '')) return NextResponse.json({ error: 'Unknown video' }, { status: 404 });
  return NextResponse.json({ playbackId: v.url.slice(4), token: muxToken(v.url.slice(4)) }, { headers: { 'cache-control': 'no-store' } });
}
