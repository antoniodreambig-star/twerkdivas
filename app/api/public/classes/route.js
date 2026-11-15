export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { publicClasses } from '@/lib/data';
// Upcoming classes instructors chose to make public (online links are never included). Safe to show on twerkdivas.com.
export async function GET(req) { const p = Object.fromEntries(new URL(req.url).searchParams); return NextResponse.json({ classes: (await publicClasses({ state: p.state, city: p.city, program: p.program, mode: p.mode, venue: p.venue, q: p.q })).map(({ id, ...c }) => ({ id, ...c, url: `${(process.env.APP_URL || new URL(req.url).origin).replace(/\/$/, '')}/classes/${id}` })) }, { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' } }); }
