const { execSync } = require('child_process');
execSync(`npx prisma generate --schema=prisma/schema.prisma`, { stdio: 'inherit' });

