// Authorization rules. Pure functions (no database, no cookies) so they are easy to test.
import type { Role } from './token';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** Present only for officers whose profile is active. */
  officer: { id: string; departmentId: string; departmentName: string } | null;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Deny by default: no user -> 401, role not in the list -> 403. */
export function assertRole(user: SessionUser | null, allowed: Role[]): SessionUser {
  if (!user) throw new HttpError(401, 'Please sign in.');
  if (!allowed.includes(user.role)) throw new HttpError(403, 'You do not have access to this.');
  return user;
}

interface ComplaintOwnership {
  citizenId: string;
  departmentId: string | null;
}

/**
 * Who may read or act on a complaint:
 * - admin: every complaint
 * - citizen: only their own
 * - officer: only complaints routed to their own department (an officer without an
 *   active profile, or a complaint with no department, is denied)
 */
export function canAccessComplaint(user: SessionUser | null, complaint: ComplaintOwnership): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (user.role === 'CITIZEN') return complaint.citizenId === user.id;
  if (user.role === 'OFFICER') {
    return user.officer !== null && complaint.departmentId === user.officer.departmentId;
  }
  return false;
}

/** The same rule expressed as a database filter, for list queries. */
export function complaintScope(user: SessionUser): { citizenId?: string; departmentId?: string } {
  if (user.role === 'ADMIN') return {};
  if (user.role === 'CITIZEN') return { citizenId: user.id };
  // An officer with no active profile matches nothing.
  return { departmentId: user.officer?.departmentId ?? '__no_department__' };
}
