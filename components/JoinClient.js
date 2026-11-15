'use client';
import { useEffect, useState } from 'react';
export default function JoinClient({ name, price, welcome, on, paid, canceled, status }) {
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(!!paid);
  useEffect(() => { if (!paid) return; (async () => {
    for (let i = 0; i < 4; i++) { const r = await fetch('/api/billing/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ session: paid }) }); const j = await r.json().catch(() => ({})); if (j.active) { window.location.href = '/app'; return; } if (!r.ok) { setErr(j.error || 'Could not confirm payment'); break; } await new Promise((s) => setTimeout(s, 1500)); }
    setBusy(false); })(); }, [paid]);
  async function pay() { setErr(''); setBusy(true); const r = await fetch('/api/billing/checkout', { method: 'POST' }); const j = await r.json().catch(() => ({})); if (j.url) window.location.href = j.url; else { setErr(j.error || 'Could not start checkout'); setBusy(false); } }
  async function out() { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/'; }
  return (<div className="wrap"><div className="authbox card pop" style={{ textAlign: 'center' }}><img src="/logo.svg" alt="TwerkDivas" />
    <h1 style={{ fontSize: 26 }}>Hi {name.split(' ')[0]}, one last step</h1><p className="mute">{welcome}</p>
    <div className="price" style={{ margin: "12px 0" }}>{price || 'Monthly membership'}</div><p className="small mute">Billed monthly. Cancel any time.</p>
    {status && status !== 'active' && <div className="err">Your membership status is "{status}". Start a new membership to continue.</div>}
    {canceled && <div className="err">Checkout was canceled. You have not been charged.</div>}
    {busy && paid && <div className="ok">Confirming your payment...</div>}{err && <div className="err">{err}</div>}
    <button className="btn primary" style={{ width: '100%' }} onClick={pay} disabled={busy || !on}>{busy ? 'One moment...' : 'Start my membership'}</button>
    {!on && <p className="small mute">Billing is not switched on yet. Please contact TwerkDivas.</p>}
    <p><button className="btn sm" onClick={out}>Sign out</button></p></div></div>);
}
