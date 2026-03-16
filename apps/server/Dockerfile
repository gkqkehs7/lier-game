FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/server/package*.json ./apps/server/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --workspace=server --workspace=shared

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

WORKDIR /app/apps/server
RUN npm run build

EXPOSE 4000

CMD ["node", "dist/index.js"]
