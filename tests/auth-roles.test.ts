import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

describe('Authentication & Role Authorization Security', () => {
  const SECRET = 'test-secret-key-12345-min-32-chars-long';

  it('hashes and securely verifies passwords', async () => {
    const rawPassword = 'SecurePassword@123';
    const hash = await bcrypt.hash(rawPassword, 10);

    expect(hash).not.toBe(rawPassword);
    const valid = await bcrypt.compare(rawPassword, hash);
    expect(valid).toBe(true);

    const invalid = await bcrypt.compare('WrongPassword', hash);
    expect(invalid).toBe(false);
  });

  it('signs and verifies JWT session tokens with role claims', () => {
    const payload = {
      userId: 'user_123',
      email: 'citizen@grievance.gov.in',
      role: 'CITIZEN' as const,
      name: 'Amit Patel',
    };

    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' });
    expect(token).toBeDefined();

    const decoded = jwt.verify(token, SECRET) as typeof payload;
    expect(decoded.userId).toBe('user_123');
    expect(decoded.role).toBe('CITIZEN');
  });

  it('rejects tampered or forged JWT tokens', () => {
    const validToken = jwt.sign({ userId: 'admin_1', role: 'ADMIN' }, SECRET);
    const forgedToken = validToken + 'invalid';

    expect(() => {
      jwt.verify(forgedToken, SECRET);
    }).toThrow();
  });
});
