import { ImageResponse } from 'next/og';
import { classPage } from '@/lib/data';
import { fmtWhen } from '@/lib/tz';
export const runtime = 'nodejs'; export const alt = 'Cakes and Core class'; export const size = { width: 1200, height: 630 }; export const contentType = 'image/png';
export default async function Image({ params }) {
  const c = await classPage(params.id); const title = c?.title || 'Cakes and Core'; const when = c ? fmtWhen(c.start, c.tz, true) : ''; const where = c?.venueFull ? `${c.venueFull.name} · ${c.venueFull.city}, ${c.venueFull.state}` : c ? 'Online' : '';
  return new ImageResponse((<div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 70, background: 'radial-gradient(circle at 90% 10%,#FF1A7E 0%,rgba(255,26,126,0) 55%),linear-gradient(135deg,#000 0%,#1A0A12 100%)', color: 'white', fontFamily: 'Arial' }}>
    <div style={{ display: 'flex', fontSize: 34, letterSpacing: 6, color: '#FF5CA5', fontWeight: 800 }}>{c?.popup ? 'CAKES AND CORE · POP-UP EVENT' : 'CAKES AND CORE · CLASS'}</div>
    <div style={{ display: 'flex', flexDirection: 'column' }}><div style={{ display: 'flex', fontSize: title.length > 40 ? 70 : 92, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>{c?.tagline && <div style={{ display: 'flex', fontSize: 34, marginTop: 18, color: '#ffd1e8' }}>{c.tagline}</div>}</div>
    <div style={{ display: 'flex', flexDirection: 'column', fontSize: 34 }}><div style={{ display: 'flex' }}>{when}</div><div style={{ display: 'flex', opacity: 0.85, marginTop: 6 }}>{where}{c ? ` · with ${c.instructor}` : ''}</div></div></div>), size);
}
