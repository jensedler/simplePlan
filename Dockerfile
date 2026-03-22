# Stage 1: Build frontend
FROM node:22-alpine AS frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 2: Production server
# Build tools installed and removed in the same layer so better-sqlite3
# is compiled for the correct target architecture
FROM node:22-alpine
WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./
RUN npm ci --omit=dev

RUN apk del python3 make g++ && rm -rf /var/cache/apk/*

COPY backend/ .
COPY --from=frontend-build /app/frontend/dist ./public

RUN mkdir -p /storage

ENV DB_PATH=/storage/simplePlan.db
ENV NODE_ENV=production
ENV PORT=80

EXPOSE 80

CMD ["node", "server.js"]
