'use client';
import { useEffect, useRef, useState } from 'react';
// Camera check-in: reads QR codes from the ticket page. Uses the browser's BarcodeDetector when present, jsQR otherwise.
export default function Scanner({ onCode, onClose }) {
  const vid = useRef(null); const [err, setErr] = useState(''); const last = useRef({ v: '', t: 0 });
  useEffect(() => {
    let stop = false, stream, timer; const canvas = document.createElement('canvas');
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot open the camera. Type the code instead.');
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); if (stop) return stream.getTracks().forEach((t) => t.stop());
        const v = vid.current; v.srcObject = stream; await v.play(); const det = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null; const jsQR = det ? null : (await import('jsqr')).default;
        const tick = async () => {
          if (stop) return; try {
            if (v.videoWidth) { let val = ''; if (det) { const r = await det.detect(v); val = r[0]?.rawValue || ''; } else { canvas.width = v.videoWidth; canvas.height = v.videoHeight; const c = canvas.getContext('2d', { willReadFrequently: true }); c.drawImage(v, 0, 0); const im = c.getImageData(0, 0, canvas.width, canvas.height); val = jsQR(im.data, im.width, im.height)?.data || ''; }
              const code = String(val).toUpperCase().replace(/[^A-Z0-9]/g, ''); if (code && (code !== last.current.v || Date.now() - last.current.t > 4000)) { last.current = { v: code, t: Date.now() }; onCode(code); } }
          } catch {} timer = setTimeout(tick, 250);
        }; tick();
      } catch (e) { setErr(e.name === 'NotAllowedError' ? 'Camera permission was blocked. Allow it in your browser settings, or type the code.' : e.message); }
    })();
    return () => { stop = true; clearTimeout(timer); stream?.getTracks().forEach((t) => t.stop()); };
  }, []); // eslint-disable-line
  return (<div className="card" style={{ margin: '10px 0' }}>{err ? <div className="err">{err}</div> : <video ref={vid} playsInline muted style={{ width: '100%', maxHeight: 300, borderRadius: 12, background: '#000', objectFit: 'cover' }} />}<div className="row" style={{ justifyContent: 'space-between', marginTop: 6 }}><span className="small mute">Point the camera at the ticket QR code.</span><button className="btn sm" onClick={onClose}>Close camera</button></div></div>);
}
