'use client';
import { useState } from 'react';
export async function api(op, body = {}) {
  const r = await fetch('/api/d', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ op, ...body }) }); const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something went wrong'); return j;
}
export function Modal({ title, onClose, children }) {
  return (<div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal"><div className="row" style={{ justifyContent: 'space-between' }}><h2 className="disp" style={{ fontSize: 28, margin: 0 }}>{title}</h2><button className="btn sm" onClick={onClose}>Close</button></div>{children}</div></div>);
}
export function useAct(reload) {
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const act = async (op, body, ok) => { setErr(''); setMsg(''); try { const j = await api(op, body); await reload(); const m = typeof ok === 'function' ? ok(j) : ok; if (m) setMsg(m); return true; } catch (e) { setErr(e.message); return false; } };
  return { err, msg, act, setErr, setMsg, note: (<>{err && <div className="err">{err}</div>}{msg && <div className="ok">{msg}</div>}</>) };
}
export const when = (iso) => iso ? new Date(iso).toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';
export const day = (iso) => iso ? new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : '';
export const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };
