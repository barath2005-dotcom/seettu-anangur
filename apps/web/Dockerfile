FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

RUN npm install

COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

RUN npm run build:shared
RUN npm --workspace=@seettu/web run build

FROM nginx:alpine
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
