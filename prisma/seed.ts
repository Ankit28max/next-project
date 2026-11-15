// DEMO seed for LOCAL DEVELOPMENT ONLY. It DELETES ALL DATA and then creates demo
// accounts and sample complaints by running the real submit pipeline.
// Run: npm run seed:demo
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { EVAL_CASES } from '../eval/dataset';
import { submitComplaint } from '../src/lib/complaints/submit';
import { processUpload } from '../src/lib/images/process';
import { putImage } from '../src/lib/storage';
import { ensureAccount, officerAccounts, seedReferenceData } from './seed-shared';

const prisma = new PrismaClient();

// Local demo passwords. They exist only in a throwaway local database.
export const DEMO_PASSWORD = { citizen: 'Citizen#2026demo', officer: 'Officer#2026demo', admin: 'Admin#2026demo' };

/** Two independent guards: this script must never touch a production database. */
function assertSafeToWipe() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the demo seed with NODE_ENV=production.');
  }
  const host = new URL(process.env.DATABASE_URL ?? 'postgresql://unset').hostname;
  if (host !== 'localhost' && host !== '127.0.0.1') {
    throw new Error(`Refusing to wipe a non-local database (${host}). Use "npm run seed:prod" for production.`);
  }
}

async function main() {
  assertSafeToWipe();

  // Delete children before parents (foreign keys).
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.complaintMatch.deleteMany();
  await prisma.complaintAnalysis.deleteMany();
  await prisma.complaintStatusHistory.deleteMany();
  await prisma.complaintImage.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.routingRule.deleteMany();
  await prisma.complaintCategory.deleteMany();
  await prisma.officerProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const departmentIds = await seedReferenceData(prisma);
  await ensureAccount(prisma, { name: 'Portal Administrator', email: 'admin@jansetu.example', password: DEMO_PASSWORD.admin, role: 'ADMIN' });
  for (const officer of officerAccounts(departmentIds, DEMO_PASSWORD.officer)) await ensureAccount(prisma, officer);
  await ensureAccount(prisma, {
    name: 'Manoj Singh', email: 'officer.pwd2@jansetu.example', password: DEMO_PASSWORD.officer, role: 'OFFICER',
    officer: { departmentId: departmentIds.PWD, employeeId: 'PWD-002', designation: 'Junior Engineer' },
  });

  const citizenNames: Record<string, string> = { c1: 'Asha Demo', c2: 'Vikram Mehta', c3: 'Gurpreet Singh', c4: 'Neha Sharma', c5: 'Rohit Gill' };
  const citizens: Record<string, { id: string; name: string; email: string }> = {};
  for (const [key, name] of Object.entries(citizenNames)) {
    const email = key === 'c1' ? 'citizen@jansetu.example' : `citizen.${key}@jansetu.example`;
    citizens[key] = await ensureAccount(prisma, { name, email, password: DEMO_PASSWORD.citizen, role: 'CITIZEN' });
  }

  await prisma.routingRule.create({
    data: { keywords: 'school, hospital', departmentId: departmentIds.PWD, position: 200, active: false },
  });

  // Submit a selection of the evaluation cases through the real pipeline, in time order.
  const picked = ['e01', 'e02', 'e03', 'e08', 'e10', 'e12', 'e14', 'e17', 'e18', 'e22', 'e23', 'e27', 'e29', 'e30', 'e31'];
  for (const c of EVAL_CASES.filter((e) => picked.includes(e.id)).sort((a, b) => a.minute - b.minute)) {
    const citizen = citizens[c.citizen];
    const { jpeg, ...facts } = await processUpload(await readFile(path.join(process.cwd(), 'eval', 'images', c.image)));
    const image = await prisma.complaintImage.create({
      data: { uploaderId: citizen.id, storageUrl: await putImage(jpeg), mimeType: 'image/jpeg', fileSize: jpeg.length, ...facts },
    });
    const result = await submitComplaint(
      { id: citizen.id, name: citizen.name, email: citizen.email, role: 'CITIZEN', officer: null },
      { title: c.title, description: c.description, address: 'Demo address, Phagwara, Punjab', latitude: c.latitude, longitude: c.longitude, consentGiven: true, imageId: image.id }
    );
    console.log(`${c.id} -> ${result.referenceNumber} (${result.categoryName ?? 'manual triage'}, ${result.similarComplaints} similar)`);
  }

  console.log('\nDemo seed complete. Sign in with:');
  console.log(`  citizen@jansetu.example      ${DEMO_PASSWORD.citizen}`);
  console.log(`  officer.pwd@jansetu.example  ${DEMO_PASSWORD.officer}`);
  console.log(`  admin@jansetu.example        ${DEMO_PASSWORD.admin}`);
}

main()
  .catch((error) => {
    console.error(error.message ?? error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
