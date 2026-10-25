const { execSync } = require('child_process');
const isPg = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres');
const schema = isPg ? 'prisma/schema.postgresql.prisma' : 'prisma/schema.prisma';
execSync(`npx prisma generate --schema=${schema}`, { stdio: 'inherit' });
