'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Horizontal scroller with prev/next arrows and a visible scrollbar on desktop.
// Arrows only appear when the row actually overflows and there is more to scroll.
export default function ScrollRow({ children, className = 'chips', label, ...rest }) {
  const ref = useRef(null);
  const [can, setCan] = useState({ l: false, r: false });
  const update = useCallback(() => {
    const el = ref.current; if (!el) return;
    setCan({ l: el.scrollLeft > 2, r: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 });
  }, []);
  useEffect(() => {
    update();
    const el = ref.current; if (!el) return;
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(update) : null;
    ro && ro.observe(el);
    window.addEventListener('resize', update);
    return () => { ro && ro.disconnect(); window.removeEventListener('resize', update); };
  }, [update, children]);
  const go = (dir) => { const el = ref.current; if (el) el.scrollBy({ left: dir * Math.max(200, el.clientWidth * 0.8), behavior: 'smooth' }); };
  return (
    <div className="srow">
      {can.l && <button type="button" className="srow-btn l" aria-label={`Scroll ${label || ''} left`.replace('  ', ' ')} onClick={() => go(-1)}>‹</button>}
      <div ref={ref} className={`${className} srow-track`} onScroll={update} {...rest}>{children}</div>
      {can.r && <button type="button" className="srow-btn r" aria-label={`Scroll ${label || ''} right`.replace('  ', ' ')} onClick={() => go(1)}>›</button>}
    </div>
  );
}
