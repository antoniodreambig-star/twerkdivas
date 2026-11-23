'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Player from './Player';
import ScrollRow from './ScrollRow';
import Icon from './Icon';
import Earnings from './Earnings';
import Scanner from './Scanner';
import { Modal, useAct, when, day } from './ui';
import { fmtWhen, fmtTime, utcToZonedInput } from '@/lib/tz';
import { TZ_OPTIONS } from '@/lib/us';

const NAV = [['home', 'home', 'Home'], ['learn', 'play', 'Learn'], ['cert', 'award', 'Certify'], ['classes', 'cal', 'Classes'], ['earn', 'award', 'Earnings'], ['resources', 'book', 'Resources'], ['people', 'users', 'Community'], ['support', 'chat', 'Support'], ['me', 'user', 'Profile']];
export default function MemberApp({ isAdmin }) {
  const [d, setD] = useState(null); const [tab, setTab] = useState('home'); const [fatal, setFatal] = useState('');
  const load = useCallback(async () => { const r = await fetch('/api/d?view=member'); const j = await r.json().catch(() => ({})); if (r.status === 401) location.href = '/login'; else if (r.status === 402) location.href = '/join'; else if (!r.ok) setFatal(j.error || 'Could not load'); else setD(j); }, []);
  useEffect(() => { load(); }, [load]);
  const out = async () => { await fetch('/api/auth/logout', { method: 'POST' }); location.href = '/'; };
  if (fatal) return <div className="main"><div className="err">{fatal}</div></div>;
  if (!d) return <div className="main mute">Loading...</div>;
  const unread = d.messages.filter((m) => m.from === 'admin' && !m.read).length;
  const P = { d, load, go: setTab };
  return (<div className="app"><header className="appbar"><div className="wrap bar2"><img src="/logo-sm.png" alt="Cakes and Core Twerk Fitness" /><div className="row">{isAdmin && <a className="btn sm" href="/admin">Admin console</a>}<span className="who">{d.me.name.split(' ')[0]}</span><button className="btn sm" onClick={out}>Sign out</button></div></div></header>
    <main className="stage">{tab === 'home' && <Home {...P} />}{tab === 'learn' && <Learn {...P} />}{tab === 'cert' && <Certify {...P} />}{tab === 'classes' && <Classes {...P} />}{tab === 'earn' && <Earnings {...P} />}{tab === 'resources' && <Resources {...P} />}{tab === 'people' && <People {...P} />}{tab === 'support' && <Support {...P} />}{tab === 'me' && <Profile {...P} />}</main>
    <nav className="dock" aria-label="Main">{NAV.map(([k, i, l]) => <button key={k} className={tab === k ? 'on' : ''} onClick={() => { setTab(k); load(); window.scrollTo({ top: 0 }); }}><Icon n={i} /><span>{l}</span>{k === 'support' && unread > 0 && <b className="dot">{unread}</b>}</button>)}</nav></div>);
}

function Home({ d, go }) {
  const total = d.videos.length, done = d.progress.length; const pct = total ? Math.round((done / total) * 100) : 0;
  const certs = d.certs.map((c) => d.programs.find((p) => p.id === c.programId)?.title).filter(Boolean);
  const mine = d.classes.filter((c) => new Date(c.start) >= new Date()).slice(0, 3);
  return (<><h1>Hey {d.me.name.split(' ')[0]}!</h1><p className="mute">{d.settings.welcome}</p>
    <div className="row" style={{ margin: '16px 0' }}>
      <div className="stat"><b>{pct}%</b>of videos watched</div><div className="stat"><b>{certs.length}</b>certifications</div><div className="stat"><b>{mine.length}</b>upcoming classes</div></div>
    <div className="bar"><i style={{ width: `${pct}%` }} /></div>
    {certs.length > 0 && <p style={{ marginTop: 14 }}>{certs.map((c) => <span key={c} className="tag volt" style={{ marginRight: 6 }}>✓ Certified: {c}</span>)}</p>}
    <h2>Announcements</h2>{d.announcements.length === 0 && <p className="mute">Nothing new yet.</p>}
    <div className="grid" style={{ gridTemplateColumns: '1fr' }}>{d.announcements.map((a) => <div className="card" key={a.id}><div className="row">{a.pinned && <span className="tag pink">Pinned</span>}<b>{a.title}</b><span className="small mute">{day(a.createdAt)}</span></div><p style={{ whiteSpace: 'pre-wrap', margin: '8px 0 0' }}>{a.body}</p></div>)}</div>
    <h2>Jump to</h2><div className="tiles">{[['learn', 'play', 'Learn', `${done} of ${total} videos watched`, 't1'], ['cert', 'award', 'Get certified', certs.length ? `${certs.length} certified` : 'Submit a teaching video', 't2'], ['classes', 'cal', 'My classes', `${mine.length} upcoming`, 't3'], ['resources', 'book', 'Resources', 'Music, plans and forms', 't4'], ['people', 'users', 'Community', 'Certified instructors', 't5'], ['support', 'chat', 'Support', 'Message the team', 't6']].map(([k, i, t, sub, c]) => <button key={k} className={`tile ${c}`} onClick={() => go(k)}><Icon n={i} /><b>{t}</b><span>{sub}</span></button>)}</div>
</>);
}

function Learn({ d, load }) {
  const [pid, setPid] = useState(d.programs[0]?.id); const [vid, setVid] = useState(null); const { note, act } = useAct(load);
  const list = useMemo(() => d.videos.filter((v) => v.programId === pid), [d, pid]); const doneSet = new Set(d.progress);
  const cur = vid && d.videos.find((v) => v.id === vid);
  const prog = d.programs.find((p) => p.id === pid);
  const nWatched = list.filter((v) => doneSet.has(v.id)).length;
  return (<><h1>Learn</h1><ScrollRow className="chips" label="programs" role="tablist" aria-label="Programs">{d.programs.map((p) => { const t = d.videos.filter((v) => v.programId === p.id); const n = t.filter((v) => doneSet.has(v.id)).length; return <button key={p.id} role="tab" aria-selected={pid === p.id} className={pid === p.id ? 'on' : ''} onClick={() => { setPid(p.id); setVid(null); }}>{p.title}{t.length ? <em>{n}/{t.length}</em> : null}</button>; })}</ScrollRow>
    {prog && !cur && <div className="card progcard"><h2>{prog.title}</h2>{prog.blurb && <p className="small mute progblurb">{prog.blurb}</p>}{list.length > 0 && <div style={{ marginTop: 14 }}><div className="meter" style={{ maxWidth: 'none' }} aria-label={`${nWatched} of ${list.length} videos watched`}><i style={{ width: `${Math.round((nWatched / list.length) * 100)}%` }} /></div><div className="small mute" style={{ marginTop: 6 }}>{nWatched} of {list.length} videos watched</div></div>}</div>}{note}
    {cur ? <div className="card"><button className="btn sm" onClick={() => setVid(null)}>← Back to list</button>
      <h2 style={{ marginTop: 14 }}>{cur.title}</h2><div className="row small mute" style={{ marginBottom: 10 }}><span className="tag cyan">{cur.level}</span>{cur.minutes ? <span>{cur.minutes} min</span> : null}</div>
      <Player url={cur.url} videoId={cur.id} who={`${d.me.name} · ${d.me.email}`} />
      {cur.music && <p><b>Music:</b> {cur.music}</p>}{cur.notes && <p style={{ whiteSpace: 'pre-wrap' }}>{cur.notes}</p>}
      <button className={`btn ${doneSet.has(cur.id) ? '' : 'volt'}`} onClick={() => act('progress', { videoId: cur.id, done: !doneSet.has(cur.id) })}>{doneSet.has(cur.id) ? '✓ Watched (tap to undo)' : 'Mark as watched'}</button></div>
      : <div className="vlist">{list.length === 0 && <div className="empty">No videos in this program yet. Check back soon.</div>}
        {list.map((v, i) => <button type="button" key={v.id} className={`vrow click ${doneSet.has(v.id) ? 'done' : ''}`} onClick={() => setVid(v.id)}><span className="vnum">{doneSet.has(v.id) ? '✓' : i + 1}</span><div className="vbody"><div className="vtitle">{v.title}</div><div className="vmeta"><span className="tag cyan">{v.level}</span>{v.minutes ? <span>{v.minutes} min</span> : null}{doneSet.has(v.id) && <span className="tag ok">Watched</span>}</div></div><span className="vgo" aria-hidden="true">›</span></button>)}</div>}</>);
}

function Certify({ d, load }) {
  const mineP = (pid) => d.submissions.some((x) => x.programId === pid); const progs = d.programs.filter((p) => p.cert !== false && (!p.certHidden || mineP(p.id))); const { note, act } = useAct(load); const [f, setF] = useState({ programId: progs[0]?.id || '', url: '', note: '' });
  const prereq = !!d.me.agreedAt && !!d.me.cpr;
  const st = (pid) => { const s = d.submissions.filter((x) => x.programId === pid); return s.find((x) => x.status === 'approved') || s[0]; };
  return (<><h1>Get certified</h1><p className="mute">Teach the routine on video, submit the link, and the Cakes and Core team will review it. Approved instructors earn a certified badge and appear in the directory.</p>{note}
    <div className="card" style={{ margin: '14px 0' }}><b>Before you submit</b><p style={{ margin: '6px 0' }}>{d.me.agreedAt ? '✅' : '⬜'} Instructor agreement accepted<br />{d.me.cpr ? '✅' : '⬜'} {d.settings.prereqs} — add it under My profile</p></div>
    <div className="grid">{progs.map((p) => { const s = st(p.id); return (<div key={p.id} className="card"><h3 style={{ fontSize: 19 }}>{p.title}</h3>{p.certInfo && <p className="small" style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{p.certInfo}</p>}
      {(() => { const vs = d.videos.filter((v) => v.programId === p.id); const n = vs.filter((v) => d.progress.includes(v.id)).length; return vs.length ? <div style={{ margin: '6px 0' }}><div className="meter" aria-label={`${n} of ${vs.length} lessons watched`}><i style={{ width: `${Math.round((n / vs.length) * 100)}%` }} /></div><div className="small mute">{n} of {vs.length} lessons watched</div></div> : null; })()}{s?.status === 'approved' && <p><span className="tag ok">✓ Certified</span> <a className="btn sm" href={`/certificate/${s.id}`} target="_blank" rel="noopener noreferrer">Print certificate</a></p>}{s?.status === 'pending' && <p><span className="tag cyan">In review</span></p>}
      {s?.status === 'revoked' && <div className="err"><b>Certification removed</b><p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{s.feedback || 'You can submit a new video to get certified again.'}</p></div>}{s?.status === 'changes' && <div className="err"><b>Changes requested</b><p style={{ margin: '4px 0 0', whiteSpace: 'pre-wrap' }}>{s.feedback || 'Please resubmit.'}</p></div>}
      {!s && <p className="small mute">Not submitted yet.</p>}</div>); })}</div>
    <h2>Submit a video</h2>
    {!prereq ? <div>{!d.me.agreedAt && <div className="card" style={{ marginBottom: 12 }}><b>Instructor agreement</b><p className="small mute" style={{ whiteSpace: 'pre-wrap' }}>{d.settings.agreement}</p><button className="btn primary" onClick={() => act('agree', {}, 'Agreement accepted')}>I accept the agreement</button></div>}{!d.me.cpr && <div className="err">Add your CPR/AED link in Profile before submitting.</div>}</div> : <div className="card">
      <label>Program</label><select value={f.programId} onChange={(e) => setF({ ...f, programId: e.target.value })}>{progs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
      <label>Link to your teaching video (YouTube unlisted, Vimeo, Loom, Drive, etc.)</label><input value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://..." />
      <label>Notes for the reviewer (optional)</label><textarea value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} />
      <button className="btn primary" style={{ marginTop: 12 }} onClick={async () => { if (await act('submit', f, 'Submitted! We will review it soon.')) setF({ ...f, url: '', note: '' }); }}>Submit for review</button></div>}</>);
}

const $ = (c) => (c === 0 ? 'Free' : `$${(c / 100).toFixed(c % 100 ? 2 : 0)}`);
function Classes({ d, load }) {
  const { note, act } = useAct(load); const [edit, setEdit] = useState(null); const [roster, setRoster] = useState(null); const [copied, setCopied] = useState('');
  const blank = { title: '', programId: d.certs[0]?.programId || '', start: '', end: '', mode: 'in-person', venueId: d.venues[0]?.id || '', tz: 'America/Chicago', link: '', bookUrl: '', bookNote: '', spots: 0, price: 0, notes: '', public: true, repeatWeeks: 1 };
  const up = d.classes.filter((c) => new Date(c.start) >= new Date(Date.now() - 36e5)); const past = d.classes.filter((c) => !up.includes(c));
  const pn = (id) => d.programs.find((p) => p.id === id)?.title || ''; const vn = (id) => d.venues.find((v) => v.id === id);
  const certIds = d.certs.map((c) => c.programId); const venue = edit && vn(edit.venueId);
  const copy = async (c) => { const url = `${location.origin}/classes/${c.id}`; try { await navigator.clipboard.writeText(url); } catch {} setCopied(c.id); setTimeout(() => setCopied(''), 2000); };
  const startEdit = (c) => { const tz = c.tz || 'America/Chicago'; setEdit({ ...c, price: (c.price || 0) / 100, start: utcToZonedInput(c.start, tz), end: utcToZonedInput(c.end, tz) }); };
  const R = (c, past) => <ClassRow key={c.id} c={c} pn={pn} vn={vn} past={past} copied={copied === c.id} onCopy={() => copy(c)} onRoster={() => setRoster(c.id)} onEdit={() => startEdit(c)} onDel={() => confirm('Delete this class?') && act('class.del', { id: c.id })} />;
  return (<><div className="row" style={{ justifyContent: 'space-between' }}><h1>My classes</h1><button className="btn primary" onClick={() => setEdit({ ...blank })}>+ Add a class</button></div>{note}
    <p className="mute">Tickets are sold only on the Cakes and Core website. Pick a partner studio (its maximum attendance is enforced for you), set a ticket price and share your class link. On class day, open <b>Roster &amp; check-in</b>.</p>
    {certIds.length === 0 && <div className="card" style={{ borderColor: 'var(--pink)' }}><b>Get certified to sell tickets.</b><p className="small mute" style={{ margin: '4px 0 0' }}>Public classes need an approved certification in the program you teach. You can still save private classes.</p></div>}
    <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>{up.length === 0 && <p className="mute">No upcoming classes. Add one!</p>}{up.map((c) => R(c))}</div>
    {past.length > 0 && <><h2>Past</h2><div style={{ display: 'grid', gap: 10 }}>{past.slice(-6).reverse().map((c) => R(c, true))}</div></>}
    <h2>Everyone's upcoming classes</h2><div style={{ display: 'grid', gap: 10 }}>{d.upcoming.filter((c) => c.userId !== d.me.id).length === 0 && <p className="mute">Nothing yet.</p>}{d.upcoming.filter((c) => c.userId !== d.me.id).map((c) => <div className="card" key={c.id}><b>{c.title}</b> <span className="tag">{c.mode}</span><div className="small mute">{fmtWhen(c.start, c.tz)} · {c.who}{vn(c.venueId) ? ` · ${vn(c.venueId).city}, ${vn(c.venueId).state}` : ''}</div></div>)}</div>
    {roster && <RosterModal id={roster} onClose={() => { setRoster(null); load(); }} />}
    {edit && <Modal title={edit.id ? 'Edit class' : 'New class'} onClose={() => setEdit(null)}>
      {edit.sold > 0 && <div className="err" style={{ background: '#fff7e6', color: '#7a4a00', borderColor: '#f3d28a' }}>{edit.sold} ticket{edit.sold === 1 ? '' : 's'} sold: time, place and type are locked.</div>}
      <label>Class name</label><input value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
      <label>Program</label><select value={edit.programId} onChange={(e) => setEdit({ ...edit, programId: e.target.value })}><option value="">Other (private only)</option>{d.programs.map((p) => <option key={p.id} value={p.id}>{p.title}{certIds.includes(p.id) ? ' ✓ certified' : ''}</option>)}</select>
      <label>Type</label><select disabled={edit.sold > 0} value={edit.mode} onChange={(e) => setEdit({ ...edit, mode: e.target.value })}><option value="in-person">In person at a partner studio</option><option value="online">Online</option></select>
      {edit.mode === 'online' ? <><label>Time zone</label><select value={edit.tz} onChange={(e) => setEdit({ ...edit, tz: e.target.value })}>{TZ_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select><label>Private class link (Zoom, etc.)</label><input value={edit.link} onChange={(e) => setEdit({ ...edit, link: e.target.value })} placeholder="https://..." /></>
        : <><label>Partner studio</label>{d.venues.length === 0 ? <p className="small mute">No partner studios yet. Ask Cakes and Core to add one.</p> : <select disabled={edit.sold > 0} value={edit.venueId} onChange={(e) => setEdit({ ...edit, venueId: e.target.value })}>{d.venues.map((v) => <option key={v.id} value={v.id}>{v.name} · {v.city}, {v.state} (max {v.capacity})</option>)}</select>}</>}
      <div className="row"><div className="grow"><label>Starts{edit.mode === 'in-person' && venue ? ` (${venue.city} time)` : ''}</label><input type="datetime-local" disabled={edit.sold > 0} value={edit.start} onChange={(e) => setEdit({ ...edit, start: e.target.value })} /></div><div className="grow"><label>Ends</label><input type="datetime-local" disabled={edit.sold > 0} value={edit.end} onChange={(e) => setEdit({ ...edit, end: e.target.value })} /></div></div>
      <div className="row"><div className="grow"><label>Ticket price ($, 0 = free)</label><input type="number" min="0" step="0.50" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></div><div className="grow"><label>{edit.mode === 'in-person' && venue ? `Spots (max ${venue.capacity}, 0 = full room)` : 'Spots (up to 1,000)'}</label><input type="number" min="0" value={edit.spots} onChange={(e) => setEdit({ ...edit, spots: e.target.value })} /></div></div>
      {!edit.id && <><label>Repeat weekly</label><select value={edit.repeatWeeks} onChange={(e) => setEdit({ ...edit, repeatWeeks: Number(e.target.value) })}><option value={1}>Just this once</option>{[2, 4, 6, 8, 12].map((n) => <option key={n} value={n}>Every week for {n} weeks</option>)}</select>{edit.repeatWeeks > 1 && <p className="small mute" style={{ margin: '4px 0 0' }}>Creates {edit.repeatWeeks} separate classes at the same local time. Each one sells tickets on its own.</p>}</>}
      {edit.mode === 'in-person' && <><label>Outside booking link (optional)</label><input value={edit.bookUrl || ''} onChange={(e) => setEdit({ ...edit, bookUrl: e.target.value })} placeholder="https://momence.com/..." /><p className="small mute" style={{ margin: '4px 0 0' }}>If the studio takes bookings on its own site, paste the link. The class page shows a Book a spot button to it instead of selling tickets here.</p><label>No tickets: show this note instead (optional)</label><input value={edit.bookNote || ''} onChange={(e) => setEdit({ ...edit, bookNote: e.target.value })} placeholder="e.g. A TruFit Athletic Club membership is required to join." /><p className="small mute" style={{ margin: '4px 0 0' }}>Turns off ticket sales for this class and shows the note on its page.</p></>}
      <label>Notes for attendees</label><textarea value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="What to wear, what to bring..." />
      <label style={{ display: 'flex', gap: 8, color: 'var(--ink)' }}><input type="checkbox" checked={edit.public} onChange={(e) => setEdit({ ...edit, public: e.target.checked })} /> Sell tickets on the Cakes and Core website</label>
      {note}<button className="btn primary" style={{ marginTop: 14 }} onClick={async () => { if (await act('class.save', { ...edit, spots: Number(edit.spots) || 0 }, 'Saved')) setEdit(null); }}>Save class</button></Modal>}</>);
}
function ClassRow({ c, pn, vn, past, copied, onCopy, onRoster, onEdit, onDel }) {
  const v = vn(c.venueId); const tz = c.tz || 'America/Chicago';
  return (<div className="card" style={past ? { opacity: .75 } : undefined}><div className="row"><b className="grow">{c.title}</b>{c.canceled && <span className="tag pink">Canceled</span>}<span className="tag">{c.mode}</span>{c.public === false ? <span className="tag">Private</span> : <span className="tag ok">On sale</span>}</div>
    <div className="small mute">{fmtWhen(c.start, tz)} · {pn(c.programId) || 'Other'}{v ? ` · ${v.name}, ${v.city}` : ''} · {$(c.price || 0)}</div>
    {c.public !== false && <div className="small" style={{ margin: '6px 0' }}><b>{c.sold}</b> sold of <b>{c.cap || '∞'}</b> · <b>{c.checkedIn}</b> checked in</div>}
    <div className="row" style={{ marginTop: 8 }}>{c.public !== false && !c.canceled && <><button className="btn sm primary" onClick={onRoster}>Roster &amp; check-in</button><button className="btn sm" onClick={onCopy}>{copied ? 'Copied!' : 'Copy ticket link'}</button></>}{!past && !c.canceled && <button className="btn sm" onClick={onEdit}>Edit</button>}{!past && !c.canceled && <button className="btn sm danger" onClick={onDel}>Delete</button>}</div></div>);
}
export function RosterModal({ id, onClose }) {
  const [r, setR] = useState(null); const [code, setCode] = useState(''); const [cam, setCam] = useState(false); const { note, act, setErr, setMsg } = useAct(async () => {});
  const refresh = useCallback(() => fetch(`/api/d?view=roster&classId=${id}`).then((x) => x.json()).then(setR), [id]); useEffect(() => { refresh(); }, [refresh]);
  async function go(body, ok) { setErr(''); setMsg(''); if (await act('checkin', body, ok)) await refresh(); }
  if (!r) return <Modal title="Roster" onClose={onClose}><p className="mute">Loading…</p></Modal>; if (r.error) return <Modal title="Roster" onClose={onClose}><div className="err">{r.error}</div></Modal>;
  const tz = r.cls.tz || 'America/Chicago';
  return (<Modal title="Roster & check-in" onClose={onClose}>
    <b>{r.cls.title}</b><div className="small mute">{fmtWhen(r.cls.start, tz)}{r.cls.venue ? ` · ${r.cls.venue}` : ''}</div>
    <div className="row" style={{ margin: '12px 0', gap: 10 }}><div className="stat"><b>{r.checkedIn}</b>checked in</div><div className="stat"><b>{r.sold}</b>tickets sold</div><div className="stat"><b>{r.cap || '∞'}</b>max attendance</div></div>
    <label>Enter or scan a ticket code</label><div className="row"><input className="grow" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter' && code) go({ code }, (j) => `${j.name} is checked in`).then(() => setCode('')); }} placeholder="e.g. 7KQ2M9XD" autoCapitalize="characters" /><button className="btn primary" disabled={!code} onClick={async () => { await go({ code }, (j) => `${j.name} is checked in`); setCode(''); }}>Check in</button><button className="btn" onClick={() => setCam(!cam)}>{cam ? 'Hide camera' : 'Scan with camera'}</button></div>{cam && <Scanner onClose={() => setCam(false)} onCode={(c) => go({ code: c }, (j) => `${j.name} is checked in`)} />}
    {note}<h3 style={{ marginTop: 16 }}>Attendees</h3>
    <div style={{ display: 'grid', gap: 6 }}>{r.tickets.length === 0 && <p className="mute">No tickets sold yet.</p>}{r.tickets.map((t) => <div className="row card" key={t.id} style={{ padding: '8px 12px' }}><div className="grow"><b>{t.name}</b><div className="small mute">{t.code} · {t.email}</div></div>{t.checkedInAt ? <><span className="tag ok">In {fmtTime(t.checkedInAt, tz)}</span><button className="btn sm" onClick={() => go({ id: t.id, undo: true }, 'Check-in undone')}>Undo</button></> : <button className="btn sm primary" onClick={() => go({ id: t.id }, `${t.name} is checked in`)}>Check in</button>}</div>)}</div></Modal>);
}

function Resources({ d }) {
  return (<><h1>Resources</h1><p className="mute">Music lists, class plans, waivers and more from Cakes and Core.</p>
    <div className="grid">{d.resources.length === 0 && <p className="mute">Nothing here yet.</p>}{d.resources.map((r) => <div className="card" key={r.id}><span className="tag volt">{r.kind}</span><h3 style={{ fontSize: 18, margin: '10px 0 6px' }}>{r.title}</h3><p className="mute small">{r.desc}</p>{r.url && <a className="btn sm primary" href={r.url} target="_blank" rel="noopener noreferrer">Open</a>}</div>)}</div></>);
}

function People({ d }) {
  const [list, setList] = useState(null);
  useEffect(() => { fetch('/api/public/instructors').then((r) => r.json()).then((j) => setList(j.instructors || [])).catch(() => setList([])); }, []);
  return (<><h1>Community</h1><p className="mute">Certified Cakes and Core instructors.</p>
    <div className="grid">{(list || []).map((i, k) => <div className="card" key={k}>{i.photo && <img src={i.photo} alt="" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }} referrerPolicy="no-referrer" />}<h3 style={{ fontSize: 18 }}>{i.name}</h3><div className="small mute">{i.city}</div><p className="small">{i.bio}</p>{i.certified.map((c) => <span key={c} className="tag volt" style={{ marginRight: 4 }}>{c}</span>)}</div>)}</div>{list && !list.length && <p className="mute">Certified instructors will appear here.</p>}</>);
}

function Support({ d, load }) {
  const { note, act } = useAct(load); const [t, setT] = useState('');
  return (<><h1>Support</h1><p className="mute">Message the Cakes and Core team with questions.</p>{note}
    <div className="card" style={{ minHeight: 160 }}>{d.messages.length === 0 && <p className="mute">No messages yet.</p>}{d.messages.map((m) => <div key={m.id} className={`bubble ${m.from === 'member' ? 'me' : ''}`}><div>{m.text}</div><div className="small mute">{when(m.createdAt)}</div></div>)}</div>
    <textarea value={t} onChange={(e) => setT(e.target.value)} placeholder="Write a message..." style={{ marginTop: 12 }} /><button className="btn primary" style={{ marginTop: 8 }} onClick={async () => { if (await act('message', { text: t })) setT(''); }}>Send</button></>);
}

function Profile({ d, load }) {
  const m = d.me; const { note, act } = useAct(load); const [f, setF] = useState({ name: m.name, bio: m.bio, photo: m.photo, city: m.city, phone: m.phone, listed: m.listed, cprUrl: m.cpr?.url || '', instagram: m.instagram || '', tiktok: m.tiktok || '', website: m.website || '', specialties: m.specialties || '', cities: m.cities || '' });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  async function portal() { const r = await fetch('/api/billing/portal', { method: 'POST' }); const j = await r.json().catch(() => ({})); if (j.url) location.href = j.url; else alert(j.error || 'Could not open billing'); }
  return (<><h1>My profile</h1>{note}<div className="card">
    <label>Name</label><input value={f.name} onChange={set('name')} /><label>City</label><input value={f.city} onChange={set('city')} /><label>Phone (private)</label><input value={f.phone} onChange={set('phone')} />
    <label>Short bio</label><textarea value={f.bio} onChange={set('bio')} /><label>Photo link (https)</label><input value={f.photo} onChange={set('photo')} />
    <label>Specialties (shown on your public page)</label><input value={f.specialties} onChange={set('specialties')} placeholder="Twerk cardio, barre, beginners" /><label>Other cities you teach in</label><input value={f.cities} onChange={set('cities')} placeholder="Killeen, Austin" />
    <div className="row"><div className="grow"><label>Instagram handle</label><input value={f.instagram} onChange={set('instagram')} placeholder="yourname" /></div><div className="grow"><label>TikTok handle</label><input value={f.tiktok} onChange={set('tiktok')} placeholder="yourname" /></div></div><label>Website (https)</label><input value={f.website} onChange={set('website')} placeholder="https://..." />
    <label>{d.settings.prereqs}</label><input value={f.cprUrl} onChange={set('cprUrl')} placeholder="https://..." />
    <label style={{ display: 'flex', gap: 8, color: 'var(--ink)' }}><input type="checkbox" checked={f.listed} onChange={set('listed')} /> List me in the instructor directory once certified</label>
    <button className="btn primary" style={{ marginTop: 14 }} onClick={() => act('profile', f, 'Profile saved')}>Save profile</button></div>
    <h2>Membership</h2><div className="card"><p style={{ marginTop: 0 }}>{m.role === 'admin' ? 'Admin account' : m.comp ? 'Complimentary access from Cakes and Core' : m.sub ? <>Status: <b>{m.sub.status}</b>{m.sub.periodEnd ? ` · ${m.sub.cancelAtEnd ? 'ends' : 'renews'} ${day(m.sub.periodEnd)}` : ''}</> : 'No active subscription'}</p>{m.sub && <button className="btn" onClick={portal}>Manage billing / cancel</button>}</div>
    <p className="small mute">Agreement accepted {day(m.agreedAt)}.</p></>);
}
