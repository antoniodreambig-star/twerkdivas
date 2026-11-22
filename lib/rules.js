export const AGREEMENT_VERSION = 1;
export const DEFAULT_SETTINGS = {
  price: '', welcome: 'Learn every routine, get certified, and teach Cakes and Core classes with confidence.',
  agreement: 'By joining, you agree that all Cakes and Core routines, choreography, videos and materials are owned by Cakes and Core and are licensed to you only for personal learning and for teaching while your membership is active and you are certified. You will not copy, record, share, sell or post the routines or videos outside TwerkDivas-approved classes. You are responsible for your own insurance and for keeping your students safe. Your access ends if your membership ends or you break these terms.',
  feePct: 0, contactEmail: '', cancelHours: 48, terms: '', privacy: '', refundPolicy: '', waiver: '', packs: [],
  prereqs: 'CPR/AED certification (link to a photo or PDF of your card)',
};
export const DEFAULT_PROGRAMS = [
  { id: 'prog-twerk', title: 'Twerk Cardio', blurb: 'The signature Cakes and Core high-energy cardio class.', order: 1 },
  { id: 'prog-barre', title: 'Barre', blurb: 'Low-impact, sculpting barre with a Cakes and Core twist.', order: 2 },
  { id: 'prog-pilates', title: 'Mat Pilates', blurb: 'Core-focused mat Pilates and fusion work.', order: 3 },
];
// Fallback descriptions, used only when a program's own description is blank.
const BLURBS = {
  'barre and bootylicious': 'Barre-inspired moves meet twerk technique to sculpt your legs, glutes, and core. Small, controlled movements plus rhythm-driven booty work make it low-impact, high-burn, and good for every level.',
  'cakes and core': 'Build strength from the center out. Targeted core and glute work combines with twerk moves to tone, tighten, and keep you grooving through every count.',
  'sculpt and shake': 'Strength meets rhythm. Sculpting exercises blend into high-energy shake and groove sequences that torch calories and feel like a party.',
  'peachy pilates': 'Mat Pilates with a glute focus. Build core strength, better posture, and a lifted, toned lower body with slow, controlled movement.',
};
const blurbKey = (t) => String(t || '').toLowerCase().replace(/&amp;|&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim();
export const withBlurbs = (list) => list.map((p) => (String(p.blurb || '').trim() ? p : { ...p, blurb: BLURBS[blurbKey(p.title)] || p.blurb }));
export const str = (v, n = 500) => String(v ?? '').trim().slice(0, n);
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;
