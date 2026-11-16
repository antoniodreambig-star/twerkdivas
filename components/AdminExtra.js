'use client';
import { useEffect, useState } from 'react';
import { useAct, day } from './ui';
const $ = (c) => `$${((c || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const Stat = ({ l, v }) => <div className="stat"><b>{v}</b>{l}</div>;

function Bars({ rows, label = 'Sales by month' }) {
  const max = Math.max(1, ...rows.map((r) => r.cash)); const W = 560, H = 190, pad = 28, bw = (W - pad * 2) / rows.length;
  return (<svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} style={{ width: '100%', maxWidth: 640 }}>{[0, 0.5, 1].map((f) => <line key={f} x1={pad} x2={W - pad} y1={H - 30 - f * (H - 60)} y2={H - 30 - f * (H - 60)} stroke="#E9DFFB" />)}
    {rows.map((r, i) => { const h = (r.cash / max) * (H - 60); const x = pad + i * bw + bw * 0.18; return (<g key={r.key}><title>{`${r.label}: ${$(r.cash)}, ${r.tickets} tickets`}</title><rect x={x} y={H - 30 - h} width={bw * 0.64} height={Math.max(h, 0)} rx="5" fill="#6D28FF" /><text x={x + bw * 0.32} y={H - 12} textAnchor="middle" fontSize="12" fill="#6B5C96">{r.label}</text>{r.cash > 0 && <text x={x + bw * 0.32} y={H - 34 - h} textAnchor="middle" fontSize="11" fill="#1D0B4A">{$(r.cash).replace('.00', '')}</text>}</g>); })}</svg>);
}
function Table({ cols, rows }) { return rows.length ? (<div className="card" style={{ overflow: 'auto' }}><table><thead><tr>{cols.map((c) => <th key={c[0]}>{c[0]}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={i}>{cols.map((c) => <td key={c[0]}>{c[1](r)}</td>)}</tr>)}</tbody></table></div>) : <p className="mute">Nothing yet.</p>; }

export function Analytics() {
  const [d, setD] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/d?view=analytics').then((r) => r.json()).then((j) => (j.error ? setErr(j.error) : setD(j))); }, []);
  if (err) return <div className="err">{err}</div>; if (!d) return <p className="mute">Loading...</p>; const T = d.totals;
  return (<><h1>Analytics</h1><div className="row statrow" style={{ margin: '12px 0' }}><Stat l="Sales (incl. pack credits used)" v={$(T.sales)} /><Stat l="Cash collected" v={$(T.cash)} /><Stat l="Tickets sold" v={T.tickets} /><Stat l="Orders" v={T.orders} /><Stat l="Refunds" v={`${T.refunds} (${$(T.refundAmt)})`} /><Stat l="Class packs sold" v={`${T.packs} (${$(T.packSales)})`} /></div>
    <div className="row statrow" style={{ margin: '12px 0' }}><Stat l="Fill rate (past classes)" v={d.fillRate == null ? '-' : `${d.fillRate}%`} /><Stat l="Show-up rate" v={d.attendRate == null ? '-' : `${d.attendRate}%`} /><Stat l="Email list" v={d.subscribers} /><Stat l="On waitlists" v={d.waitlist} /><Stat l="Avg rating" v={d.reviewCount ? `${d.avgRating} (${d.reviewCount})` : '-'} /></div>
    <h2>Cash by month</h2><div className="card"><Bars rows={d.months} /></div>
    <div className="two"><div><h2>By state</h2><Table cols={[['State', (r) => r.key], ['Tickets', (r) => r.tickets], ['Sales', (r) => $(r.sales)]]} rows={d.byState} /></div><div><h2>By program</h2><Table cols={[['Program', (r) => r.key], ['Tickets', (r) => r.tickets], ['Sales', (r) => $(r.sales)]]} rows={d.byProgram} /></div></div>
    <h2>Top cities</h2><Table cols={[['City', (r) => r.key], ['Tickets', (r) => r.tickets], ['Sales', (r) => $(r.sales)]]} rows={d.byCity} />
    <h2>Instructors</h2><Table cols={[['Instructor', (r) => r.name], ['Tickets', (r) => r.tickets], ['Sales', (r) => $(r.sales)], ['Rating', (r) => (r.rating ? `${r.rating.avg} (${r.rating.count})` : '-')]]} rows={d.byInstructor} />
    <h2>Best-selling classes</h2><Table cols={[['Class', (r) => r.title], ['Date', (r) => day(r.start)], ['Tickets', (r) => r.tickets], ['Sales', (r) => $(r.sales)]]} rows={d.top} />
    <h2>Instructor payouts</h2><p className="mute small">Orders paid through Stripe Connect are split automatically. "Owed" is what you still need to pay by hand (Zelle, check) after the platform fee ({d.feePct}%).</p><PayoutTable rows={d.payouts} /></>);
}
function PayoutTable({ rows }) {
  const { note, act } = useAct(async () => location.reload()); const [f, setF] = useState(null);
  return (<>{note}<Table cols={[['Instructor', (r) => <b>{r.name}</b>], ['Net earned', (r) => $(r.net)], ['Paid automatically', (r) => $(r.auto)], ['Paid by hand', (r) => $(r.paidOut)], ['Owed', (r) => <b style={{ color: r.owed ? 'var(--pink2)' : 'inherit' }}>{$(r.owed)}</b>], ['', (r) => <button className="btn sm" onClick={() => setF({ userId: r.userId, name: r.name, amount: (r.owed / 100).toFixed(2), method: 'Zelle', note: '' })}>Record payout</button>]]} rows={rows} />
    {f && <div className="card" style={{ marginTop: 12 }}><b>Record a payout to {f.name}</b><div className="row" style={{ marginTop: 8 }}><input style={{ maxWidth: 130 }} type="number" step="0.01" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /><input style={{ maxWidth: 160 }} value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} placeholder="Zelle, check" /><input value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Note (optional)" /><button className="btn primary" onClick={async () => (await act('payout.record', f, 'Recorded')) && setF(null)}>Save</button><button className="btn" onClick={() => setF(null)}>Cancel</button></div></div>}</>);
}

export function Audience() {
  const [d, setD] = useState(null); const load = async () => setD(await (await fetch('/api/d?view=audience')).json()); useEffect(() => { load(); }, []); const { note, act } = useAct(load);
  if (!d) return <p className="mute">Loading...</p>;
  return (<><div className="row" style={{ justifyContent: 'space-between' }}><h1>Email list</h1><a className="btn primary" href="/api/export?kind=audience">Download CSV</a></div><p className="mute">People who ticked the box to hear about new classes when they bought a ticket. {d.active} subscribed. Every marketing email you send must include an unsubscribe link.</p>{note}
    <Table cols={[['Email', (r) => r.email], ['Name', (r) => r.name], ['Joined', (r) => day(r.optInAt)], ['Source', (r) => r.source], ['', (r) => (r.unsubscribed ? <span className="tag">Unsubscribed</span> : <button className="btn sm" onClick={() => confirm(`Unsubscribe ${r.email}?`) && act('audience.unsub', { email: r.email }, 'Unsubscribed')}>Unsubscribe</button>)]]} rows={d.subscribers} /></>);
}

export function SetupCheck() {
  const [d, setD] = useState(null); useEffect(() => { fetch('/api/d?view=health').then((r) => r.json()).then(setD); }, []);
  if (!d?.checks) return null;
  return (<><h2 style={{ marginTop: 28 }}>Setup check</h2><div className="card">{d.checks.map((c) => (<div key={c.key || c.label} className="row" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}><span className={`tag ${c.ok ? 'ok' : c.optional ? '' : 'pink'}`}>{c.ok ? 'Ready' : c.optional ? 'Optional' : 'Needs setup'}</span><div><b>{c.label}</b><div className="small mute">{c.ok ? c.note : c.fix || c.note}</div></div></div>))}</div></>);
}

export function Backups() {
  const [d, setD] = useState(null); const load = async () => setD(await (await fetch('/api/d?view=backups')).json()); useEffect(() => { load(); }, []); const { note, act } = useAct(load);
  return (<><h2 style={{ marginTop: 28 }}>Backups</h2><div className="card"><p className="mute small">A backup runs every morning and keeps the last 7 inside the database. If an email service and ADMIN_EMAIL are set, a copy is emailed to you too. Passwords are never included.</p>{note}<div className="row"><button className="btn primary" onClick={() => act('backup.run', { email: false }, (j) => `Saved a backup (${j.backup.records} records)`)}>Back up now</button><a className="btn" href="/api/admin/backup">Download everything (JSON)</a></div>
    {d?.backups?.length > 0 && <div style={{ marginTop: 12 }}>{d.backups.map((b) => <div key={b.id} className="row small" style={{ justifyContent: 'space-between' }}><span>{day(b.at)} · {b.records} records · {Math.round(b.bytes / 1024)} KB</span><a href={`/api/admin/backup?id=${b.id}`}>Download</a></div>)}</div>}</div></>);
}

export function PolicyFields({ s, setS, onSave }) {
  const [packs, setPacks] = useState((s.packs || []).map((p) => ({ ...p, price: (p.price / 100).toString() })));
  const save = () => onSave({ ...s, packs });
  const P = (k, l, h) => (<><label>{l}</label><textarea style={{ minHeight: 120 }} value={s[k] || ''} onChange={(e) => setS({ ...s, [k]: e.target.value })} placeholder={h} /></>);
  return (<><h2 style={{ marginTop: 28 }}>Policies and class packs</h2><div className="card"><p className="small mute">Leave a policy blank to use the built-in starter text on the public page. The starter text is a template. Have an attorney review it before you rely on it.</p>
    <label>Cancel and refund window (hours before class)</label><input type="number" min="0" max="720" value={s.cancelHours ?? 48} onChange={(e) => setS({ ...s, cancelHours: e.target.value })} style={{ maxWidth: 140 }} />
    {P('refundPolicy', 'Refund & cancellation policy (use {hours} for the window)', 'Blank = starter text')}{P('waiver', 'Participation waiver (buyers must accept at checkout)', 'Blank = starter text')}{P('terms', 'Terms of service', 'Blank = starter text')}{P('privacy', 'Privacy policy', 'Blank = starter text')}
    <label>Class packs for students (2 to 50 classes, usable on any public class)</label><p className="small mute" style={{ margin: 0 }}>Each row: name, number of classes, price in dollars.</p>
    {packs.map((p, i) => <div className="row" key={i} style={{ margin: '6px 0' }}><input placeholder="Name (e.g. 5-class pack)" value={p.name} onChange={(e) => setPacks(packs.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} /><input style={{ maxWidth: 100 }} type="number" placeholder="Classes" value={p.credits} onChange={(e) => setPacks(packs.map((x, j) => (j === i ? { ...x, credits: e.target.value } : x)))} /><input style={{ maxWidth: 110 }} type="number" step="0.01" placeholder="Price $" value={p.price} onChange={(e) => setPacks(packs.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} /><button className="btn sm" onClick={() => setPacks(packs.filter((_, j) => j !== i))}>Remove</button></div>)}
    {packs.length < 6 && <button className="btn sm" onClick={() => setPacks([...packs, { name: '', credits: 5, price: '' }])}>+ Add a pack</button>}
    <div style={{ marginTop: 12 }}><button className="btn primary" onClick={save}>Save policies and packs</button></div></div></>);
}

export function EmbedHelp() {
  const [o, setO] = useState({ state: '', city: '', popups: false }); const [ok, setOk] = useState(false);
  const attrs = [o.state && ` data-state="${o.state}"`, o.city && ` data-city="${o.city}"`, o.popups && ' data-popups="1"'].filter(Boolean).join('');
  const code = `<div data-twerkdivas${attrs}></div>\n<script async src="${typeof location !== 'undefined' ? location.origin : ''}/embed.js"></script>`;
  return (<><h2 style={{ marginTop: 28 }}>Website widget (WordPress)</h2><div className="card"><p className="small mute">Shows your upcoming classes on any website. In WordPress, add a <b>Custom HTML</b> block and paste the code. Ticket buttons open the checkout on this site.</p>
    <div className="row"><input style={{ maxWidth: 110 }} placeholder="State (TX)" value={o.state} onChange={(e) => setO({ ...o, state: e.target.value.toUpperCase().slice(0, 2) })} /><input style={{ maxWidth: 200 }} placeholder="City (optional)" value={o.city} onChange={(e) => setO({ ...o, city: e.target.value })} /><label style={{ display: 'flex', gap: 6, color: 'var(--ink)' }}><input type="checkbox" checked={o.popups} onChange={(e) => setO({ ...o, popups: e.target.checked })} /> Pop-ups only</label></div>
    <textarea readOnly value={code} style={{ minHeight: 70, fontFamily: 'monospace', marginTop: 8 }} onFocus={(e) => e.target.select()} /><button className="btn sm" onClick={async () => { try { await navigator.clipboard.writeText(code); setOk(true); setTimeout(() => setOk(false), 1800); } catch {} }}>{ok ? 'Copied!' : 'Copy code'}</button></div></>);
}
