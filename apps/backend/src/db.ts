import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

let activeDatabaseUrl = process.env.DATABASE_URL;

// On Vercel, if no PostgreSQL DATABASE_URL is configured, bootstrap SQLite in /tmp
if (!activeDatabaseUrl || !activeDatabaseUrl.startsWith('postgres')) {
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/seettu.db';
    if (!fs.existsSync(tmpDbPath)) {
      const possibleSeedPaths = [
        path.join(__dirname, '../prisma/seed-data.db'),
        path.join(__dirname, '../../apps/backend/prisma/seed-data.db'),
        path.join(process.cwd(), 'apps/backend/prisma/seed-data.db'),
        path.join(process.cwd(), 'prisma/seed-data.db'),
      ];
      for (const p of possibleSeedPaths) {
        if (fs.existsSync(p)) {
          try {
            fs.copyFileSync(p, tmpDbPath);
            break;
          } catch (e) {
            console.error('Failed copying seed db:', e);
          }
        }
      }
    }
    activeDatabaseUrl = `file:${tmpDbPath}`;
    process.env.DATABASE_URL = activeDatabaseUrl;
  }
}

export const prisma = new PrismaClient({
  datasources: activeDatabaseUrl ? { db: { url: activeDatabaseUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
