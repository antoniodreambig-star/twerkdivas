'use client';
import { useState } from 'react';
import Link from 'next/link';
export default function AuthForm({ mode, agreement }) {
  const signup = mode === 'signup'; const [f, setF] = useState({ name: '', email: '', password: '', city: '', agree: false }); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function go(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    const r = await fetch(`/api/auth/${mode}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) }); const j = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(j.error || 'Something went wrong'); setBusy(false); return; }
    window.location.href = '/app';
  }
  return (<div className="wrap"><div className="authbox card pop"><Link href="/"><img src="/logo.svg" alt="TwerkDivas" /></Link>
    <h1 style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>{signup ? 'Become an instructor' : 'Welcome back'}</h1>
    <form onSubmit={go}>
      {signup && <><label>Full name</label><input value={f.name} onChange={set('name')} required autoComplete="name" /></>}
      <label>Email</label><input type="email" value={f.email} onChange={set('email')} required autoComplete="email" />
      <label>Password{signup && ' (8+ characters)'}</label><input type="password" value={f.password} onChange={set('password')} required minLength={signup ? 8 : 1} autoComplete={signup ? 'new-password' : 'current-password'} />
      {signup && <><label>City</label><input value={f.city} onChange={set('city')} placeholder="Killeen, Denver, Austin..." />
        <label>Instructor agreement</label><div className="small mute" style={{ maxHeight: 130, overflow: 'auto', border: '2px solid var(--line)', borderRadius: 12, padding: 10 }}>{agreement}</div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: 'var(--ink)' }}><input type="checkbox" checked={f.agree} onChange={set('agree')} /> I have read and accept the instructor agreement</label></>}
      {err && <div className="err">{err}</div>}
      <button className="btn primary" style={{ width: '100%', marginTop: 16 }} disabled={busy}>{busy ? 'One moment...' : signup ? 'Create my account' : 'Sign in'}</button>
    </form>
    <p className="small mute" style={{ textAlign: 'center', marginTop: 14 }}>{signup ? <>Already an instructor? <Link href="/login">Sign in</Link></> : <>New here? <Link href="/signup">Create an account</Link> · <Link href="/forgot">Forgot password?</Link></>}</p>
  </div></div>);
}
