import crypto from 'crypto';
// Signed playback for Mux videos: a member only gets a short-lived token after the server checks their membership.
export const muxOn = () => !!(process.env.MUX_SIGNING_KEY_ID && process.env.MUX_SIGNING_PRIVATE_KEY);
const b64u = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
export function muxToken(playbackId, ttlSec = 6 * 3600) {
  let pem = process.env.MUX_SIGNING_PRIVATE_KEY.trim(); if (!pem.includes('BEGIN')) pem = Buffer.from(pem, 'base64').toString('utf8'); // Mux gives the key base64-encoded
  const head = { alg: 'RS256', typ: 'JWT', kid: process.env.MUX_SIGNING_KEY_ID };
  const body = `${b64u(head)}.${b64u({ sub: playbackId, aud: 'v', exp: Math.floor(Date.now() / 1000) + ttlSec, kid: process.env.MUX_SIGNING_KEY_ID })}`;
  return `${body}.${crypto.createSign('RSA-SHA256').update(body).sign(pem).toString('base64url')}`;
}
