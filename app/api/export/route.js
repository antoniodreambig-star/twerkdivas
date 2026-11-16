export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import * as db from '@/lib/db';
import { currentUser } from '@/lib/auth';
import { earningsFor } from '@/lib/reports';
import { fmtWhen } from '@/lib/tz';
const csv = (rows) => rows.map((r) => r.map((v) => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
const money = (c) => ((c || 0) / 100).toFixed(2);
export async function GET(req) {
  const u = await currentUser(); if (!u) return NextResponse.json({ error: 'Sign in first' }, { status: 401 }); const kind = new URL(req.url).searchParams.get('kind'); let name = kind, rows;
  if (kind === 'earnings') { const e = await earningsFor(u.id); rows = [['Class', 'Date', 'Tickets', 'Cash sales', 'Pack credit value', 'Platform fee', 'Your net'], ...e.rows.map((r) => [r.title, fmtWhen(r.start, r.tz, true), r.tickets, money(r.gross), money(r.packValue), money(r.fee), money(r.net)])]; }
  else if (kind === 'audience') { if (u.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 }); rows = [['Email', 'Name', 'Source', 'Opted in', 'Unsubscribed'], ...(await db.list('subscribers')).sort((a, b) => String(b.optInAt).localeCompare(String(a.optInAt))).map((s) => [s.email, s.name, s.source, s.optInAt, s.unsubscribed ? 'yes' : ''])]; }
  else if (kind === 'attendance') { if (u.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 }); const cs = Object.fromEntries((await db.list('classes')).map((c) => [c.id, c])); const os = Object.fromEntries((await db.list('orders')).map((o) => [o.id, o])); rows = [['Class', 'Date', 'Ticket code', 'Name', 'Email', 'Status', 'Checked in at', 'Waiver accepted'], ...(await db.list('tickets')).filter((t) => ['valid', 'void'].includes(t.status) && os[t.orderId]?.status !== 'expired').map((t) => [cs[t.classId]?.title, cs[t.classId]?.start, t.code, t.name, os[t.orderId]?.email, t.status, t.checkedInAt || '', os[t.orderId]?.waiverAt || ''])]; }
  else return NextResponse.json({ error: 'Unknown export' }, { status: 400 });
  return new NextResponse(csv(rows), { headers: { 'content-type': 'text/csv', 'content-disposition': `attachment; filename="twerkdivas-${name}.csv"` } });
}
