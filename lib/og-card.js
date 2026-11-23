// Branded 1200x630 share card for a class or pop-up (used by opengraph-image routes).
import { readFile } from 'fs/promises';
import { join } from 'path';
import { OG_LOGO } from './og-logo';
import { fmtTime } from './tz';

const PINK = '#FF1A7E', PINK_HI = '#FF5CA5', CHROME = '#F2F2F5', SILVER = '#C7C9D1';
let fonts = null;
export async function ogFonts() {
  if (!fonts) {
    const dir = join(process.cwd(), 'assets', 'fonts');
    const [head, bold, reg] = await Promise.all(['BigShoulders-Bold.ttf', 'Outfit-Bold.ttf', 'Outfit-Regular.ttf'].map((f) => readFile(join(dir, f))));
    fonts = [{ name: 'Head', data: head, weight: 700, style: 'normal' }, { name: 'Body', data: bold, weight: 700, style: 'normal' }, { name: 'Body', data: reg, weight: 400, style: 'normal' }];
  }
  return fonts;
}

const money = (c) => (c ? `$${(c / 100).toFixed(c % 100 ? 2 : 0)}` : 'FREE');
const pill = (text, solid) => <div style={{ display: 'flex', padding: '10px 26px', borderRadius: 999, fontSize: 26, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', background: solid ? PINK : CHROME, color: solid ? 'white' : '#0B0B10', boxShadow: solid ? '0 6px 0 #9E0A4C' : '0 6px 0 #8C8E96' }}>{text}</div>;

// c: the card fields from classPage() (or null when the class is gone).
export function ClassCard({ c, host }) {
  const title = c?.title || 'Cakes and Core';
  const kind = c?.popup ? 'Pop-up event' : 'Class';
  const day = c ? new Date(c.start).toLocaleDateString('en-US', { timeZone: c.tz, weekday: 'short', month: 'short', day: 'numeric' }) : 'Twerk · Cardio · Barre · Pilates';
  const time = c ? `${fmtTime(c.start, c.tz)}${c.end ? ` – ${fmtTime(c.end, c.tz)}` : ''}` : '';
  const where = c?.venueFull ? `${c.venueFull.name} · ${c.venueFull.city}, ${c.venueFull.state}` : c ? 'Online' : 'Killeen, TX · Denver, CO';
  const book = !c ? null : c.bookUrl ? 'Book on studio site' : c.bookNote ? 'Studio members' : money(c.price);
  const sub = c?.tagline || (c?.program && c.program !== title ? c.program : '');
  const size = title.length > 30 ? 72 : title.length > 14 ? 92 : 120;
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', fontFamily: 'Body', color: 'white', background: 'linear-gradient(135deg,#0B0B10 0%,#1A0A12 60%,#2A0718 100%)' }}>
      <div style={{ position: 'absolute', left: -160, top: -120, width: 760, height: 760, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,26,126,0.55) 0%, rgba(255,26,126,0.12) 45%, rgba(255,26,126,0) 70%)' }} />
      <div style={{ position: 'absolute', right: -200, bottom: -260, width: 700, height: 700, borderRadius: 999, background: 'radial-gradient(circle, rgba(255,92,165,0.22) 0%, rgba(255,92,165,0) 70%)' }} />
      <div style={{ display: 'flex', width: 430, alignItems: 'center', justifyContent: 'center', paddingLeft: 40 }}>
        <img src={OG_LOGO} width={390} height={308} alt="" />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '40px 60px 52px 16px', justifyContent: 'center' }}>
        <div style={{ display: 'flex' }}><div style={{ display: 'flex', fontSize: 24, fontWeight: 700, letterSpacing: 6, textTransform: 'uppercase', color: PINK_HI, borderBottom: `3px solid ${PINK}`, paddingBottom: 6 }}>{kind}</div></div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 22 }}>
          <div style={{ display: 'flex', fontFamily: 'Head', fontSize: size, lineHeight: 0.95, textTransform: 'uppercase', color: CHROME, textShadow: `4px 4px 0 ${PINK}` }}>{title}</div>
          {sub && <div style={{ display: 'flex', fontSize: 30, color: PINK_HI, marginTop: 12 }}>{sub}</div>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700 }}>{day}{time ? <span style={{ color: PINK_HI, marginLeft: 14 }}>{`· ${time}`}</span> : null}</div>
          <div style={{ display: 'flex', fontSize: 28, fontWeight: 400, color: SILVER, marginTop: 8 }}>{where}{c?.instructor ? ` · with ${c.instructor}` : ''}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 30 }}>{book && pill(book, true)}<div style={{ display: 'flex', fontSize: 24, color: SILVER, letterSpacing: 1 }}>{host}</div></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 12, display: 'flex', background: `linear-gradient(90deg, ${PINK} 0%, ${PINK_HI} 50%, ${PINK} 100%)` }} />
    </div>
  );
}
