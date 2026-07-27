import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Find all quotes that have an stProjectId but might be linked to a project that doesn't match that stProjectId
  const quotes = await prisma.quote.findMany({
    where: {
      stProjectId: { not: null }
    },
    include: { project: true }
  });

  let fixed = 0;
  for (const quote of quotes) {
    if (!quote.project) continue;
    
    // Check if the project's ST ID matches the quote's ST ID
    if (quote.project.serviceTitanProjectId !== quote.stProjectId!.toString()) {
      console.log(`Quote ${quote.quoteNumber} (stProjectId: ${quote.stProjectId}) is linked to Project ${quote.project.name} (stProjectId: ${quote.project.serviceTitanProjectId}). FIXING...`);
      
      // Find the real project
      const realProject = await prisma.project.findFirst({
        where: { serviceTitanProjectId: quote.stProjectId!.toString() }
      });
      
      if (realProject) {
        await prisma.quote.update({
          where: { quoteId: quote.quoteId },
          data: { projectId: realProject.projectId }
        });
        console.log(`-> Re-linked to correct project: ${realProject.name}`);
        fixed++;
      } else {
        console.log(`-> Real project not found in local DB yet. Unlinking from wrong project.`);
        await prisma.quote.update({
          where: { quoteId: quote.quoteId },
          data: { projectId: null }
        });
        fixed++;
      }
    }
  }
  console.log(`Fixed ${fixed} incorrectly linked quotes.`);
}

main().finally(() => prisma.$disconnect());
