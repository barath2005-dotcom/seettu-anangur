import { PrismaClient } from '@prisma/client';

const DEFAULT_SUPABASE_URL =
  'postgresql://postgres.vwkmsxgirciqihnzlmoy:seettu%409715560910@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

let activeDatabaseUrl = process.env.DATABASE_URL;

if (!activeDatabaseUrl || !activeDatabaseUrl.startsWith('postgres')) {
  activeDatabaseUrl = DEFAULT_SUPABASE_URL;
  process.env.DATABASE_URL = activeDatabaseUrl;
} else if (activeDatabaseUrl.includes('6543') && !activeDatabaseUrl.includes('connection_limit')) {
  activeDatabaseUrl = `${activeDatabaseUrl}${activeDatabaseUrl.includes('?') ? '&' : '?'}connection_limit=1`;
  process.env.DATABASE_URL = activeDatabaseUrl;
}

// Global PrismaClient singleton for serverless lambda reuse & connection pooling
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: activeDatabaseUrl ? { db: { url: activeDatabaseUrl } } : undefined,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production' || process.env.VERCEL) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
