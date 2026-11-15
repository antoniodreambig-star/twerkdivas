'use client';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
function Form() {
  const token = useSearchParams().get('token') || ''; const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function go(e) {
    e.preventDefault(); setErr(''); if (pw !== pw2) return setErr('The two passwords do not match'); setBusy(true);
    const r = await fetch('/api/auth/reset', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, password: pw }) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'Something went wrong'); setBusy(false); return; } location.href = '/app';
  }
  return (<div className="wrap"><div className="authbox card pop"><Link href="/"><img src="/logo.svg" alt="TwerkDivas" /></Link>
    <h1 style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>Choose a new password</h1>
    <form onSubmit={go}><label>New password (8+ characters)</label><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} autoComplete="new-password" /><label>Repeat it</label><input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required autoComplete="new-password" />
      {err && <div className="err">{err} {err.includes('expired') && <Link href="/forgot">Get a new link</Link>}</div>}<button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy || !token}>{busy ? 'Saving...' : 'Save password and sign in'}</button></form></div></div>);
}
export default function Reset() { return <Suspense><Form /></Suspense>; }
