'use client';
import { useState } from 'react';
export default function BookingsForm({ expired }) {
  const [email, setEmail] = useState(''); const [st, setSt] = useState(null); const [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setBusy(true); const r = await fetch('/api/public/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }); const j = await r.json().catch(() => ({})); setSt(r.ok ? j : { error: j.error }); setBusy(false); }
  if (st?.ok) return st.configured ? <div className="ok">Check your inbox. If that email has bookings, we sent a private link that works for 2 hours.</div> : <div className="err">Email is not switched on yet. Contact Cakes and Core for help finding your tickets.</div>;
  return (<form onSubmit={go} className="card" style={{ maxWidth: 440 }}>{expired && <div className="err" style={{ marginBottom: 10 }}>That link expired or is not valid. Request a new one.</div>}<label style={{ marginTop: 0 }}>The email you bought with</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />{st?.error && <div className="err">{st.error}</div>}<button className="btn primary" style={{ marginTop: 14 }} disabled={busy}>{busy ? 'Sending...' : 'Email me a link'}</button></form>);
}
