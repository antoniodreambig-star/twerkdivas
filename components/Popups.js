'use client';
import { useState } from 'react';
import { Modal, useAct } from './ui';
import { fmtWhen, utcToZonedInput } from '@/lib/tz';
import { STATES, STATE_TZ, TZ_OPTIONS } from '@/lib/us';
import { RosterModal } from './MemberApp';

const $ = (c) => `$${((c || 0) / 100).toFixed(2)}`;
// Pop-up events: admins run them for any instructor; members run their own.
export default function Popups({ d, load, admin }) {
  const { note, act } = useAct(load); const [e, setE] = useState(null); const [roster, setRoster] = useState(null);
  const cand = (d.members || []).filter((m) => !m.suspended).sort((a, b) => a.name.localeCompare(b.name));
  const blank = { title: '', tagline: '', instructorId: admin ? (cand.find((m) => m.role !== 'admin') || cand[0])?.id || '' : d.me?.id, programId: d.programs[0]?.id || '', venueName: '', address: '', city: '', state: 'TX', zip: '', tz: STATE_TZ.TX, start: '', end: '', capacity: 40, price: 20, notes: '', public: true };
  const edit = (p) => setE({ ...p, start: utcToZonedInput(p.start, p.tz), end: utcToZonedInput(p.end, p.tz), price: p.price / 100 });
  const ins = e && admin && cand.find((m) => m.id === e.instructorId);
  return (<><div className="row" style={{ justifyContent: 'space-between' }}>{admin ? <h1>Pop-up events</h1> : <h2>My pop-up events</h2>}<button className="btn primary" onClick={() => setE({ ...blank })}>+ New pop-up</button></div>{note}
    <p className="mute">Create one-night events at any location{admin ? '' : ' and teach them yourself'}. Each pop-up is listed on the public <a href="/classes" target="_blank" rel="noopener noreferrer">Classes page</a> and the <a href="/popups" target="_blank" rel="noopener noreferrer">Pop-up events page</a>, and uses the same capacity limit, refunds and check-in as classes.</p>
    <div style={{ display: 'grid', gap: 10 }}>{d.popups.length === 0 && <p className="mute">No pop-ups yet.</p>}{d.popups.map((p) => <div className="card" key={p.id}><div className="row"><b className="grow">{p.title}</b>{p.canceled && <span className="tag pink">Canceled</span>}{!p.public && <span className="tag">Hidden</span>}<span className="tag volt">{p.sold}/{p.capacity} sold</span></div>
      <div className="small mute">{fmtWhen(p.start, p.tz)} · {p.venueName}, {p.city} {p.state} · with {p.instructor} · {$(p.price)}</div>
      <div className="row" style={{ marginTop: 8 }}>{!p.canceled && <button className="btn sm primary" onClick={() => setRoster(p.id)}>Roster &amp; check-in</button>}{!p.canceled && <button className="btn sm" onClick={() => edit(p)}>Edit</button>}<a className="btn sm" href={`/classes/${p.id}`} target="_blank" rel="noopener noreferrer">View page</a>{!p.canceled && <button className="btn sm danger" onClick={() => confirm(`Delete "${p.title}"?`) && act('popup.del', { id: p.id }, 'Deleted')}>Delete</button>}</div></div>)}</div>
    {roster && <RosterModal id={roster} onClose={() => { setRoster(null); load(); }} />}
    {e && <Modal title={e.id ? 'Edit pop-up' : 'New pop-up event'} onClose={() => setE(null)}>
      {e.sold > 0 && <div className="err" style={{ background: '#fff7e6', color: '#7a4a00', borderColor: '#f3d28a' }}>{e.sold} ticket(s) sold: date and time are locked.</div>}
      <label>Event name</label><input value={e.title} onChange={(x) => setE({ ...e, title: x.target.value })} placeholder="Twerk & Tequila Night" /><label>Tagline</label><input value={e.tagline} onChange={(x) => setE({ ...e, tagline: x.target.value })} placeholder="One night. One room. Zero chill." />
      {admin && <><label>Instructor</label><select value={e.instructorId} onChange={(x) => setE({ ...e, instructorId: x.target.value })}>{cand.map((m) => <option key={m.id} value={m.id}>{m.name}{m.city ? ` · ${m.city}` : ''}</option>)}</select>{ins?.bio && <p className="small mute" style={{ margin: '4px 0 0' }}>{ins.bio.slice(0, 140)}</p>}</>}
      <label>Program</label><select value={e.programId} onChange={(x) => setE({ ...e, programId: x.target.value })}><option value="">Mixed / other</option>{d.programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
      <label>Location name</label><input value={e.venueName} onChange={(x) => setE({ ...e, venueName: x.target.value })} placeholder="The Warehouse" /><label>Street address</label><input value={e.address} onChange={(x) => setE({ ...e, address: x.target.value })} />
      <div className="row"><div className="grow"><label>City</label><input value={e.city} onChange={(x) => setE({ ...e, city: x.target.value })} /></div><div><label>State</label><select value={e.state} onChange={(x) => setE({ ...e, state: x.target.value, tz: STATE_TZ[x.target.value] || e.tz })}>{Object.entries(STATES).map(([k, n]) => <option key={k} value={k}>{k} · {n}</option>)}</select></div><div style={{ width: 110 }}><label>ZIP</label><input value={e.zip || ''} onChange={(x) => setE({ ...e, zip: x.target.value })} /></div></div>
      <div className="row"><div className="grow"><label>Date &amp; start time</label><input type="datetime-local" disabled={e.sold > 0} value={e.start} onChange={(x) => setE({ ...e, start: x.target.value })} /></div><div className="grow"><label>End time</label><input type="datetime-local" disabled={e.sold > 0} value={e.end} onChange={(x) => setE({ ...e, end: x.target.value })} /></div></div>
      <div className="row"><div className="grow"><label>Capacity</label><input type="number" min="1" value={e.capacity} onChange={(x) => setE({ ...e, capacity: x.target.value })} /></div><div className="grow"><label>Ticket price ($, 0 = free)</label><input type="number" min="0" step="0.50" value={e.price} onChange={(x) => setE({ ...e, price: x.target.value })} /></div><div className="grow"><label>Time zone</label><select value={e.tz} onChange={(x) => setE({ ...e, tz: x.target.value })}>{TZ_OPTIONS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div></div>
      <label>Event information</label><textarea style={{ minHeight: 140 }} value={e.notes} onChange={(x) => setE({ ...e, notes: x.target.value })} placeholder="What to expect, what to wear, parking, age limit, rules..." />
      <p className="small mute" style={{ margin: '10px 0 0' }}>Saved pop-ups go straight onto the public Classes page.</p>
      {note}<button className="btn primary" style={{ marginTop: 14 }} onClick={async () => { if (await act('popup.save', { ...e, capacity: Number(e.capacity) }, 'Saved')) setE(null); }}>Save pop-up</button></Modal>}</>);
}
