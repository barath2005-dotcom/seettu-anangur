import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const DEFAULT_SUPABASE_URL =
  'postgresql://postgres.vwkmsxgirciqihnzlmoy:seettu%409715560910@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

let activeDatabaseUrl = process.env.DATABASE_URL;

if (!activeDatabaseUrl || !activeDatabaseUrl.startsWith('postgres')) {
  activeDatabaseUrl = DEFAULT_SUPABASE_URL;
  process.env.DATABASE_URL = activeDatabaseUrl;
}

export const prisma = new PrismaClient({
  datasources: activeDatabaseUrl ? { db: { url: activeDatabaseUrl } } : undefined,
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

export default prisma;
