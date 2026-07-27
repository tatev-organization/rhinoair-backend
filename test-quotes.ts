import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const quotes = await prisma.quote.findMany({
    where: { quoteNumber: { contains: 'RA-892303' } },
  });
  console.log("Quotes with RA-892303:", JSON.stringify(quotes, null, 2));
}
main().finally(() => prisma.$disconnect());
