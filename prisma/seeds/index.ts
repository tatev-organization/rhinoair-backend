import {
  AlertType,
  ChangeOrderStatus,
  DocumentStatus,
  DocumentType,
  InvoiceStatus,
  PhaseStatus,
  PrismaClient,
  ProjectStatus,
  TaskStatus,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Rhino Air portal database...');

  const partnerEmail = process.env.SEED_PARTNER_EMAIL || 'partner@example.com';
  const seedPassword = process.env.SEED_PASSWORD || 'password123';
  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const company = await prisma.company.upsert({
    where: {
      companyId:
        process.env.SEED_COMPANY_ID || '00000000-0000-4000-8000-000000000001',
    },
    update: {},
    create: {
      companyId:
        process.env.SEED_COMPANY_ID || '00000000-0000-4000-8000-000000000001',
      name: 'Mid Construction Group',
      tier: 4,
      email: partnerEmail,
      password: hashedPassword,
      phone: '(310) 555-0148',
      address: '9100 Wilshire Blvd, Beverly Hills, CA 90212',
      contactName: 'David Mirzakhanian',
      partnerSince: new Date('2024-01-01'),
      approvedJobsYtd: 8,
      annualGoal: 12,
      repName: 'Sam Yaghobi',
      repRole: 'Project Manager',
      repPhone: '(818) 900-4007',
      repEmail: 'sam.yaghobi@rhinoair.com',
    },
  });

  const project = await prisma.project.create({
    data: {
      companyId: company.companyId,
      name: '1036 Norman Pl',
      address: '1036 Norman Pl, Los Angeles, CA',
      status: ProjectStatus.ACTIVE,
      systemSummary: 'Daikin VRV · 5-Ton',
      currentPhase: 'Rough-in',
      phaseClass: 'roughin',
      currentPhaseIndex: 1,
      docsCount: 9,
      contractTotal: 23650,
      paidAmount: 10600,
      startDate: new Date('2026-06-10'),
      roughInspectionAt: new Date('2026-06-23'),
    },
  });

  await prisma.projectPhase.create({
    data: {
      projectId: project.projectId,
      name: 'Planning',
      status: PhaseStatus.DONE,
      sortOrder: 1,
      startDate: new Date('2026-06-02'),
      endDate: new Date('2026-06-09'),
      tasks: {
        create: [
          {
            name: 'Design & measuring',
            status: TaskStatus.COMPLETE,
            sortOrder: 1,
          },
          {
            name: 'Equipment / materials preparing',
            status: TaskStatus.COMPLETE,
            sortOrder: 2,
          },
        ],
      },
    },
  });

  await prisma.projectPhase.create({
    data: {
      projectId: project.projectId,
      name: 'Rough-in',
      status: PhaseStatus.CURRENT,
      sortOrder: 2,
      startDate: new Date('2026-06-10'),
      endDate: new Date('2026-06-23'),
      tasks: {
        create: [
          {
            name: 'Indoor units installation',
            status: TaskStatus.COMPLETE,
            sortOrder: 1,
          },
          {
            name: 'Ductwork rough-in (trunk & branch runs)',
            status: TaskStatus.IN_PROGRESS,
            sortOrder: 2,
          },
          {
            name: 'Line sets, drains & low voltage',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 3,
          },
          { name: 'Exhausts', status: TaskStatus.NOT_STARTED, sortOrder: 4 },
          {
            name: 'Ready for rough inspection',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 5,
            isInspection: true,
          },
        ],
      },
    },
  });

  await prisma.projectPhase.create({
    data: {
      projectId: project.projectId,
      name: 'Finishing',
      status: PhaseStatus.UPCOMING,
      sortOrder: 3,
      startDate: new Date('2026-06-24'),
      endDate: new Date('2026-07-08'),
      note: 'Begins when called back',
      tasks: {
        create: [
          {
            name: 'Outdoor units installation',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 1,
          },
          {
            name: 'Registers, grilles & thermostats',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 2,
          },
          {
            name: 'Electrical after disconnect box',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 3,
          },
          {
            name: 'Startup, refrigerant balancing & test',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 4,
          },
        ],
      },
    },
  });

  await prisma.projectPhase.create({
    data: {
      projectId: project.projectId,
      name: 'Final Inspection',
      status: PhaseStatus.UPCOMING,
      sortOrder: 4,
      startDate: new Date('2026-07-09'),
      endDate: new Date('2026-07-11'),
      note: 'After finishing',
      tasks: {
        create: [
          {
            name: 'Ready for final inspection',
            status: TaskStatus.NOT_STARTED,
            sortOrder: 1,
            isInspection: true,
          },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      companyId: company.companyId,
      projectId: project.projectId,
      invoiceNumber: 'INV-2068',
      description: 'Rough-in progress (30%)',
      status: InvoiceStatus.DUE,
      amount: 7950,
      drawPercent: 30,
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
    },
  });

  await prisma.invoice.create({
    data: {
      companyId: company.companyId,
      projectId: project.projectId,
      invoiceNumber: 'SCHED-1036-FINAL',
      description: 'Completion (30%)',
      status: InvoiceStatus.SCHEDULED,
      amount: 7950,
      drawPercent: 30,
      scheduledOn: 'on completion',
    },
  });

  await prisma.document.createMany({
    data: [
      {
        companyId: company.companyId,
        projectId: project.projectId,
        type: DocumentType.BLUEPRINT,
        category: 'Plans & Blueprints',
        icon: 'plan',
        name: 'Mechanical plan set (T24, ductwork, schedules)',
        fileUrl: 'https://example.com/mechanical-plan.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 2400000,
      },
      {
        companyId: company.companyId,
        projectId: project.projectId,
        type: DocumentType.AGREEMENT,
        status: DocumentStatus.SIGNED,
        category: 'Agreements',
        icon: 'sign',
        badge: 'signed',
        name: 'Subcontract agreement',
        fileUrl: 'https://example.com/subcontract-agreement.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 320000,
      },
      {
        companyId: company.companyId,
        projectId: project.projectId,
        type: DocumentType.CERTIFICATE,
        status: DocumentStatus.PENDING,
        category: 'Certificates',
        icon: 'cert',
        name: 'HERS certificate (duct leakage & charge)',
        availableAt: new Date('2026-07-11'),
      },
    ],
  });

  await prisma.changeOrder.createMany({
    data: [
      {
        companyId: company.companyId,
        projectId: project.projectId,
        number: 'CO-01',
        title: 'Added third zone',
        scope: 'Added third zone — master suite',
        amount: 3200,
        status: ChangeOrderStatus.APPROVED,
        decidedAt: new Date('2026-06-14'),
      },
      {
        companyId: company.companyId,
        projectId: project.projectId,
        number: 'CO-02',
        title: 'Concealed ducted head',
        scope: 'Upgrade to concealed ducted head — home office',
        amount: 1800,
        status: ChangeOrderStatus.PENDING,
      },
    ],
  });

  await prisma.alert.createMany({
    data: [
      {
        companyId: company.companyId,
        type: AlertType.INVOICE_DUE,
        projectId: project.projectId,
        title: 'Invoice due soon',
        message: '1036 Norman Pl · $7,950',
        href: `/projects/${project.projectId}#invoices`,
      },
      {
        companyId: company.companyId,
        type: AlertType.CHANGE_ORDER_PENDING,
        projectId: project.projectId,
        title: 'Change order pending',
        message: 'CO-02 — Concealed ducted head',
        href: `/projects/${project.projectId}#invoices`,
      },
    ],
  });

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
