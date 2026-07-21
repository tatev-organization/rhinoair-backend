const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const company = await prisma.company.findFirst();
  console.log('Company:', company);
  
  const activeProjects = await prisma.project.findMany({ select: { status: true, projectId: true } });
  console.log('Projects:', activeProjects);
  
  const quotes = await prisma.quote.findMany({ select: { status: true, quoteId: true } });
  console.log('Quotes:', quotes);
  
  const invoices = await prisma.invoice.findMany({ select: { status: true, invoiceId: true } });
  console.log('Invoices:', invoices);

  const docs = await prisma.document.findMany({ select: { status: true, documentId: true } });
  console.log('Docs:', docs);
}
main().catch(console.error).finally(() => prisma.$disconnect());
