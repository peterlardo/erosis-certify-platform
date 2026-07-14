import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from 'bcryptjs';

import dotenv from "dotenv";
dotenv.config();
const connectionString = process.env.DATABASE_URL || "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding EROSIS CERTIFY database...\n');

  // Clean existing data
  await prisma.certificateShare.deleteMany();
  await prisma.certificateDownload.deleteMany();
  await prisma.certificateEvent.deleteMany();
  await prisma.certificateApproval.deleteMany();
  await prisma.certificateVersion.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.securityMask.deleteMany();
  await prisma.templateVersion.deleteMany();
  await prisma.certificateTemplate.deleteMany();
  await prisma.signatory.deleteMany();
  await prisma.result.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.enrollment.deleteMany();
  await prisma.courseSession.deleteMany();
  await prisma.course.deleteMany();
  await prisma.courseCategory.deleteMany();
  await prisma.trainer.deleteMany();
  await prisma.learner.deleteMany();
  await prisma.userRole.deleteMany();
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.importJob.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.emailTemplate.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();
  await prisma.trainingCenter.deleteMany();

  console.log('  ✓ Old data cleaned\n');

  // 1. Training Center
  const center = await prisma.trainingCenter.create({
    data: {
      name: 'EROSIS CONSEIL',
      slug: 'erosis-conseil',
      slogan: 'L\'Excellence au service de la certification',
      primaryColor: '#1423A5',
      secondaryColor: '#B0008F',
      email: 'contact@erosis-conseil.cg',
      phone: '+242 06 777 77 77',
      address: 'Centre Ville, Avenue de l\'Indépendance',
      city: 'Brazzaville',
      country: 'Congo',
      website: 'https://www.erosis-conseil.cg',
      timezone: 'Africa/Brazzaville',
      currency: 'XAF',
      isActive: true,
    },
  });
  console.log(`  ✓ Training Center: ${center.name}`);

  // 2. Roles
  const rolesData = [
    { name: 'Super Admin', description: 'Accès complet à toutes les fonctionnalités', isSystem: true },
    { name: 'Admin Centre', description: 'Administration du centre de formation', isSystem: true },
    { name: 'Responsable Pédagogique', description: 'Gestion pédagogique des formations', isSystem: false },
    { name: 'Formateur', description: 'Formateur / Trainer', isSystem: false },
    { name: 'Apprenant', description: 'Apprenant / Élève', isSystem: false },
  ];

  const roles: any[] = [];
  for (const r of rolesData) {
    const role = await prisma.role.create({ data: r });
    roles.push(role);
    console.log(`  ✓ Role: ${role.name}`);
  }

  // 3. Permissions
  const modulePermissions: Record<string, string[]> = {
    dashboard: ['dashboard.view', 'dashboard.export'],
    users: ['users.list', 'users.create', 'users.edit', 'users.delete', 'users.suspend'],
    learners: ['learners.list', 'learners.create', 'learners.edit', 'learners.delete', 'learners.import', 'learners.export', 'learners.merge'],
    trainers: ['trainers.list', 'trainers.create', 'trainers.edit', 'trainers.delete'],
    courses: ['courses.list', 'courses.create', 'courses.edit', 'courses.delete', 'courses.publish'],
    sessions: ['sessions.list', 'sessions.create', 'sessions.edit', 'sessions.delete', 'sessions.enroll'],
    enrollments: ['enrollments.list', 'enrollments.create', 'enrollments.edit', 'enrollments.delete'],
    attendance: ['attendance.record', 'attendance.view', 'attendance.export'],
    assessments: ['assessments.create', 'assessments.grade', 'assessments.view'],
    results: ['results.view', 'results.validate', 'results.reject'],
    certificates: ['certificates.list', 'certificates.generate', 'certificates.download', 'certificates.revoke', 'certificates.replace', 'certificates.batch', 'certificates.verify'],
    templates: ['templates.list', 'templates.create', 'templates.edit', 'templates.delete', 'templates.duplicate'],
    masks: ['masks.list', 'masks.create', 'masks.edit', 'masks.delete'],
    roles: ['roles.list', 'roles.create', 'roles.edit', 'roles.delete'],
    permissions: ['permissions.list', 'permissions.assign'],
    settings: ['settings.view', 'settings.edit'],
    audit: ['audit.view', 'audit.export'],
    notifications: ['notifications.view', 'notifications.send'],
    imports: ['imports.create', 'imports.view'],
  };

  const allPermissions: any[] = [];
  for (const [module, perms] of Object.entries(modulePermissions)) {
    for (const permName of perms) {
      const perm = await prisma.permission.create({
        data: {
          name: permName,
          description: `Permission ${permName}`,
          module,
        },
      });
      allPermissions.push(perm);
    }
  }
  console.log(`  ✓ ${allPermissions.length} Permissions created`);

  // Assign permissions to Super Admin (all)
  for (const perm of allPermissions) {
    await prisma.rolePermission.create({
      data: { roleId: roles[0].id, permissionId: perm.id },
    });
  }

  // Assign module permissions to Admin Centre
  const adminModules = ['dashboard', 'users', 'learners', 'trainers', 'courses', 'sessions', 'enrollments', 'attendance', 'assessments', 'results', 'certificates', 'templates', 'masks', 'settings', 'notifications', 'imports'];
  const adminPerms = allPermissions.filter((p) => adminModules.includes(p.module));
  for (const perm of adminPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles[1].id, permissionId: perm.id },
    });
  }

  // Assign pedagogical permissions
  const pedaModules = ['dashboard', 'courses', 'sessions', 'enrollments', 'attendance', 'assessments', 'results', 'certificates', 'learners'];
  const pedaPerms = allPermissions.filter((p) => pedaModules.includes(p.module));
  for (const perm of pedaPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles[2].id, permissionId: perm.id },
    });
  }

  // Assign trainer permissions
  const trainerPerms = allPermissions.filter((p) =>
    ['dashboard', 'attendance', 'assessments', 'results'].includes(p.module) ||
    p.name === 'sessions.list' || p.name === 'enrollments.list' || p.name === 'learners.list'
  );
  for (const perm of trainerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles[3].id, permissionId: perm.id },
    });
  }

  // Assign learner permissions
  const learnerPermNames = ['dashboard.view', 'certificates.list', 'certificates.download', 'certificates.verify'];
  const learnerPerms = allPermissions.filter((p) => learnerPermNames.includes(p.name));
  for (const perm of learnerPerms) {
    await prisma.rolePermission.create({
      data: { roleId: roles[4].id, permissionId: perm.id },
    });
  }

  console.log('  ✓ Role-Permission assignments done');

  // 4. Users
  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@erosis-conseil.cg',
      passwordHash,
      firstName: 'Admin',
      lastName: 'EROSIS',
      civility: 'M.',
      phone: '+242 06 000 00 01',
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: adminUser.id, roleId: roles[0].id } });

  const centerAdmin = await prisma.user.create({
    data: {
      email: 'centre@erosis-conseil.cg',
      passwordHash: await bcrypt.hash('Admin123!', 12),
      firstName: 'Centre',
      lastName: 'Admin',
      civility: 'Mme',
      phone: '+242 06 000 00 02',
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: centerAdmin.id, roleId: roles[1].id } });

  console.log('  ✓ Users created');

  // 5. Categories
  const categories = await Promise.all([
    prisma.courseCategory.create({ data: { name: 'Sécurité de l\'Information', description: 'Formations en cybersécurité et SI', trainingCenterId: center.id } }),
    prisma.courseCategory.create({ data: { name: 'Management de la Qualité', description: 'Systèmes de management et normes ISO', trainingCenterId: center.id } }),
    prisma.courseCategory.create({ data: { name: 'Gestion de Projet', description: 'Méthodologies et outils de gestion de projet', trainingCenterId: center.id } }),
    prisma.courseCategory.create({ data: { name: 'Bureautique', description: 'Outils bureautiques avancés', trainingCenterId: center.id } }),
    prisma.courseCategory.create({ data: { name: 'Intelligence Artificielle', description: 'Formations en IA et data science', trainingCenterId: center.id } }),
  ]);
  console.log(`  ✓ ${categories.length} Categories created`);

  // 6. Courses (10)
  const coursesData = [
    { code: 'ISO27001-LI', title: 'ISO/IEC 27001 Lead Implementer', categoryId: categories[0].id, description: 'Implémentation d\'un SMSI selon ISO 27001', duration: 40, mode: 'PRESENTIAL', level: 'EXPERT', certificateType: 'COMPETENCE', passingThreshold: 70 },
    { code: 'ISO27001-LA', title: 'ISO/IEC 27001 Lead Auditor', categoryId: categories[0].id, description: 'Audit de systèmes de management de la sécurité de l\'information', duration: 40, mode: 'PRESENTIAL', level: 'EXPERT', certificateType: 'COMPETENCE', passingThreshold: 70 },
    { code: 'ISO27005-RM', title: 'ISO/IEC 27005 Risk Manager', categoryId: categories[0].id, description: 'Gestion des risques en sécurité de l\'information', duration: 24, mode: 'PRESENTIAL', level: 'ADVANCED', certificateType: 'COMPETENCE', passingThreshold: 65 },
    { code: 'ISO22301-F', title: 'ISO 22301 Foundation', categoryId: categories[1].id, description: 'Fondamentaux de la continuité d\'activité', duration: 16, mode: 'PRESENTIAL', level: 'BEGINNER', certificateType: 'ATTENDANCE', passingThreshold: 60 },
    { code: 'ISO31000-RM', title: 'ISO 31000 Risk Management', categoryId: categories[1].id, description: 'Management des risques selon ISO 31000', duration: 21, mode: 'HYBRID', level: 'INTERMEDIATE', certificateType: 'ATTENDANCE', passingThreshold: 65 },
    { code: 'CYBER-OP', title: 'Cybersécurité opérationnelle', categoryId: categories[0].id, description: 'Sécurité opérationnelle des systèmes d\'information', duration: 35, mode: 'PRESENTIAL', level: 'INTERMEDIATE', certificateType: 'COMPETENCE', passingThreshold: 70 },
    { code: 'GOUV-SI', title: 'Gouvernance des Systèmes d\'Information', categoryId: categories[1].id, description: 'Gouvernance et pilotage des SI', duration: 28, mode: 'PRESENTIAL', level: 'ADVANCED', certificateType: 'COMPETENCE', passingThreshold: 65 },
    { code: 'PMP', title: 'Gestion de projet PMP', categoryId: categories[2].id, description: 'Préparation à la certification PMP', duration: 35, mode: 'HYBRID', level: 'INTERMEDIATE', certificateType: 'ATTENDANCE', passingThreshold: 70 },
    { code: 'EXCEL-AV', title: 'Excel avancé', categoryId: categories[3].id, description: 'Fonctions avancées, macros et VBA', duration: 14, mode: 'PRESENTIAL', level: 'INTERMEDIATE', certificateType: 'ATTENDANCE', passingThreshold: 60 },
    { code: 'IA-APP', title: 'Intelligence Artificielle appliquée', categoryId: categories[4].id, description: 'IA et Machine Learning pour professionnels', duration: 30, mode: 'HYBRID', level: 'INTERMEDIATE', certificateType: 'COMPETENCE', passingThreshold: 65 },
  ];

  const courses: any[] = [];
  for (const c of coursesData) {
    const course = await prisma.course.create({
      data: {
        ...c,
        durationUnit: 'hours',
        language: 'fr',
        program: 'Programme détaillé disponible sur demande',
        objectives: 'Acquérir les compétences nécessaires',
        skills: 'Compétences pratiques et théoriques',
        prerequisites: 'Connaissances de base recommandées',
        status: 'ACTIVE',
        trainingCenterId: center.id,
        minAttendanceRate: 80,
      },
    });
    courses.push(course);
  }
  console.log(`  ✓ ${courses.length} Courses created`);

  // 7. Trainers (5)
  const trainersData = [
    { matricule: 'TR-001', civility: 'M.', firstName: 'Jean-Paul', lastName: 'NGOULOU', email: 'jp.ngoulou@erosis-conseil.cg', phone: '+242 06 100 00 01', bio: 'Expert en sécurité informatique', specialization: 'Cybersécurité, ISO 27001' },
    { matricule: 'TR-002', civility: 'Mme', firstName: 'Marie', lastName: 'KOUBA', email: 'm.kouba@erosis-conseil.cg', phone: '+242 06 100 00 02', bio: 'Experte en management de la qualité', specialization: 'ISO 9001, ISO 31000, ISO 22301' },
    { matricule: 'TR-003', civility: 'M.', firstName: 'Alain', lastName: 'MBOUSSI', email: 'a.mboussi@erosis-conseil.cg', phone: '+242 06 100 00 03', bio: 'Consultant en gouvernance des SI', specialization: 'Gouvernance IT, COBIT, ITIL' },
    { matricule: 'TR-004', civility: 'M.', firstName: 'Christophe', lastName: 'NDINGA', email: 'c.ndinga@erosis-conseil.cg', phone: '+242 06 100 00 04', bio: 'Chef de projet senior', specialization: 'PMP, Agile, Scrum' },
    { matricule: 'TR-005', civility: 'Mme', firstName: 'Sandra', lastName: 'MIALOUNDAMA', email: 's.mialoundama@erosis-conseil.cg', phone: '+242 06 100 00 05', bio: 'Data scientist', specialization: 'IA, Machine Learning, Data Science' },
  ];

  const trainers: any[] = [];
  for (const t of trainersData) {
    const trainer = await prisma.trainer.create({
      data: { ...t, isActive: true, trainingCenterId: center.id },
    });
    trainers.push(trainer);
  }
  console.log(`  ✓ ${trainers.length} Trainers created`);

  // 8. Learners (30)
  const firstNames = ['Pierre', 'Paul', 'Jacques', 'Sophie', 'Anne', 'Luc', 'David', 'Sarah', 'Michel', 'Julie',
    'Thomas', 'Emma', 'Nicolas', 'Léa', 'Antoine', 'Camille', 'François', 'Manon', 'Philippe', 'Claire',
    'Henri', 'Valérie', 'Guy', 'Isabelle', 'René', 'Catherine', 'Roger', 'Monique', 'Albert', 'Joséphine'];
  const lastNames = ['MABIALA', 'MOUSSOUNDA', 'NGOMA', 'BOUKAKA', 'TSHIMANGA', 'KABWE', 'LUBANDA', 'MUTOMBO',
    'ILUNGA', 'KALOMBO', 'MPOYI', 'TSHIBOMBO', 'MBUYI', 'KABASELE', 'MUKENDI', 'MAKASI', 'NDAYA', 'KASONGO',
    'MBOMBO', 'KABONGO', 'LUMUMBA', 'KIBENGE', 'NSUNGA', 'MVEMBA', 'KINSHASA', 'KALALA', 'BWALA', 'KIKWETA',
    'KAPELA', 'MBALA'];

  const countries = ['Congo', 'Congo', 'Congo', 'Congo', 'Congo', 'RDC', 'RDC', 'Gabon', 'Cameroun', 'Côte d\'Ivoire'];
  const cities = ['Brazzaville', 'Brazzaville', 'Pointe-Noire', 'Brazzaville', 'Kinshasa', 'Brazzaville', 'Libreville', 'Douala', 'Abidjan', 'Brazzaville'];

  const learners: any[] = [];
  for (let i = 0; i < 30; i++) {
    const learner = await prisma.learner.create({
      data: {
        matricule: `LRN-${String(i + 1).padStart(3, '0')}`,
        civility: i % 2 === 0 ? 'M.' : 'Mme',
        firstName: firstNames[i],
        lastName: lastNames[i],
        fullName: `${firstNames[i]} ${lastNames[i]}`,
        email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@email.com`,
        phone: `+242 06 ${String(200 + i).padStart(3, '0')} ${String(i + 10).padStart(2, '0')}`,
        country: countries[i % countries.length],
        city: cities[i % cities.length],
        organization: ['MTN Congo', 'Airtel Congo', 'SNPC', 'Bureau Veritas', 'SGS', 'TotalEnergies', 'Equatorial Congo', 'BGFI Bank', 'Ecobank', 'Congo Telecom'][i % 10],
        jobTitle: ['Ingénieur', 'Manager', 'Analyste', 'Consultant', 'Directeur', 'Technicien', 'Chef de projet', 'Auditeur', 'Comptable', 'Responsable SI'][i % 10],
        language: 'fr',
        consent: true,
        dataConsentAt: new Date(),
        status: 'ACTIVE',
        trainingCenterId: center.id,
      },
    });
    learners.push(learner);
  }
  console.log(`  ✓ ${learners.length} Learners created`);

  // 9. Sessions (8)
  const sessionsData = [
    { reference: 'SESS-27001-LI-2026-01', courseIndex: 0, trainerIndex: 0, startDate: new Date('2026-01-15'), endDate: new Date('2026-02-09'), maxCapacity: 20 },
    { reference: 'SESS-27001-LA-2026-01', courseIndex: 1, trainerIndex: 0, startDate: new Date('2026-02-10'), endDate: new Date('2026-03-07'), maxCapacity: 18 },
    { reference: 'SESS-27005-RM-2026-01', courseIndex: 2, trainerIndex: 0, startDate: new Date('2026-03-10'), endDate: new Date('2026-03-28'), maxCapacity: 25 },
    { reference: 'SESS-22301-F-2026-01', courseIndex: 3, trainerIndex: 1, startDate: new Date('2026-04-01'), endDate: new Date('2026-04-05'), maxCapacity: 30 },
    { reference: 'SESS-31000-RM-2026-01', courseIndex: 4, trainerIndex: 1, startDate: new Date('2026-04-20'), endDate: new Date('2026-05-16'), maxCapacity: 22 },
    { reference: 'SESS-PMP-2026-01', courseIndex: 7, trainerIndex: 3, startDate: new Date('2026-05-05'), endDate: new Date('2026-06-06'), maxCapacity: 20 },
    { reference: 'SESS-EXCEL-2026-01', courseIndex: 8, trainerIndex: 2, startDate: new Date('2026-06-01'), endDate: new Date('2026-06-14'), maxCapacity: 25 },
    { reference: 'SESS-IA-2026-01', courseIndex: 9, trainerIndex: 4, startDate: new Date('2026-06-15'), endDate: new Date('2026-07-12'), maxCapacity: 20 },
  ];

  const sessions: any[] = [];
  for (const s of sessionsData) {
    const session = await prisma.courseSession.create({
      data: {
        reference: s.reference,
        courseId: courses[s.courseIndex].id,
        startDate: s.startDate,
        endDate: s.endDate,
        trainerId: trainers[s.trainerIndex].id,
        maxCapacity: s.maxCapacity,
        enrolledCount: 0,
        timezone: 'Africa/Brazzaville',
        language: 'fr',
        status: 'PLANNED',
        location: 'Brazzaville, Congo',
        trainingCenterId: center.id,
        signatories: '[]',
      },
    });
    sessions.push(session);
  }
  console.log(`  ✓ ${sessions.length} Sessions created`);

  // 10. Enrollments
  let enrollmentCount = 0;
  for (let s = 0; s < sessions.length; s++) {
    const startIdx = (s * 3) % learners.length;
    const count = Math.min(5 + (s % 3), learners.length - startIdx);
    for (let i = 0; i < count; i++) {
      const learnerIdx = (startIdx + i) % learners.length;
      try {
        await prisma.enrollment.create({
          data: {
            learnerId: learners[learnerIdx].id,
            sessionId: sessions[s].id,
            status: 'CONFIRMED',
            enrolledAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            trainingCenterId: center.id,
          },
        });
        enrollmentCount++;
        await prisma.courseSession.update({
          where: { id: sessions[s].id },
          data: { enrolledCount: { increment: 1 } },
        });
      } catch { /* skip duplicates */ }
    }
  }
  console.log(`  ✓ ${enrollmentCount} Enrollments created`);

  // 11. Results & Assessments for some enrollments
  const allEnrollments = await prisma.enrollment.findMany({ include: { session: true } });
  let resultCount = 0;
  for (const enrollment of allEnrollments.slice(0, 15)) {
    const score = 50 + Math.floor(Math.random() * 50);
    const maxScore = 100;

    await prisma.assessment.create({
      data: {
        enrollmentId: enrollment.id,
        type: 'THEORETICAL',
        score,
        maxScore,
        coefficient: 1,
        weight: 1,
        gradedBy: adminUser.id,
        gradedAt: new Date(),
        trainingCenterId: center.id,
      },
    });

    const grade = score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : score >= 60 ? 'C+' : score >= 50 ? 'C' : 'F';
    const mention = score >= 90 ? 'EXCELLENT' : score >= 80 ? 'TRES_BIEN' : score >= 70 ? 'BIEN' : score >= 60 ? 'ASSEZ_BIEN' : score >= 50 ? 'PASSABLE' : null;

    await prisma.result.create({
      data: {
        enrollmentId: enrollment.id,
        averageScore: score,
        grade,
        mention,
        isAdmitted: score >= 50,
        status: 'VALIDATED',
        validatedBy: adminUser.id,
        validatedAt: new Date(),
        trainingCenterId: center.id,
      },
    });
    resultCount++;

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });
  }
  console.log(`  ✓ ${resultCount} Results & Assessments created`);

  // 12. Certificate Templates (12)
  const templatesData = [
    { name: 'Certificat Standard Paysage', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#FFFFFF', isDefault: true },
    { name: 'Certificat Standard Portrait', orientation: 'PORTRAIT', width: 850, height: 1200, backgroundColor: '#FFFFFF', isDefault: false },
    { name: 'Certificat Premium Or', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#FFF8E1', isDefault: false },
    { name: 'Certificat Premium Argent', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#F5F5F5', isDefault: false },
    { name: 'Certificat Sécurité Bleu', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#E3F2FD', isDefault: false },
    { name: 'Certificat Formation Continue', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#F3E5F5', isDefault: false },
    { name: 'Diplôme Standard', orientation: 'PORTRAIT', width: 850, height: 1200, backgroundColor: '#FFFFFF', isDefault: false },
    { name: 'Attestation Simplifiée', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#FAFAFA', isDefault: false },
    { name: 'Certificat Cybersécurité', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#E8EAF6', isDefault: false },
    { name: 'Certificat Management', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#FFF3E0', isDefault: false },
    { name: 'Certificat IQF', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#E0F7FA', isDefault: false },
    { name: 'Certificat Professionnel', orientation: 'LANDSCAPE', width: 1200, height: 850, backgroundColor: '#F1F8E9', isDefault: false },
  ];

  const templates: any[] = [];
  for (const t of templatesData) {
    const elements = [
      { type: 'rect', x: 0, y: 0, width: t.width, height: t.height, color: t.backgroundColor },
      { type: 'rect', x: 0, y: 0, width: t.width, height: 150, color: '#1423A5' },
      { type: 'text', x: t.width / 2, y: 30, content: 'EROSIS CONSEIL', fontSize: 32, color: '#FFFFFF', bold: true, align: 'center' },
      { type: 'text', x: t.width / 2, y: 80, content: 'CERTIFICAT DE FORMATION', fontSize: 24, color: '#FFFFFF', bold: true, align: 'center' },
      { type: 'text', x: t.width / 2, y: 250, content: 'Délivré à', fontSize: 14, color: '#666666', align: 'center' },
      { type: 'text', x: t.width / 2, y: 290, content: '[NOM DU PARTICIPANT]', fontSize: 36, color: '#1423A5', bold: true, align: 'center' },
      { type: 'text', x: t.width / 2, y: 370, content: 'Pour avoir suivi avec succès la formation', fontSize: 14, color: '#666666', align: 'center' },
      { type: 'text', x: t.width / 2, y: 410, content: '[TITRE DE LA FORMATION]', fontSize: 22, color: '#B0008F', bold: true, align: 'center' },
      { type: 'text', x: t.width / 2, y: 470, content: 'Durée: [DURÉE] | Note: [NOTE]', fontSize: 13, color: '#666666', align: 'center' },
      { type: 'text', x: t.width / 2, y: 510, content: 'Délivré le [DATE]', fontSize: 13, color: '#666666', align: 'center' },
      { type: 'qrcode', x: t.width / 2 - 60, y: 570, content: 'https://verify.erosis-conseil.cg/', size: 120 },
      { type: 'rect', x: 0, y: t.height - 60, width: t.width, height: 60, color: '#1423A5' },
      { type: 'text', x: t.width / 2, y: t.height - 40, content: 'www.erosis-conseil.cg | Brazzaville, Congo', fontSize: 11, color: '#FFFFFF', align: 'center' },
    ];

    const template = await prisma.certificateTemplate.create({
      data: {
        name: t.name,
        orientation: t.orientation,
        width: t.width,
        height: t.height,
        backgroundColor: t.backgroundColor,
        elements: JSON.stringify(elements),
        isDefault: t.isDefault,
        trainingCenterId: center.id,
        createdBy: adminUser.id,
      },
    });
    templates.push(template);
  }
  console.log(`  ✓ ${templates.length} Templates created`);

  // 13. Security Masks (12)
  const masksData = [
    { name: 'Guilloche EROSIS', type: 'GUILLOCHE', settings: { pattern: 'circular', frequency: 0.5, color: '#CCCCCC' } },
    { name: 'Filigrane EROSIS CONSEIL', type: 'WATERMARK', settings: { text: 'EROSIS CONSEIL', opacity: 0.08, rotation: -45 } },
    { name: 'Micro-texte Sécurité', type: 'MICROTEXT', settings: { text: 'EROSIS CERTIFY SECURE DOCUMENT', fontSize: 4, color: '#999999' } },
    { name: 'Rosace Centrale', type: 'ROSACE', settings: { rays: 12, radius: 30, color: '#1423A5', opacity: 0.05 } },
    { name: 'Fond Anti-copie', type: 'ANTI_COPY', settings: { message: 'COPY', pattern: 'repeating', color: '#FF000020' } },
    { name: 'Fond Sécurisé', type: 'SECURE_BACKGROUND', settings: { pattern: 'grid', color: '#E0E0E0', spacing: 10 } },
    { name: 'Zone Holographique', type: 'HOLOGRAPHIC', settings: { x: 100, y: 100, width: 80, height: 80, effect: 'rainbow' } },
    { name: 'Sceau Numérique', type: 'DIGITAL_SEAL', settings: { type: 'seal', color: '#1423A5', size: 60 } },
    { name: 'QR Code Vérification', type: 'QR_CODE', settings: { size: 100, position: 'bottom-right', margin: 20 } },
    { name: 'Empreinte Cryptographique', type: 'CRYPTOGRAPHIC_FINGERPRINT', settings: { algorithm: 'SHA-256', position: 'bottom', fontSize: 6 } },
    { name: 'ID Invisible', type: 'INVISIBLE_ID', settings: { encoding: 'base64', position: 'embedded', key: 'erosis-secure-key' } },
    { name: 'Bordure de Sécurité', type: 'SECURITY_BORDER', settings: { pattern: 'dashed', width: 2, color: '#1423A5', margin: 10, cornerDecorative: true } },
  ];

  for (const m of masksData) {
    await prisma.securityMask.create({
      data: {
        name: m.name,
        type: m.type,
        settings: JSON.stringify(m.settings),
        isActive: true,
        trainingCenterId: center.id,
      },
    });
  }
  console.log(`  ✓ ${masksData.length} Security Masks created`);

  // 14. Certificates (20)
  const certStatuses = ['ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED', 'ISSUED',
    'ISSUED', 'ISSUED', 'VALID', 'VALID', 'EXPIRED', 'REVOKED', 'DRAFT', 'PENDING_VALIDATION', 'APPROVED', 'ISSUED'];

  for (let i = 0; i < 20; i++) {
    const learner = learners[i % learners.length];
    const course = courses[i % courses.length];
    const template = templates[i % templates.length];
    const sessionIdx = i % sessions.length;
    const session = sessions[sessionIdx];

    const year = 2026;
    const seq = String(i + 1).padStart(4, '0');
    const shortCodeChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let shortCode = '';
    for (let c = 0; c < 8; c++) shortCode += shortCodeChars[Math.floor(Math.random() * shortCodeChars.length)];

    const fingerprintData = {
      internalId: `CERT-${year}-${seq}`,
      publicNumber: `EROSIS-${year}-${seq}`,
      shortCode,
      learnerId: learner.id,
      courseId: course.id,
      issuedAt: new Date().toISOString(),
    };
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(JSON.stringify(fingerprintData)).digest('hex');

    const cert = await prisma.certificate.create({
      data: {
        internalId: `CERT-${year}-${seq}`,
        publicNumber: `EROSIS-${year}-${seq}`,
        shortCode,
        learnerId: learner.id,
        courseId: course.id,
        sessionId: session.id,
        templateId: template.id,
        startDate: session.startDate,
        endDate: session.endDate,
        issuedAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        result: `${60 + Math.floor(Math.random() * 35)}%`,
        mention: ['PASSABLE', 'ASSEZ_BIEN', 'BIEN', 'TRES_BIEN', 'EXCELLENT'][Math.floor(Math.random() * 5)],
        verificationUrl: `https://verify.erosis-conseil.cg/${shortCode}`,
        cryptographicFingerprint: hash,
        status: certStatuses[i],
        trainingCenterId: center.id,
        createdBy: adminUser.id,
      },
    });

    await prisma.certificateEvent.create({
      data: {
        certificateId: cert.id,
        eventType: 'GENERATED',
        description: 'Certificate auto-generated during seeding',
        performedBy: adminUser.id,
      },
    });
  }
  console.log(`  ✓ 20 Certificates created`);

  // 15. Signatories
  const signatoriesData = [
    { name: 'Dr. Alphonse MABIALA', title: 'Directeur Général', organization: 'EROSIS CONSEIL' },
    { name: 'Mme Cécile BOUKAKA', title: 'Responsable Pédagogique', organization: 'EROSIS CONSEIL' },
    { name: 'M. Jean-Pierre NZINGA', title: 'Coordinateur Qualité', organization: 'EROSIS CONSEIL' },
  ];

  for (const s of signatoriesData) {
    await prisma.signatory.create({
      data: {
        ...s,
        isActive: true,
        validFrom: new Date('2026-01-01'),
        trainingCenterId: center.id,
      },
    });
  }
  console.log(`  ✓ ${signatoriesData.length} Signatories created`);

  // 16. System Settings
  const settings = [
    { key: 'app_name', value: JSON.stringify('EROSIS CERTIFY'), description: 'Nom de l\'application' },
    { key: 'app_version', value: JSON.stringify('1.0.0'), description: 'Version de l\'application' },
    { key: 'default_language', value: JSON.stringify('fr'), description: 'Langue par défaut' },
    { key: 'date_format', value: JSON.stringify('dd/MM/yyyy'), description: 'Format de date' },
    { key: 'certificate_validity_years', value: JSON.stringify(3), description: 'Validité par défaut des certificats (années)' },
    { key: 'verification_base_url', value: JSON.stringify('https://verify.erosis-conseil.cg'), description: 'URL de base pour la vérification' },
    { key: 'passing_threshold_default', value: JSON.stringify(70), description: 'Seuil de réussite par défaut' },
    { key: 'min_attendance_rate', value: JSON.stringify(80), description: 'Taux d\'assiduité minimum' },
    { key: 'logo_url', value: JSON.stringify(''), description: 'URL du logo' },
    { key: 'smtp_host', value: JSON.stringify(''), description: 'Hôte SMTP' },
    { key: 'smtp_port', value: JSON.stringify(587), description: 'Port SMTP' },
    { key: 'smtp_secure', value: JSON.stringify(false), description: 'SMTP sécurisé' },
  ];

  for (const s of settings) {
    await prisma.systemSetting.create({ data: s });
  }
  console.log(`  ✓ ${settings.length} System Settings created`);

  console.log(`\n========================================`);
  console.log(`  ✅ SEEDING COMPLETED SUCCESSFULLY`);
  console.log(`========================================`);
  console.log(`  Training Center: ${center.name}`);
  console.log(`  Users: 2 (admin@erosis-conseil.cg / Admin123!)`);
  console.log(`  Roles: ${roles.length}`);
  console.log(`  Permissions: ${allPermissions.length}`);
  console.log(`  Courses: ${courses.length}`);
  console.log(`  Trainers: ${trainers.length}`);
  console.log(`  Learners: ${learners.length}`);
  console.log(`  Sessions: ${sessions.length}`);
  console.log(`  Enrollments: ${enrollmentCount}`);
  console.log(`  Templates: ${templates.length}`);
  console.log(`  Certificates: 20`);
  console.log(`========================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
