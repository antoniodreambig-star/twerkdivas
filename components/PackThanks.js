'use client';
import { useEffect, useState } from 'react';
export default function PackThanks({ passId, session }) {
  const [r, setR] = useState(null); const [tries, setTries] = useState(0);
  useEffect(() => { let on = true; (async () => { const j = await fetch('/api/public/packs/sync', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ passId, session }) }).then((x) => x.json()).catch(() => ({})); if (!on) return; if (j.status === 'active') setR(j); else if (tries < 6) setTimeout(() => setTries(tries + 1), 2000); else setR({ status: 'pending' }); })(); return () => { on = false; }; }, [tries]);
  if (!r) return <p className="mute">Confirming your payment…</p>;
  if (r.status !== 'active') return <div className="card"><b>We are still confirming your payment.</b><p className="mute small">Your pack code will be emailed to you as soon as it clears.</p></div>;
  return (<div className="card"><b>Your class pack is ready!</b><p className="mute small">{r.credits} credits. We also emailed this code to you.</p><div className="code">{r.code}</div><p className="small mute">Enter it with your email at checkout on any ticketed class.</p><a className="btn primary" href="/classes">Find a class</a></div>);
}
