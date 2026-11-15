// Reference data needed by BOTH seeds: departments, categories and account creation.
// Everything here is an upsert, so running it twice changes nothing and deletes nothing.
import type { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { CATEGORIES, OTHER_CATEGORY } from '../src/lib/ai/categories';

export const DEPARTMENTS = [
  { code: 'PWD', name: 'Public Works Department', description: 'Roads, footpaths and public structures.' },
  { code: 'WATER', name: 'Water Supply and Sewerage', description: 'Drinking water supply, drains and sewers.' },
  { code: 'ELEC', name: 'Electricity and Street Lighting', description: 'Streetlights, poles, wires and transformers.' },
  { code: 'SANITATION', name: 'Sanitation Department', description: 'Garbage collection and cleanliness of public areas.' },
];

export async function seedReferenceData(prisma: PrismaClient) {
  const departmentIds: Record<string, string> = {};
  for (const d of DEPARTMENTS) {
    const row = await prisma.department.upsert({ where: { code: d.code }, update: {}, create: d });
    departmentIds[d.code] = row.id;
  }
  for (const c of [...CATEGORIES, OTHER_CATEGORY]) {
    const data = {
      name: c.name,
      description: c.description,
      defaultPriority: c.defaultSeverity,
      defaultDepartmentId: departmentIds[c.departmentCode],
    };
    await prisma.complaintCategory.upsert({ where: { code: c.code }, update: data, create: { code: c.code, ...data } });
  }
  return departmentIds;
}

interface Account {
  name: string;
  email: string;
  password: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  officer?: { departmentId: string; employeeId: string; designation: string };
}

/** Creates the account if the email is new. An existing account (and its password) is left untouched. */
export async function ensureAccount(prisma: PrismaClient, account: Account) {
  const existing = await prisma.user.findUnique({ where: { email: account.email } });
  if (existing) return existing;
  return prisma.user.create({
    data: {
      name: account.name,
      email: account.email,
      role: account.role,
      passwordHash: await bcrypt.hash(account.password, 12),
      officerProfile: account.officer ? { create: account.officer } : undefined,
    },
  });
}

export function officerAccounts(departmentIds: Record<string, string>, password: string): Account[] {
  return [
    { name: 'Rajesh Kumar', email: 'officer.pwd@jansetu.example', code: 'PWD', employeeId: 'PWD-001', designation: 'Junior Engineer' },
    { name: 'Sunita Verma', email: 'officer.water@jansetu.example', code: 'WATER', employeeId: 'WAT-001', designation: 'Assistant Engineer' },
    { name: 'Imran Khan', email: 'officer.elec@jansetu.example', code: 'ELEC', employeeId: 'ELE-001', designation: 'Lineman Supervisor' },
    { name: 'Harpreet Kaur', email: 'officer.sanitation@jansetu.example', code: 'SANITATION', employeeId: 'SAN-001', designation: 'Sanitary Inspector' },
  ].map((o) => ({
    name: o.name,
    email: o.email,
    password,
    role: 'OFFICER' as const,
    officer: { departmentId: departmentIds[o.code], employeeId: o.employeeId, designation: o.designation },
  }));
}
