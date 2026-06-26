import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema',
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: 'ts-node prisma/seeds/index.ts',
  },
});
