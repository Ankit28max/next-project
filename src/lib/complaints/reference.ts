import { randomInt } from 'node:crypto';

// No 0/O or 1/I/L, so a reference read over the phone is not misheard.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const LENGTH = 6;

/**
 * Example: JS-2026-7KQ4MZ. 31^6 is about 887 million combinations per year, drawn from a
 * cryptographic random source. Uniqueness is still enforced by the database: on a
 * collision the insert fails and the caller retries with a new number.
 */
export function generateReferenceNumber(now = new Date()): string {
  let code = '';
  for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `JS-${now.getFullYear()}-${code}`;
}

export const REFERENCE_PATTERN = /^JS-\d{4}-[2-9A-HJKMNP-Z]{6}$/;
