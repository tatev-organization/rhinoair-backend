import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import { pricingConfig } from './pricingConfig';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding Pricing Config...');

  await prisma.pricingConfig.upsert({
    where: { id: 'default_pricing' },
    update: { data: pricingConfig as any },
    create: { id: 'default_pricing', data: pricingConfig as any },
  });

  console.log('Successfully seeded Pricing Config!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
