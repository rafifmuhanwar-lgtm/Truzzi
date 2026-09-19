import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  // Prisma 7: driver adapter untuk PostgreSQL
  datasource: {
    url: process.env.DATABASE_URL,
  },
  seed: {
    command: 'tsx prisma/seed.ts',
  },
});

