'use client';
import { useState } from 'react';
export default function BuyBox({ classId, price, left, title, cancelHours = 48, packs = false }) {
  const [f, setF] = useState({ name: '', email: '', qty: 1, agree: false, optIn: false, packCode: '' }); const [pack, setPack] = useState(false); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const max = Math.min(6, left); const total = (price * f.qty) / 100;
  async function buy(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await fetch('/api/public/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ classId, ...f, packCode: pack ? f.packCode : '' }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) { setErr(j.error || 'Something went wrong'); setBusy(false); return; } window.location.href = j.url;
  }
  return (<form onSubmit={buy} className="card pop buybox"><h3 style={{ fontSize: 20 }}>Get tickets</h3>
    <label>Your name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoComplete="name" />
    <label>Email (your tickets are sent here)</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoComplete="email" />
    <label>Tickets</label><select value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })}>{Array.from({ length: max }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
    {price > 0 && packs && (pack ? <><label>Class pack code</label><input value={f.packCode} onChange={(e) => setF({ ...f, packCode: e.target.value.toUpperCase() })} placeholder="e.g. 7KQ2M9XD" autoCapitalize="characters" /><button type="button" className="small" style={{ background: 'none', border: 0, color: 'var(--violet)', padding: 0, marginTop: 6, cursor: 'pointer' }} onClick={() => setPack(false)}>Pay with card instead</button></> : <button type="button" className="small" style={{ background: 'none', border: 0, color: 'var(--violet)', padding: 0, marginTop: 10, cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setPack(true)}>I have a class pack code</button>)}
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--ink)', marginTop: 14, fontWeight: 400 }}><input type="checkbox" checked={f.agree} onChange={(e) => setF({ ...f, agree: e.target.checked })} required style={{ marginTop: 3 }} /><span className="small">I accept the <a href="/waiver" target="_blank">participation waiver</a>, the <a href="/refunds" target="_blank">refund policy</a> and the <a href="/terms" target="_blank">terms</a>.</span></label>
    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--ink)', marginTop: 8, fontWeight: 400 }}><input type="checkbox" checked={f.optIn} onChange={(e) => setF({ ...f, optIn: e.target.checked })} style={{ marginTop: 3 }} /><span className="small">Email me about new classes and pop-ups (optional).</span></label>
    {err && <div className="err">{err}</div>}
    <button className="btn primary lg" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'One moment...' : price === 0 ? 'Reserve free ticket' : pack ? 'Use my pack credit' : `Pay $${total.toFixed(2)}`}</button>
    <p className="small mute" style={{ margin: '10px 0 0', textAlign: 'center' }}>{price === 0 ? 'Free ticket. We email your QR code right away.' : `Secure payment by Stripe. Seats are held 30 minutes. Cancel for a full refund until ${cancelHours} hours before class.`}</p></form>);
}
