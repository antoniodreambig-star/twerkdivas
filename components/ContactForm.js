'use client';
import { useState } from 'react';
export default function ContactForm() {
  const [f, setF] = useState({ name: '', email: '', message: '' }); const [st, setSt] = useState(''); const [err, setErr] = useState('');
  async function go(e) { e.preventDefault(); setErr(''); setSt('busy'); const r = await fetch('/api/public/contact', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(f) }); const j = await r.json().catch(() => ({})); if (!r.ok) { setErr(j.error || 'Something went wrong'); setSt(''); } else setSt('done'); }
  if (st === 'done') return <div className="card"><b>Thank you!</b><p className="mute">We got your message and will reply by email.</p></div>;
  return (<form onSubmit={go} className="card" style={{ maxWidth: 520 }}><label>Your name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required /><label>Email</label><input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required /><label>Message</label><textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} required minLength={5} />{err && <div className="err">{err}</div>}<button className="btn primary" style={{ marginTop: 14 }} disabled={st === 'busy'}>{st === 'busy' ? 'Sending…' : 'Send message'}</button></form>);
}
