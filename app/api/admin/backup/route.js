export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { currentUser } from '@/lib/auth';
import { exportAll, getBackup } from '@/lib/backup';
export async function GET(req) {
  const u = await currentUser(); if (!u || u.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  const id = new URL(req.url).searchParams.get('id'); const body = id ? await getBackup(id) : JSON.stringify(await exportAll()); if (!body) return NextResponse.json({ error: 'Unknown backup' }, { status: 404 });
  return new NextResponse(body, { headers: { 'content-type': 'application/json', 'content-disposition': `attachment; filename="twerkdivas-${id || new Date().toISOString().slice(0, 10)}.json"` } });
}
