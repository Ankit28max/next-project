import { describe, expect, it } from 'vitest';
import { chooseDepartment, chooseOfficer } from '@/lib/ai/routing';
import { REFERENCE_PATTERN, generateReferenceNumber } from '@/lib/complaints/reference';

const pwd = { id: 'dept-pwd', name: 'Public Works' };
const water = { id: 'dept-water', name: 'Water Supply' };
const rules = [{ keywords: 'school, hospital', departmentId: 'dept-special', departmentName: 'Special Cell' }];

describe('chooseDepartment', () => {
  it('lets an admin rule win over the category default', () => {
    const choice = chooseDepartment({ text: 'Pothole outside the school gate', rules, categoryDepartment: pwd, suggestedDepartment: pwd });
    expect(choice.departmentId).toBe('dept-special');
    expect(choice.reason).toContain('school');
  });

  it('matches rule keywords as whole words only', () => {
    const choice = chooseDepartment({ text: 'Our preschooler fell in a pothole', rules, categoryDepartment: pwd, suggestedDepartment: null });
    expect(choice.departmentId).toBe('dept-pwd');
  });

  it('falls back to the category default, then to the suggestion', () => {
    expect(chooseDepartment({ text: 'pothole', rules: [], categoryDepartment: pwd, suggestedDepartment: water }).departmentId).toBe('dept-pwd');
    expect(chooseDepartment({ text: 'pothole', rules: [], categoryDepartment: null, suggestedDepartment: water }).departmentId).toBe('dept-water');
  });

  it('returns no department when nothing applies (the complaint then needs manual triage)', () => {
    expect(chooseDepartment({ text: 'hello', rules: [], categoryDepartment: null, suggestedDepartment: null }).departmentId).toBeNull();
  });
});

describe('chooseOfficer', () => {
  it('picks the officer with the fewest open cases', () => {
    const chosen = chooseOfficer([
      { id: 'a', employeeId: 'PWD-001', openCases: 4 },
      { id: 'b', employeeId: 'PWD-002', openCases: 1 },
      { id: 'c', employeeId: 'PWD-003', openCases: 3 },
    ]);
    expect(chosen?.id).toBe('b');
  });

  it('breaks ties by employee id so the result is predictable', () => {
    const chosen = chooseOfficer([
      { id: 'x', employeeId: 'PWD-009', openCases: 2 },
      { id: 'y', employeeId: 'PWD-002', openCases: 2 },
    ]);
    expect(chosen?.id).toBe('y');
  });

  it('returns null when the department has no active officer', () => {
    expect(chooseOfficer([])).toBeNull();
  });
});

describe('reference numbers', () => {
  it('match the documented format', () => {
    expect(generateReferenceNumber(new Date('2026-11-15'))).toMatch(/^JS-2026-[2-9A-HJKMNP-Z]{6}$/);
    expect(REFERENCE_PATTERN.test(generateReferenceNumber())).toBe(true);
  });

  it('are random: a sample of 2,000 has no repeats', () => {
    // 2,000 draws from about 887 million values. Real collisions are handled by the
    // database unique index plus a retry (see submit.ts).
    const seen = new Set(Array.from({ length: 2000 }, () => generateReferenceNumber()));
    expect(seen.size).toBeGreaterThanOrEqual(1999);
  });
});
