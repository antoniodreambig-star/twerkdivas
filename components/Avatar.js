'use client';
import { useState } from 'react';
// Round instructor photo. Falls back to initials when there is no photo or the link is broken.
export default function Avatar({ src, name = '', size = 72, style }) {
  const [bad, setBad] = useState(false);
  const ini = String(name).trim().split(/\s+/).slice(0, 2).map((w) => w[0] || '').join('').toUpperCase() || '?';
  const box = { width: size, height: size, borderRadius: '50%', flex: 'none', boxSizing: 'border-box', ...style };
  if (src && !bad) return <img src={src} alt={name ? `${name}` : ''} referrerPolicy="no-referrer" onError={() => setBad(true)} style={{ ...box, objectFit: 'cover', border: '3px solid var(--hot, #FF1A7E)' }} />;
  return <div aria-hidden="true" style={{ ...box, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#FF1A7E,#1A0A12)', color: '#fff', fontWeight: 800, fontSize: Math.round(size * 0.36), letterSpacing: '.02em' }}>{ini}</div>;
}
// Crop to a centered square and shrink, so uploads stay small (about 30-60 KB).
export function shrinkPhoto(file, px = 480) {
  return new Promise((resolve, reject) => {
    if (!file || !/^image\//.test(file.type)) return reject(new Error('Pick an image file'));
    const url = URL.createObjectURL(file); const img = new Image();
    img.onload = () => { const s = Math.min(img.width, img.height); const c = document.createElement('canvas'); c.width = c.height = Math.min(px, s); c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, c.width, c.height); URL.revokeObjectURL(url); resolve(c.toDataURL('image/jpeg', 0.85)); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That image could not be read. Try a JPG or PNG.')); };
    img.src = url;
  });
}
