'use client';
import { useState } from 'react';
export default function ReviewForm({ orderId }) {
  const [n, setN] = useState(0); const [t, setT] = useState(''); const [err, setErr] = useState(''); const [done, setDone] = useState(false);
  const go = async () => { setErr(''); const r = await fetch('/api/public/reviews', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId, rating: n, text: t }) }); const j = await r.json().catch(() => ({})); if (!r.ok) setErr(j.error || 'Could not save'); else setDone(true); };
  if (done) return <div className="ok" id="rate">Thank you for rating your class!</div>;
  return (<div className="card" id="rate"><h2>How was your class?</h2><div className="row" role="radiogroup" aria-label="Rating">{[1, 2, 3, 4, 5].map((i) => <button key={i} type="button" aria-label={`${i} star${i > 1 ? 's' : ''}`} aria-pressed={n >= i} className="btn sm" style={{ fontSize: 22, color: n >= i ? 'var(--pink)' : 'var(--line2)' }} onClick={() => setN(i)}>★</button>)}</div>
    <label>Anything you want to share? (optional)</label><textarea maxLength={600} value={t} onChange={(e) => setT(e.target.value)} />{err && <div className="err">{err}</div>}<button className="btn primary" style={{ marginTop: 10 }} disabled={!n} onClick={go}>Submit rating</button></div>);
}
