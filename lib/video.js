// Turns a pasted link into something that plays inside the app. Only https links are accepted.
export function cleanUrl(u) { try { const x = new URL(String(u).trim()); return x.protocol === 'https:' ? x.toString() : ''; } catch { return ''; } }
// A video reference is an https link, or mux:PLAYBACK_ID for protected Mux hosting.
export const MUX_RE = /^mux:[A-Za-z0-9]{8,80}$/;
export function cleanVideoRef(v) { const x = String(v ?? '').trim(); return MUX_RE.test(x) ? x : cleanUrl(x); }
export function embedFor(url) {
  if (MUX_RE.test(String(url || '').trim())) return { kind: 'mux', playbackId: String(url).trim().slice(4) };
  const u = cleanUrl(url); if (!u) return null; const x = new URL(u); const h = x.hostname.replace(/^www\./, '');
  if (h === 'youtu.be') return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${x.pathname.slice(1)}` };
  if (h.endsWith('youtube.com')) { const id = x.searchParams.get('v') || x.pathname.split('/').filter(Boolean).pop(); return id ? { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${id}` } : null; }
  if (h === 'vimeo.com') { const [id, hash] = x.pathname.split('/').filter(Boolean); return /^\d+$/.test(id || '') ? { kind: 'iframe', src: `https://player.vimeo.com/video/${id}${hash ? `?h=${hash}` : ''}` } : null; }
  if (h === 'player.vimeo.com' || h === 'www.loom.com' || h === 'loom.com') return { kind: 'iframe', src: h.includes('loom') ? u.replace('/share/', '/embed/') : u };
  if (/\.(mp4|webm|mov|m3u8)(\?|$)/i.test(x.pathname + x.search)) return { kind: 'video', src: u };
  return { kind: 'link', src: u };
}
