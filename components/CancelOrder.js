'use client';
import { useState } from 'react';
export default function CancelOrder({ orderId, hours, refundable }) {
  const [st, setSt] = useState(''); const [err, setErr] = useState('');
  async function go() { if (!confirm(refundable ? 'Cancel these tickets and get a full refund?' : 'Cancel these tickets and return your credits?')) return; setSt('busy'); setErr(''); const r = await fetch('/api/public/orders/cancel', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ orderId }) }); const j = await r.json().catch(() => ({})); if (r.ok) location.reload(); else { setErr(j.error || 'Could not cancel'); setSt(''); } }
  return (<div style={{ marginTop: 10 }}><button className="btn sm danger" onClick={go} disabled={st === 'busy'}>Cancel tickets</button> <span className="small mute">Free cancellation until {hours} hours before class.</span>{err && <div className="err">{err}</div>}</div>);
}
