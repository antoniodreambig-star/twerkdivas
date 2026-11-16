'use client';
import { useEffect } from 'react';
export default function EmbedResize() { useEffect(() => { document.body.style.background = 'transparent'; const send = () => parent.postMessage({ twerkdivasHeight: document.documentElement.scrollHeight }, '*'); send(); const o = new ResizeObserver(send); o.observe(document.body); return () => o.disconnect(); }, []); return null; }
