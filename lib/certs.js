import crypto from 'crypto';
const secret = () => process.env.SESSION_SECRET || 'dev-secret';
// A short public verification code derived from the submission id. Anyone can check it; nobody can guess one.
export const certCode = (subId) => 'TD-' + crypto.createHmac('sha256', secret()).update(`cert:${subId}`).digest('hex').slice(0, 10).toUpperCase();
