import Link from 'next/link';
import * as db from '@/lib/db';
import Icon from '@/components/Icon';
import { currentUser, hasAccess } from '@/lib/auth';
import { settings, ensureSeed } from '@/lib/data';
import { withBlurbs } from '@/lib/rules';
export const dynamic = 'force-dynamic';
const FEATS = [['play', 'Learn every routine', 'A structured video library for each program, organised by level, with counts, cues and music notes.'], ['award', 'Get certified', 'Submit a teaching video, receive direct feedback, and earn a certification badge for each program.'], ['cal', 'Teach and be found', 'List your online and in-person classes and appear in the Cakes and Core instructor directory.'], ['chat', 'Stay supported', 'Announcements, class resources and direct messaging with the Cakes and Core team.']];
const FAQ = [['Who is this for?', 'Dance and fitness instructors who want to teach the Cakes and Core programs online or in person.'], ['How does billing work?', 'A simple monthly membership, charged securely through Stripe. You can update your card or cancel any time from your profile.'], ['What do I need to get certified?', 'Accept the instructor agreement, add your CPR/AED certification, watch the program videos, and submit a teaching video for review.'], ['Can I share the videos?', 'No. Cakes and Core routines and videos are licensed to active, certified members for learning and teaching only.']];
export default async function Home() {
  const u = await currentUser().catch(() => null); const s = await settings(); await ensureSeed(); const progs = withBlurbs((await db.list('programs')).sort((a, b) => (a.order || 0) - (b.order || 0)));
  const go = u ? (hasAccess(u) ? '/app' : '/join') : '/signup';
  return (<>
    <div className="nav-top"><div className="wrap top"><img src="/logo-sm.png" alt="Cakes and Core Twerk Fitness" /><div className="row"><Link className="btn sm" href="/classes">Find a class</Link><Link className="btn sm" href="/studios">Partner studios</Link><Link className="btn sm" href="/login">Sign in</Link><Link className="btn sm primary" href={go}>{u ? 'Open app' : 'Join now'}</Link></div></div></div>
    <div className="wrap">
      <section className="hero"><div><span className="eyebrow">Instructor Academy</span><h1>Teach Cakes and Core with <em>confidence.</em></h1><p className="lead">{s.welcome}</p>
        <div className="row" style={{ marginTop: 26 }}><Link className="btn primary lg" href={go}>Become an instructor</Link><Link className="btn lg" href="/login">Sign in</Link></div>
        <div className="meta"><div><b>{progs.length || 3}</b>Programs</div><div><b>Online + in person</b>Teach anywhere</div><div><b>Certified</b>Badge and directory listing</div></div></div>
        <div className="art"><img src="/logo.png" alt="Cakes and Core Twerk Fitness" /></div></section>
      <section className="sec"><h2>How it works</h2><p className="sub">From sign-up to your first class in four steps.</p>
        <div className="steps">{[['Join', 'Create your account and subscribe.'], ['Learn', 'Work through the routines at your own pace.'], ['Certify', 'Submit a teaching video for review.'], ['Teach', 'List your classes and grow your community.']].map(([t, d]) => <div key={t}><b>{t}</b><span>{d}</span></div>)}</div></section>
      <div className="band"><div className="wrap"><section className="sec"><h2>Everything in one place</h2><p className="sub">The tools instructors need, built by Cakes and Core.</p>
        <div className="grid fit">{FEATS.map(([i, t, d]) => <div className="card feat" key={t}><div className="ico"><Icon n={i} /></div><h3>{t}</h3><p>{d}</p></div>)}</div></section></div></div>
      <section className="sec"><h2>Programs</h2><p className="sub">Choreography created by Cakes and Core, taught step by step.</p>
        <div className="hscroll">{progs.map((p) => <div className="card feat hcard" key={p.id}><h3>{p.title}</h3><p>{p.blurb}</p></div>)}</div></section>
      <section className="sec"><div className="card price-card pop"><span className="tag pink">Instructor membership</span><div className="price" style={{ margin: '16px 0 4px' }}>{s.price || 'Monthly'}</div><p className="mute small" style={{ margin: 0 }}>Billed monthly · cancel any time</p>
        <ul className="checks"><li>Full video library for every program</li><li>Certification and instructor badge</li><li>Class listings and directory profile</li><li>Resources, music and team support</li></ul><Link className="btn primary lg" style={{ width: '100%' }} href={go}>Get started</Link></div></section>
      <section className="sec faq" style={{ maxWidth: 760 }}><h2 style={{ marginBottom: 12 }}>Questions</h2>{FAQ.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
      <footer><span>© {new Date().getFullYear()} Cakes and Core</span><span><a href="https://twerkdivas.com">twerkdivas.com</a></span></footer></div></>);
}
