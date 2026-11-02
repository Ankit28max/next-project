import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Smart Grievance Redressal Database ---');

  // Clear existing records to ensure clean seed state
  await prisma.auditLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.complaintMatch.deleteMany({});
  await prisma.complaintAnalysis.deleteMany({});
  await prisma.complaintStatusHistory.deleteMany({});
  await prisma.complaintImage.deleteMany({});
  await prisma.complaint.deleteMany({});
  await prisma.routingRule.deleteMany({});
  await prisma.complaintCategory.deleteMany({});
  await prisma.officerProfile.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});

  const defaultPasswordHash = await bcrypt.hash('Citizen@123', 10);
  const officerPasswordHash = await bcrypt.hash('Officer@123', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@123', 10);

  // 1. Seed Departments
  console.log('Creating Departments...');
  const deptPWD = await prisma.department.create({
    data: {
      code: 'PWD',
      name: 'Public Works Department',
      description: 'Responsible for roads, highways, footpaths, bridges, and civic infrastructure.',
      jurisdiction: 'Metro Municipal Zone A, B & C',
    },
  });

  const deptWater = await prisma.department.create({
    data: {
      code: 'WATER',
      name: 'Water Supply & Sewerage Board',
      description: 'Management of potable drinking water distribution, sewage networks, and stormwater drains.',
      jurisdiction: 'Metropolitan Water Command',
    },
  });

  const deptElec = await prisma.department.create({
    data: {
      code: 'ELEC',
      name: 'Electricity & Street Lighting Authority',
      description: 'Public streetlights, transformer maintenance, low-hanging cables, and electric safety.',
      jurisdiction: 'City Power Distribution Circle',
    },
  });

  const deptHealth = await prisma.department.create({
    data: {
      code: 'HEALTH',
      name: 'Municipal Health & Sanitation Department',
      description: 'Solid waste management, garbage collection, public hygiene, and vector control.',
      jurisdiction: 'Sanitation Zones 1 - 8',
    },
  });

  // 2. Seed Users
  console.log('Creating Users...');
  // Administrator
  const adminUser = await prisma.user.create({
    data: {
      name: 'Dr. Ramesh Sharma (Chief Administrator)',
      email: 'admin@grievance.gov.in',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      phone: '+91 98765 43210',
    },
  });

  // Officers
  const officerUserPWD = await prisma.user.create({
    data: {
      name: 'Er. Rajesh Kumar',
      email: 'officer.pwd@grievance.gov.in',
      passwordHash: officerPasswordHash,
      role: 'OFFICER',
      phone: '+91 98111 22334',
    },
  });

  const officerProfilePWD = await prisma.officerProfile.create({
    data: {
      userId: officerUserPWD.id,
      departmentId: deptPWD.id,
      employeeId: 'EMP-PWD-101',
      badgeNumber: 'PWD-EXEC-04',
      designation: 'Senior Executive Engineer (Roads)',
    },
  });

  const officerUserWater = await prisma.user.create({
    data: {
      name: 'Smt. Sunita Verma',
      email: 'officer.water@grievance.gov.in',
      passwordHash: officerPasswordHash,
      role: 'OFFICER',
      phone: '+91 98222 33445',
    },
  });

  const officerProfileWater = await prisma.officerProfile.create({
    data: {
      userId: officerUserWater.id,
      departmentId: deptWater.id,
      employeeId: 'EMP-WTR-202',
      badgeNumber: 'WTR-INSP-12',
      designation: 'Divisional Water Inspector',
    },
  });

  const officerUserElec = await prisma.user.create({
    data: {
      name: 'Shri Vikram Singh',
      email: 'officer.elec@grievance.gov.in',
      passwordHash: officerPasswordHash,
      role: 'OFFICER',
      phone: '+91 98333 44556',
    },
  });

  const officerProfileElec = await prisma.officerProfile.create({
    data: {
      userId: officerUserElec.id,
      departmentId: deptElec.id,
      employeeId: 'EMP-ELC-303',
      badgeNumber: 'ELC-ENG-08',
      designation: 'Assistant Lighting Engineer',
    },
  });

  // Citizens
  const citizenAmit = await prisma.user.create({
    data: {
      name: 'Amit Patel',
      email: 'citizen@grievance.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'CITIZEN',
      phone: '+91 99000 11223',
    },
  });

  const citizenPriya = await prisma.user.create({
    data: {
      name: 'Priya Sharma',
      email: 'citizen.priya@grievance.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'CITIZEN',
      phone: '+91 99000 22334',
    },
  });

  const citizenRahul = await prisma.user.create({
    data: {
      name: 'Rahul Verma',
      email: 'citizen.rahul@grievance.gov.in',
      passwordHash: defaultPasswordHash,
      role: 'CITIZEN',
      phone: '+91 99000 33445',
    },
  });

  // 3. Seed Complaint Categories
  console.log('Creating Complaint Categories...');
  const catRoads = await prisma.complaintCategory.create({
    data: {
      code: 'ROADS',
      name: 'Roads & Potholes',
      description: 'Potholes, damaged asphalt, cave-ins, and uneven road surfaces.',
      defaultDepartmentId: deptPWD.id,
      defaultPriority: 'HIGH',
    },
  });

  const catWater = await prisma.complaintCategory.create({
    data: {
      code: 'WATER_SUPPLY',
      name: 'Water Supply & Leakage',
      description: 'Pipeline bursts, contaminated water, low pressure, and valve leaks.',
      defaultDepartmentId: deptWater.id,
      defaultPriority: 'HIGH',
    },
  });

  const catSanitation = await prisma.complaintCategory.create({
    data: {
      code: 'SANITATION',
      name: 'Sanitation & Garbage',
      description: 'Uncollected garbage, overflowing public dumpsters, and road litter.',
      defaultDepartmentId: deptHealth.id,
      defaultPriority: 'MEDIUM',
    },
  });

  const catLighting = await prisma.complaintCategory.create({
    data: {
      code: 'LIGHTING',
      name: 'Streetlights & Electricity',
      description: 'Non-functioning streetlights, exposed live wires, and sparking fixtures.',
      defaultDepartmentId: deptElec.id,
      defaultPriority: 'MEDIUM',
    },
  });

  const catDrainage = await prisma.complaintCategory.create({
    data: {
      code: 'DRAINAGE',
      name: 'Drainage & Sewage',
      description: 'Blocked stormwater drains, open sewer manholes, and monsoon waterlogging.',
      defaultDepartmentId: deptWater.id,
      defaultPriority: 'HIGH',
    },
  });

  const catPublicDamage = await prisma.complaintCategory.create({
    data: {
      code: 'PUBLIC_DAMAGE',
      name: 'Public Property Damage',
      description: 'Vandalized public benches, broken railings, damaged bus shelters.',
      defaultDepartmentId: deptPWD.id,
      defaultPriority: 'LOW',
    },
  });

  // 4. Seed Routing Rules
  console.log('Creating Automated Routing Rules...');
  await prisma.routingRule.createMany({
    data: [
      {
        keywords: 'pothole, asphalt, road, crater, pavement',
        departmentId: deptPWD.id,
        priority: 'HIGH',
        categoryId: catRoads.id,
      },
      {
        keywords: 'water leak, pipe burst, water pressure, contaminated water',
        departmentId: deptWater.id,
        priority: 'HIGH',
        categoryId: catWater.id,
      },
      {
        keywords: 'garbage, waste, trash, dump, cleanliness, dustbin',
        departmentId: deptHealth.id,
        priority: 'MEDIUM',
        categoryId: catSanitation.id,
      },
      {
        keywords: 'streetlight, dark road, sparking wire, power cut, pole',
        departmentId: deptElec.id,
        priority: 'MEDIUM',
        categoryId: catLighting.id,
      },
      {
        keywords: 'overflowing drain, sewage, manhole, clogged gutter, waterlogging',
        departmentId: deptWater.id,
        priority: 'HIGH',
        categoryId: catDrainage.id,
      },
    ],
  });

  // 5. Seed Realistic Complaints
  console.log('Seeding Realistic Complaints...');

  // Complaint 1: Resolved Pothole Grievance
  const complaint1 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10021',
      citizenId: citizenAmit.id,
      title: 'Deep hazardous pothole near MG Road Metro Station Gate 3',
      description:
        'A large 2-foot deep pothole has opened up right outside Gate 3 of MG Road Metro Station. Two two-wheelers have already slipped during the evening rush hour. Urgent asphalt patch repair required.',
      categoryId: catRoads.id,
      departmentId: deptPWD.id,
      assignedOfficerId: officerProfilePWD.id,
      status: 'RESOLVED',
      priority: 'HIGH',
      address: 'MG Road Metro Station, Gate 3, Sector 14, New Delhi',
      latitude: 28.4815,
      longitude: 77.0872,
      urgencyDeclared: true,
      consentGiven: true,
      aiCategory: 'Roads & Potholes',
      aiConfidence: 0.95,
      aiExplanation: 'Linguistic markers "pothole", "asphalt patch", "two-wheelers slipped" indicate critical road damage.',
      duplicateScore: 0.12,
      fraudRiskScore: 14,
      fraudRiskLevel: 'LOW',
      resolutionSummary:
        'PWD quick response team filled the crater with hot-mix bituminous macadam and leveled the surface. Road section opened for regular traffic with inspection completed.',
      resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800',
            fileName: 'mg_road_pothole.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1420000,
            imageHash: 'hash-pothole-mgroad-01',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenAmit.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'SUBMITTED',
            remarks: 'Complaint submitted by citizen via web portal.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          },
          {
            actorId: null,
            previousStatus: 'SUBMITTED',
            newStatus: 'ASSIGNED',
            remarks: 'AI Classified as Roads & Potholes. Auto-routed to Public Works Department and assigned to Er. Rajesh Kumar.',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 1000 * 60 * 5),
          },
          {
            actorId: officerUserPWD.id,
            previousStatus: 'ASSIGNED',
            newStatus: 'IN_PROGRESS',
            remarks: 'Inspected by junior engineer. Work order issued to hot-mix patching crew.',
            createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          },
          {
            actorId: officerUserPWD.id,
            previousStatus: 'IN_PROGRESS',
            newStatus: 'RESOLVED',
            remarks: 'Bituminous hot-mix patching completed. Verified on site.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Complaint 2: Water Pipeline Burst (Primary Original)
  const complaint2 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10045',
      citizenId: citizenAmit.id,
      title: 'Major main water pipe burst causing road flooding in Sector 4 Market',
      description:
        'High-pressure water distribution pipe has burst near the central fountain of Sector 4 Market. Clean drinking water is gushing out on the street for 3 hours, flooding storefronts.',
      categoryId: catWater.id,
      departmentId: deptWater.id,
      assignedOfficerId: officerProfileWater.id,
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      address: 'Central Market Fountain, Sector 4, Rohini, Delhi',
      latitude: 28.7041,
      longitude: 77.1025,
      urgencyDeclared: true,
      consentGiven: true,
      aiCategory: 'Water Supply & Leakage',
      aiConfidence: 0.96,
      aiExplanation: 'High urgency water supply issue. Keywords: "pipe burst", "drinking water gushing", "flooding".',
      duplicateScore: 0.05,
      fraudRiskScore: 12,
      fraudRiskLevel: 'LOW',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
            fileName: 'pipe_burst_sector4.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1850000,
            imageHash: 'hash-water-leak-sector4',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenAmit.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'SUBMITTED',
            remarks: 'Submitted by citizen.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
          {
            actorId: officerUserWater.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'IN_PROGRESS',
            remarks: 'Emergency pipeline team dispatched to isolate feeder valve.',
            createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Complaint 3: Water Pipeline Burst (Duplicate Submission by Priya Sharma)
  const complaint3 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10048',
      citizenId: citizenPriya.id,
      title: 'Huge water leak and pipe burst in Sector 4 commercial market',
      description:
        'Underground municipal pipe ruptured near the central square fountain in Sector 4 Market. Water is overflowing into shops. Please fix urgently.',
      categoryId: catWater.id,
      departmentId: deptWater.id,
      assignedOfficerId: officerProfileWater.id,
      status: 'UNDER_REVIEW',
      priority: 'URGENT',
      address: 'Shop 42 near Fountain, Sector 4 Market, Rohini, Delhi',
      latitude: 28.7043,
      longitude: 77.1028, // ~30 meters away from complaint 2!
      urgencyDeclared: true,
      consentGiven: true,
      aiCategory: 'Water Supply & Leakage',
      aiConfidence: 0.94,
      aiExplanation: 'Linguistic markers "water leak", "pipe ruptured", "overflowing" match Sector 4 incident.',
      duplicateScore: 0.88, // Flagged as Duplicate!
      fraudRiskScore: 18,
      fraudRiskLevel: 'LOW',
      createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800',
            fileName: 'priya_market_leak.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1850000,
            imageHash: 'hash-water-leak-sector4', // Reused identical scene
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenPriya.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'UNDER_REVIEW',
            remarks: 'Complaint logged. Potential duplicate flag raised with GRV-2026-10045 (Score: 88%).',
            createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Link Complaint 3 to Complaint 2 in ComplaintMatch table
  await prisma.complaintMatch.create({
    data: {
      complaintId: complaint3.id,
      matchedComplaintId: complaint2.id,
      textSimilarity: 0.76,
      imageSimilarity: 0.95,
      geographicDistance: 0.04, // 40 meters
      combinedScore: 0.88,
      matchReason: 'Close proximity (0.04 km away); High text similarity (76%); Identical civic category; Matching photo evidence signature',
    },
  });

  // Complaint 4: Suspicious / Fake Grievance with High Fraud Risk
  const complaint4 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10099',
      citizenId: citizenRahul.id,
      title: 'road broken asdfghjk test',
      description: 'asdfghjk road test broken nothing works 12345 pls fix',
      categoryId: catRoads.id,
      departmentId: deptPWD.id,
      assignedOfficerId: officerProfilePWD.id,
      status: 'UNDER_REVIEW',
      priority: 'LOW',
      address: 'Fake Address 999, Unknown Colony',
      latitude: 28.5355,
      longitude: 77.3910,
      urgencyDeclared: false,
      consentGiven: true,
      aiCategory: 'Roads & Potholes',
      aiConfidence: 0.65,
      aiExplanation: 'Low confidence classification. Text contains keyboard-smash artifacts.',
      duplicateScore: 0.08,
      fraudRiskScore: 78, // HIGH FRAUD RISK!
      fraudRiskLevel: 'HIGH',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?w=800',
            fileName: 'stock_generic_photo.jpg',
            mimeType: 'image/jpeg',
            fileSize: 520000,
            imageHash: 'hash-stock-generic-image',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenRahul.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'UNDER_REVIEW',
            remarks: 'Submitted by citizen. Automated Fraud Risk Alert: Score 78/100 (HIGH). Flagged for officer scrutiny.',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Complaint 5: Non-functional Streetlights
  const complaint5 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10062',
      citizenId: citizenAmit.id,
      title: 'Eight consecutive streetlights dark on Outer Ring Road Flyover',
      description:
        'The streetlights along the 500-meter stretch of Outer Ring Road flyover going towards Munirka are completely dark for the last 4 days. Creates severe collision risk for motorists at night.',
      categoryId: catLighting.id,
      departmentId: deptElec.id,
      assignedOfficerId: officerProfileElec.id,
      status: 'ASSIGNED',
      priority: 'HIGH',
      address: 'Outer Ring Road Flyover, Munirka, South Delhi',
      latitude: 28.5583,
      longitude: 77.1685,
      urgencyDeclared: true,
      consentGiven: true,
      aiCategory: 'Streetlights & Electricity',
      aiConfidence: 0.93,
      aiExplanation: 'Matched lighting failure markers ("streetlights dark", "Outer Ring Road flyover", "night collision risk").',
      duplicateScore: 0.04,
      fraudRiskScore: 15,
      fraudRiskLevel: 'LOW',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=800',
            fileName: 'dark_streetlight_stretch.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1100000,
            imageHash: 'hash-streetlight-munirka',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenAmit.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'ASSIGNED',
            remarks: 'Auto-routed to Electricity Authority. Assigned to Shri Vikram Singh.',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // Complaint 6: Overflowing Garbage Dump
  const complaint6 = await prisma.complaint.create({
    data: {
      referenceNumber: 'GRV-2026-10077',
      citizenId: citizenPriya.id,
      title: 'Massive garbage pileup and overflowing bins near Government Primary School',
      description:
        'The community waste bins behind the Government Primary School have not been cleared for 6 days. Stray animals are scattering waste onto the school approach road, creating severe foul smell and health hazard for children.',
      categoryId: catSanitation.id,
      departmentId: deptHealth.id,
      assignedOfficerId: null, // Unassigned, waiting department head review
      status: 'UNDER_REVIEW',
      priority: 'MEDIUM',
      address: 'Behind Govt Primary School, Pocket B, Mayur Vihar Phase 1, Delhi',
      latitude: 28.6087,
      longitude: 77.2965,
      urgencyDeclared: false,
      consentGiven: true,
      aiCategory: 'Sanitation & Garbage',
      aiConfidence: 0.91,
      aiExplanation: 'Sanitation keywords identified ("garbage pileup", "overflowing bins", "waste", "health hazard").',
      duplicateScore: 0.06,
      fraudRiskScore: 16,
      fraudRiskLevel: 'LOW',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      images: {
        create: [
          {
            storageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800',
            fileName: 'garbage_pileup.jpg',
            mimeType: 'image/jpeg',
            fileSize: 1350000,
            imageHash: 'hash-garbage-school',
          },
        ],
      },
      statusHistory: {
        create: [
          {
            actorId: citizenPriya.id,
            previousStatus: 'SUBMITTED',
            newStatus: 'UNDER_REVIEW',
            remarks: 'Submitted by citizen. Queued for Sanitation Department Head triage.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  // 6. Seed In-App Notifications
  console.log('Seeding Sample Notifications...');
  await prisma.notification.createMany({
    data: [
      {
        userId: citizenAmit.id,
        complaintId: complaint1.id,
        title: 'Grievance Resolved: GRV-2026-10021',
        message: 'Your complaint regarding road pothole at MG Road Metro Station has been marked RESOLVED by PWD.',
        type: 'RESOLUTION',
        readAt: new Date(),
      },
      {
        userId: citizenAmit.id,
        complaintId: complaint2.id,
        title: 'Status Update: GRV-2026-10045 In Progress',
        message: 'Water Supply Department emergency crew has reached Sector 4 Market and is isolating the pipeline.',
        type: 'STATUS_CHANGE',
      },
      {
        userId: officerUserPWD.id,
        complaintId: complaint4.id,
        title: 'High Fraud Risk Alert: GRV-2026-10099',
        message: 'A submitted complaint scored 78/100 on fraud risk indicators. Manual field verification advised.',
        type: 'ALERT',
      },
      {
        userId: officerUserWater.id,
        complaintId: complaint3.id,
        title: 'Potential Duplicate Flag: GRV-2026-10048',
        message: 'High 88% duplicate likelihood with active case GRV-2026-10045 (Sector 4 Water Leak).',
        type: 'ALERT',
      },
    ],
  });

  // 7. Seed System Audit Logs
  console.log('Seeding Initial Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        action: 'SYSTEM_INITIALIZATION',
        entityType: 'System',
        entityId: 'SYS-INIT',
        metadata: { version: '1.0.0', initializedBy: 'Dr. Ramesh Sharma' },
      },
      {
        actorId: citizenAmit.id,
        action: 'COMPLAINT_SUBMITTED',
        entityType: 'Complaint',
        entityId: complaint1.id,
        metadata: { referenceNumber: 'GRV-2026-10021', category: 'Roads & Potholes' },
      },
      {
        actorId: officerUserPWD.id,
        action: 'STATUS_UPDATED',
        entityType: 'Complaint',
        entityId: complaint1.id,
        metadata: { previousStatus: 'IN_PROGRESS', newStatus: 'RESOLVED' },
      },
    ],
  });

  console.log('--- Database Seed Successfully Completed! ---');
  console.log('Demo Credentials Created:');
  console.log('  Admin:    admin@grievance.gov.in / Admin@123');
  console.log('  Officers: officer.pwd@grievance.gov.in / Officer@123');
  console.log('            officer.water@grievance.gov.in / Officer@123');
  console.log('            officer.elec@grievance.gov.in / Officer@123');
  console.log('  Citizens: citizen@grievance.gov.in / Citizen@123');
  console.log('            citizen.priya@grievance.gov.in / Citizen@123');
  console.log('            citizen.rahul@grievance.gov.in / Citizen@123');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
