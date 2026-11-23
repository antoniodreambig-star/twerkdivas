export const dynamic = 'force-dynamic';
import * as db from '@/lib/db';
// Serves uploaded instructor photos. The URL carries a version (?v=) so it can be cached for a long time.
export async function GET(req, { params }) {
  const p = await db.get('photos', String(params.id).slice(0, 60));
  const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(p?.data || '');
  if (!m) return new Response('Not found', { status: 404 });
  return new Response(Buffer.from(m[2], 'base64'), { headers: { 'content-type': m[1], 'cache-control': 'public, max-age=31536000, immutable' } });
}
