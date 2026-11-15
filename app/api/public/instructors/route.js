export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { publicInstructors } from '@/lib/data';
// Certified instructors who chose to be listed. Safe to show on twerkdivas.com.
export async function GET(req) { const p = Object.fromEntries(new URL(req.url).searchParams); return NextResponse.json({ instructors: (await publicInstructors({ city: p.city, program: p.program, q: p.q })).map(({ certifiedIds, ...i }) => i) }, { headers: { 'access-control-allow-origin': '*', 'cache-control': 'public, max-age=60' } }); }
