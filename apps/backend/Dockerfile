FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/backend/package*.json ./apps/backend/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend

RUN npm run build:shared
RUN cd apps/backend && npx prisma generate --schema=prisma/schema.postgresql.prisma
RUN cd apps/backend && npm run build

FROM node:20-alpine AS runner
WORKDIR /app

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/backend ./apps/backend

WORKDIR /app/apps/backend
EXPOSE 4000
CMD ["node", "dist/index.js"]
