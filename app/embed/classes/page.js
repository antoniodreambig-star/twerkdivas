import { publicClasses } from '@/lib/data';
import { fmtWhen } from '@/lib/tz';
import { money } from '@/components/ClassCard';
import EmbedResize from '@/components/EmbedResize';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams: sp }) {
  const rows = (await publicClasses({ state: sp.state || '', city: sp.city || '', program: sp.program || '', instructor: sp.instructor || '' })).filter((c) => (sp.popups === '1' ? c.popup : true)).slice(0, Math.min(30, Number(sp.limit) || 12));
  const base = (process.env.APP_URL || '').replace(/\/$/, '');
  return (<div style={{ fontFamily: "'DM Sans',Arial,sans-serif", color: '#14060F', padding: 4 }}><EmbedResize />
    {rows.length === 0 ? <p style={{ color: '#6E5A66' }}>No classes on sale right now. Check back soon!</p> : <div style={{ display: 'grid', gap: 10 }}>{rows.map((c) => (<a key={c.id} href={`${base}/classes/${c.id}`} target="_top" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between', textDecoration: 'none', color: 'inherit', background: '#fff', border: '1px solid #F6D3E3', borderRadius: 14, padding: '12px 16px' }}>
      <div><div style={{ fontWeight: 700, fontSize: 17 }}>{c.title}</div><div style={{ fontSize: 14, color: '#6E5A66' }}>{fmtWhen(c.start, c.tz, true)} · {c.venue ? `${c.venue.name}, ${c.venue.city}` : 'Online'} · with {c.instructor}</div></div>
      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}><div style={{ fontWeight: 800, fontSize: 20 }}>{money(c.price)}</div><span style={{ display: 'inline-block', marginTop: 4, background: c.left <= 0 ? '#ddd' : '#FF1A7E', color: '#fff', borderRadius: 999, padding: '4px 14px', fontSize: 13, fontWeight: 700 }}>{c.left <= 0 ? 'Sold out' : 'Get tickets'}</span></div></a>))}</div>}
    <p style={{ fontSize: 12, color: '#6E5A66', textAlign: 'right', margin: '8px 4px 0' }}>Powered by <a href={base || '/'} target="_top" style={{ color: '#E0105F' }}>TwerkDivas</a></p></div>);
}
