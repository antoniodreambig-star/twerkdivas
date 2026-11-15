'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function Forgot() {
  const [email, setEmail] = useState(''); const [st, setSt] = useState(null); const [busy, setBusy] = useState(false);
  async function go(e) { e.preventDefault(); setBusy(true); const r = await fetch('/api/auth/forgot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email }) }); const j = await r.json().catch(() => ({})); setSt(r.ok ? j : { error: j.error || 'Something went wrong' }); setBusy(false); }
  return (<div className="wrap"><div className="authbox card pop"><Link href="/"><img src="/logo.svg" alt="TwerkDivas" /></Link>
    <h1 style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>Reset your password</h1>
    {st?.ok && st.configured ? <div className="ok">If that email has an account, a reset link is on its way. It works for one hour.</div>
      : st?.ok ? <div className="err">Password emails are not switched on yet. Please contact TwerkDivas and they will reset it for you.</div>
      : <form onSubmit={go}><p className="mute small" style={{ textAlign: 'center' }}>Enter your email and we will send you a link.</p><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        {st?.error && <div className="err">{st.error}</div>}<button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button></form>}
    <p className="small mute" style={{ textAlign: 'center', marginTop: 14 }}><Link href="/login">Back to sign in</Link></p></div></div>);
}
