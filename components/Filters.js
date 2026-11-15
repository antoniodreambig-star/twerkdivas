'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
// Filters live in the link, so any filtered view (for example ?state=TX&city=Killeen) can be shared.
export default function Filters({ base, values, states = {}, cities = {}, programs = null, modes = false, search = true }) {
  const router = useRouter(); const [v, setV] = useState(values); const [copied, setCopied] = useState(false);
  const go = (n) => { const q = new URLSearchParams(); for (const [k, x] of Object.entries(n)) if (x) q.set(k, x); router.push(`${base}${q.toString() ? `?${q}` : ''}`); };
  const set = (k, x) => { const n = { ...v, [k]: x }; if (k === 'state') n.city = ''; setV(n); if (k !== 'q') go(n); };
  const cityList = v.state ? cities[v.state] || [] : [...new Set(Object.values(cities).flat())].sort();
  return (<form className="filters" onSubmit={(e) => { e.preventDefault(); go(v); }}>
    {Object.keys(states).length > 0 && <div><label>State</label><select value={v.state || ''} onChange={(e) => set('state', e.target.value)}><option value="">All states</option>{Object.entries(states).map(([c, n]) => <option key={c} value={c}>{n}</option>)}</select></div>}
    {cityList.length > 0 && <div><label>City</label><select value={v.city || ''} onChange={(e) => set('city', e.target.value)}><option value="">All cities</option>{cityList.map((c) => <option key={c}>{c}</option>)}</select></div>}
    {programs && <div><label>Program</label><select value={v.program || ''} onChange={(e) => set('program', e.target.value)}><option value="">All programs</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select></div>}
    {modes && <div><label>Type</label><select value={v.mode || ''} onChange={(e) => set('mode', e.target.value)}><option value="">In person + online</option><option value="in-person">In person</option><option value="online">Online</option></select></div>}
    {search && <div className="grow"><label>Search</label><input value={v.q || ''} onChange={(e) => setV({ ...v, q: e.target.value })} onBlur={() => go(v)} placeholder="Name, class or studio" /></div>}
    <div className="row" style={{ alignSelf: 'flex-end' }}><button className="btn primary sm" type="submit">Apply</button>{(v.state || v.city || v.program || v.mode || v.q) && <button type="button" className="btn sm" onClick={() => { setV({}); go({}); }}>Clear</button>}
      <button type="button" className="btn sm" onClick={async () => { try { await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* ignore */ } }}>{copied ? 'Link copied' : 'Copy link to this view'}</button></div>
  </form>);
}
