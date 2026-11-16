export const AGREEMENT_VERSION = 1;
export const DEFAULT_SETTINGS = {
  price: '', welcome: 'Learn every routine, get certified, and teach TwerkDivas classes with confidence.',
  agreement: 'By joining, you agree that all TwerkDivas routines, choreography, videos and materials are owned by TwerkDivas and are licensed to you only for personal learning and for teaching while your membership is active and you are certified. You will not copy, record, share, sell or post the routines or videos outside TwerkDivas-approved classes. You are responsible for your own insurance and for keeping your students safe. Your access ends if your membership ends or you break these terms.',
  feePct: 0, contactEmail: '', cancelHours: 48, terms: '', privacy: '', refundPolicy: '', waiver: '', packs: [],
  prereqs: 'CPR/AED certification (link to a photo or PDF of your card)',
};
export const DEFAULT_PROGRAMS = [
  { id: 'prog-twerk', title: 'Twerk Cardio', blurb: 'The signature TwerkDivas high-energy cardio class.', order: 1 },
  { id: 'prog-barre', title: 'Barre', blurb: 'Low-impact, sculpting barre with a TwerkDivas twist.', order: 2 },
  { id: 'prog-pilates', title: 'Mat Pilates', blurb: 'Core-focused mat Pilates and fusion work.', order: 3 },
];
export const str = (v, n = 500) => String(v ?? '').trim().slice(0, n);
export const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 120;
