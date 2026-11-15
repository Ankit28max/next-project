const MIN_SECRET_LENGTH = 32;

/** Returns the session signing key, or throws. There is deliberately no fallback value. */
export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET is missing or shorter than ${MIN_SECRET_LENGTH} characters. Generate one with: openssl rand -base64 48`
    );
  }
  return new TextEncoder().encode(secret);
}

/** Called once when the server starts (see src/instrumentation.ts). */
export function assertServerEnv(): void {
  getJwtSecret();
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
}
