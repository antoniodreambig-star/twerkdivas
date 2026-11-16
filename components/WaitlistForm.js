'use client';
import { useState } from 'react';
export default function WaitlistForm({ classId }) {
  const [f, setF] = useState({ name: '', email: '', qty: 1, optIn: false }); const [res, setRes] = useState(null); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setErr(''); setBusy(true); const r = await fetch('/api/public/waitlist', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ classId, ...f }) }); const j = await r.json().catch(() => ({})); setBusy(false); if (!r.ok) setErr(j.error || 'Something went wrong'); else setRes(j); }
  if (res) return <div className="card"><b>{res.already ? 'You are already on the list.' : 'You are on the waitlist!'}</b><p className="mute small">You are number {res.position} in line. If a spot opens we email you right away. Spots go to whoever books first.</p></div>;
  return (<form onSubmit={go} className="card buybox"><h3 style={{ fontSize: 20 }}>Sold out. Join the waitlist</h3><p className="small mute" style={{ margin: '2px 0' }}>Tickets sometimes free up from cancellations. We will email you first.</p>
    <label>Your name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /><label>Email</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
    <label>Spots needed</label><select value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select>
    <label style={{ display: 'flex', gap: 8, color: 'var(--ink)', marginTop: 12 }}><input type="checkbox" checked={f.optIn} onChange={(e) => setF({ ...f, optIn: e.target.checked })} /> Send me news about new classes and pop-ups</label>
    {err && <div className="err">{err}</div>}<button className="btn primary" style={{ width: '100%', marginTop: 14 }} disabled={busy}>{busy ? 'One moment…' : 'Join waitlist'}</button></form>);
}
