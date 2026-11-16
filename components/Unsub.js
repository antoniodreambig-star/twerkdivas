'use client';
import { useState } from 'react';
export default function Unsub({ email, t }) {
  const [st, setSt] = useState(''); async function go() { setSt('busy'); const r = await fetch('/api/public/unsubscribe', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, t }) }); setSt(r.ok ? 'done' : 'err'); }
  if (st === 'done') return <div className="card"><b>You are unsubscribed.</b><p className="mute small">{email} will no longer get marketing emails. You will still get ticket receipts.</p></div>;
  return (<div className="card"><p>Stop marketing emails to <b>{email}</b>?</p>{st === 'err' && <div className="err">This link is not valid.</div>}<button className="btn primary" onClick={go} disabled={st === 'busy'}>Unsubscribe</button></div>);
}
