'use client';
import { useState } from 'react';
export default function ResendForm() {
  const [email, setEmail] = useState(''); const [st, setSt] = useState(null); const [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setBusy(true); const r = await fetch('/api/public/resend', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }); const j = await r.json().catch(() => ({})); setSt(r.ok ? j : { error: j.error }); setBusy(false); }
  if (st?.ok) return st.configured ? <div className="ok">If that email has upcoming tickets, we have sent the links.</div> : <div className="err">Email is not switched on yet. Contact TwerkDivas for help finding your tickets.</div>;
  return (<form onSubmit={go} className="card" style={{ maxWidth: 440 }}><label style={{ marginTop: 0 }}>The email you bought with</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />{st?.error && <div className="err">{st.error}</div>}<button className="btn primary" style={{ marginTop: 14 }} disabled={busy}>{busy ? 'Sending...' : 'Email me my tickets'}</button></form>);
}
