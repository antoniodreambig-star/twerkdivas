'use client';
import { useState } from 'react';
export default function BuyBox({ classId, price, left, title }) {
  const [f, setF] = useState({ name: '', email: '', qty: 1 }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const max = Math.min(6, left); const total = (price * f.qty) / 100;
  async function buy(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await fetch('/api/public/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ classId, ...f }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) { setErr(j.error || 'Something went wrong'); setBusy(false); return; } window.location.href = j.url;
  }
  return (<form onSubmit={buy} className="card pop buybox"><h3 style={{ fontSize: 20 }}>Get tickets</h3>
    <label>Your name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required autoComplete="name" />
    <label>Email (your tickets are sent here)</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required autoComplete="email" />
    <label>Tickets</label><select value={f.qty} onChange={(e) => setF({ ...f, qty: Number(e.target.value) })}>{Array.from({ length: max }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}</select>
    {err && <div className="err">{err}</div>}
    <button className="btn primary lg" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'One moment...' : price === 0 ? 'Reserve free ticket' : `Pay $${total.toFixed(2)}`}</button>
    <p className="small mute" style={{ margin: '10px 0 0', textAlign: 'center' }}>{price === 0 ? 'Free ticket. We email your QR code right away.' : 'Secure payment by Stripe. Your seats are held for 30 minutes while you pay.'}</p></form>);
}
