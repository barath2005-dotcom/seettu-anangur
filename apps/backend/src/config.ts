import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET || 'super-secret-seettu-jwt-key-for-development-2026',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-seettu-refresh-jwt-key-2026',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://postgres.vwkmsxgirciqihnzlmoy:seettu%409715560910@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
};
