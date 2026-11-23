import Link from 'next/link';
import { fmtTime } from '@/lib/tz';
export const money = (c) => (c === 0 ? 'Free' : `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`);
export default function ClassCard({ c }) {
  const d = new Date(c.start);
  const mo = d.toLocaleDateString('en-US', { timeZone: c.tz, month: 'short' }), dd = d.toLocaleDateString('en-US', { timeZone: c.tz, day: 'numeric' });
  const out = c.left <= 0, low = c.left > 0 && c.left <= 5;
  return (<Link href={`/classes/${c.id}`} className="cls"><div className="datebox"><span>{mo}</span><b>{dd}</b></div>
    <div className="grow"><div className="row" style={{ gap: 8 }}><b className="clst">{c.title}</b>{c.program && <span className="tag volt">{c.program}</span>}{c.mode === 'online' && <span className="tag cyan">Online</span>}</div>
      <div className="small mute">{fmtTime(c.start, c.tz)} · {c.instructor}{c.venue ? ` · ${c.venue.name}, ${c.venue.city}, ${c.venue.state}` : ''}</div></div>
    <div className="clsr">{c.bookUrl ? <><b>Book</b><span className="small mute">on studio site</span></> : c.bookNote ? <><b>Members</b><span className="small mute">of the studio only</span></> : <><b>{money(c.price)}</b><span className={`small ${out ? 'soldout' : low ? 'low' : 'mute'}`}>{out ? 'Sold out' : low ? `Only ${c.left} left` : `${c.left} spots`}</span></>}</div></Link>);
}
