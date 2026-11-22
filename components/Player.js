'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { embedFor } from '@/lib/video';
const MuxPlayer = dynamic(() => import('@mux/mux-player-react'), { ssr: false, loading: () => <div className="player" /> });
// Floating, faint name + email over the video. It will not stop a screen recording, but it makes leaks traceable and discourages sharing.
function Mark({ who }) {
  const [pos, setPos] = useState({ x: 12, y: 12 });
  useEffect(() => { const t = setInterval(() => setPos({ x: 4 + Math.random() * 55, y: 8 + Math.random() * 78 }), 12000); return () => clearInterval(t); }, []);
  if (!who) return null;
  return <div aria-hidden="true" style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transition: 'all 2s', color: '#fff', opacity: 0.28, fontSize: 13, fontWeight: 700, textShadow: '0 1px 3px #000', pointerEvents: 'none', zIndex: 3, userSelect: 'none', whiteSpace: 'nowrap' }}>{who}</div>;
}
export default function Player({ url, videoId, who }) {
  const e = embedFor(url); const [mux, setMux] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { if (e?.kind !== 'mux' || !videoId) return; let off = false; fetch(`/api/video/token?id=${encodeURIComponent(videoId)}`, { cache: 'no-store' }).then(async (r) => { const j = await r.json().catch(() => ({})); if (off) return; r.ok ? setMux(j) : setErr(j.error || 'Could not load this video'); }); return () => { off = true; }; }, [url, videoId]); // eslint-disable-line
  if (!e) return <div className="err">This video link is not valid.</div>;
  let inner;
  if (e.kind === 'iframe') inner = <iframe className="player" src={e.src} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />;
  else if (e.kind === 'video') inner = <video className="player" src={e.src} controls playsInline controlsList="nodownload" disablePictureInPicture />;
  else if (e.kind === 'mux') inner = err ? <div className="err">{err}</div> : mux ? <MuxPlayer playbackId={mux.playbackId} tokens={{ playback: mux.token }} streamType="on-demand" className="player" accentColor="#FF1A7E" /> : <div className="player" />;
  else return <a className="btn primary" href={e.src} target="_blank" rel="noopener noreferrer">Open video in a new tab</a>;
  return <div style={{ position: 'relative' }} onContextMenu={(ev) => ev.preventDefault()}>{inner}<Mark who={who} /></div>;
}
