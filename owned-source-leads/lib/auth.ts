import crypto from 'crypto';

const COOKIE_NAME = 'osl_admin';

export function getAuthCookieName() {
  return COOKIE_NAME;
}

export function getExpectedPassword() {
  return process.env.ADMIN_PASSWORD || '';
}

export function isPasswordConfigured() {
  return Boolean(getExpectedPassword());
}

export function makeAuthToken(password: string) {
  const secret = process.env.AUTH_SECRET || 'dev-secret';
  return crypto.createHash('sha256').update(`${password}:${secret}`).digest('hex');
}

export function isValidAuthToken(token?: string | null) {
  if (!token) return false;
  const expected = getExpectedPassword();
  if (!expected) return false;
  return token === makeAuthToken(expected);
}
