import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;
export const MIN_PASSWORD_LENGTH = 10;

// A real bcrypt hash of a random string. Compared against when the email is unknown,
// so "no such user" takes about as long as "wrong password".
const DUMMY_HASH = '$2a$12$WjigQtlcg5bHT5h4IiSjAe575l8tT4cd1V5bx1.kqwDTRiQxWOpDa';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string | null | undefined): Promise<boolean> {
  const matches = await bcrypt.compare(password, hash ?? DUMMY_HASH);
  return Boolean(hash) && matches;
}
