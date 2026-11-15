import { beforeAll, describe, expect, it } from 'vitest';
import { HttpError, assertRole, canAccessComplaint, complaintScope, type SessionUser } from '@/lib/auth/guards';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { signSessionToken, verifySessionToken } from '@/lib/auth/token';
import { getJwtSecret } from '@/lib/env';
import { canCitizenReopen, canOfficerSetStatus } from '@/lib/complaints/workflow';
import { rateLimit } from '@/lib/rate-limit';

const citizen: SessionUser = { id: 'u-citizen', name: 'C', email: 'c@x.test', role: 'CITIZEN', officer: null };
const officer: SessionUser = { id: 'u-officer', name: 'O', email: 'o@x.test', role: 'OFFICER', officer: { id: 'p1', departmentId: 'dept-pwd', departmentName: 'PWD' } };
const officerNoProfile: SessionUser = { id: 'u-officer2', name: 'O2', email: 'o2@x.test', role: 'OFFICER', officer: null };
const admin: SessionUser = { id: 'u-admin', name: 'A', email: 'a@x.test', role: 'ADMIN', officer: null };

const ownComplaint = { citizenId: 'u-citizen', departmentId: 'dept-pwd' };
const otherDeptComplaint = { citizenId: 'u-someone', departmentId: 'dept-water' };
const unroutedComplaint = { citizenId: 'u-someone', departmentId: null };

describe('assertRole (deny by default)', () => {
  it('rejects a missing user with 401', () => {
    expect(() => assertRole(null, ['CITIZEN'])).toThrowError(HttpError);
    try {
      assertRole(null, ['CITIZEN']);
    } catch (error) {
      expect((error as HttpError).status).toBe(401);
    }
  });

  it('rejects the wrong role with 403 and an empty allow-list for everyone', () => {
    try {
      assertRole(citizen, ['ADMIN']);
      expect.unreachable();
    } catch (error) {
      expect((error as HttpError).status).toBe(403);
    }
    expect(() => assertRole(admin, [])).toThrowError(HttpError);
  });

  it('returns the user when the role is allowed', () => {
    expect(assertRole(officer, ['OFFICER', 'ADMIN'])).toBe(officer);
  });
});

describe('canAccessComplaint', () => {
  it('citizens: only their own', () => {
    expect(canAccessComplaint(citizen, ownComplaint)).toBe(true);
    expect(canAccessComplaint(citizen, otherDeptComplaint)).toBe(false);
  });

  it('officers: only their own department', () => {
    expect(canAccessComplaint(officer, ownComplaint)).toBe(true);
    expect(canAccessComplaint(officer, otherDeptComplaint)).toBe(false);
  });

  it('officers without an active profile see nothing', () => {
    expect(canAccessComplaint(officerNoProfile, ownComplaint)).toBe(false);
    expect(canAccessComplaint(officerNoProfile, unroutedComplaint)).toBe(false);
  });

  it('complaints with no department are admin-only', () => {
    expect(canAccessComplaint(officer, unroutedComplaint)).toBe(false);
    expect(canAccessComplaint(admin, unroutedComplaint)).toBe(true);
  });

  it('nobody signed in: denied', () => {
    expect(canAccessComplaint(null, ownComplaint)).toBe(false);
  });
});

describe('complaintScope (list filter)', () => {
  it('matches canAccessComplaint for each role', () => {
    expect(complaintScope(citizen)).toEqual({ citizenId: 'u-citizen' });
    expect(complaintScope(officer)).toEqual({ departmentId: 'dept-pwd' });
    expect(complaintScope(admin)).toEqual({});
    // A filter that can never match a real department id.
    expect(complaintScope(officerNoProfile).departmentId).toBe('__no_department__');
  });
});

describe('status transitions', () => {
  it('lets officers move open complaints forward', () => {
    expect(canOfficerSetStatus('ASSIGNED', 'IN_PROGRESS')).toBe(true);
    expect(canOfficerSetStatus('REOPENED', 'RESOLVED')).toBe(true);
  });

  it('does not let officers reopen, un-resolve or set system statuses', () => {
    expect(canOfficerSetStatus('RESOLVED', 'IN_PROGRESS')).toBe(false);
    expect(canOfficerSetStatus('REJECTED', 'UNDER_REVIEW')).toBe(false);
    expect(canOfficerSetStatus('ASSIGNED', 'REOPENED')).toBe(false);
    expect(canOfficerSetStatus('ASSIGNED', 'SUBMITTED')).toBe(false);
  });

  it('lets citizens reopen only closed complaints', () => {
    expect(canCitizenReopen('RESOLVED')).toBe(true);
    expect(canCitizenReopen('REJECTED')).toBe(true);
    expect(canCitizenReopen('IN_PROGRESS')).toBe(false);
  });
});

describe('session tokens', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'unit-test-secret-that-is-longer-than-32-characters';
  });

  it('round-trips a valid token', async () => {
    const token = await signSessionToken({ userId: 'u1', role: 'OFFICER' });
    expect(await verifySessionToken(token)).toEqual({ userId: 'u1', role: 'OFFICER' });
  });

  it('rejects tampered tokens, garbage and tokens signed with another key', async () => {
    const token = await signSessionToken({ userId: 'u1', role: 'CITIZEN' });
    const [header, payload, signature] = token.split('.');
    const forgedPayload = Buffer.from(JSON.stringify({ sub: 'u1', role: 'ADMIN' })).toString('base64url');
    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
    expect(await verifySessionToken('not-a-token')).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
    expect(payload).not.toBe(forgedPayload);

    process.env.JWT_SECRET = 'a-completely-different-secret-of-sufficient-length';
    expect(await verifySessionToken(token)).toBeNull();
    process.env.JWT_SECRET = 'unit-test-secret-that-is-longer-than-32-characters';
  });

  it('refuses to work with a missing or short secret (no fallback)', () => {
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = 'short';
    expect(() => getJwtSecret()).toThrow(/JWT_SECRET/);
    process.env.JWT_SECRET = saved;
  });
});

describe('passwords and rate limiting', () => {
  it('verifies the right password only, and never matches when the user is unknown', async () => {
    const hash = await hashPassword('Correct#Horse42');
    expect(await verifyPassword('Correct#Horse42', hash)).toBe(true);
    expect(await verifyPassword('wrong-password', hash)).toBe(false);
    expect(await verifyPassword('anything', null)).toBe(false);
  }, 20_000);

  it('blocks after the limit and recovers when the window ends', () => {
    const key = `test:${Math.random()}`;
    expect(rateLimit(key, 2, 1000, 0)).toBe(true);
    expect(rateLimit(key, 2, 1000, 10)).toBe(true);
    expect(rateLimit(key, 2, 1000, 20)).toBe(false);
    expect(rateLimit(key, 2, 1000, 1001)).toBe(true);
  });
});
