// Minimal, NON-DESTRUCTIVE seed for the production database.
// Creates departments, categories, one admin, four officers and one demo citizen.
// It never deletes anything and never changes an existing account.
// Run: npm run seed:prod   (reads DATABASE_URL and the SEED_* passwords from .env.local)
import { PrismaClient } from '@prisma/client';
import { ensureAccount, officerAccounts, seedReferenceData } from './seed-shared';

const prisma = new PrismaClient();

function requiredPassword(name: string): string {
  const value = process.env[name];
  if (!value || value.length < 10) {
    throw new Error(`${name} must be set to a password of at least 10 characters.`);
  }
  return value;
}

async function main() {
  const adminPassword = requiredPassword('SEED_ADMIN_PASSWORD');
  const officerPassword = requiredPassword('SEED_OFFICER_PASSWORD');
  const citizenPassword = requiredPassword('SEED_CITIZEN_PASSWORD');

  const departmentIds = await seedReferenceData(prisma);
  await ensureAccount(prisma, { name: 'Portal Administrator', email: 'admin@jansetu.example', password: adminPassword, role: 'ADMIN' });
  for (const officer of officerAccounts(departmentIds, officerPassword)) await ensureAccount(prisma, officer);
  await ensureAccount(prisma, { name: 'Asha Demo', email: 'citizen@jansetu.example', password: citizenPassword, role: 'CITIZEN' });

  console.log('Production seed complete: departments, categories, 1 admin, 4 officers, 1 demo citizen.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
