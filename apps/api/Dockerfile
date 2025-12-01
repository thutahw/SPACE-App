# Build stage
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps/api-v2 ./apps/api-v2

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the app
RUN pnpm --filter api build

# Production stage
FROM node:20-alpine AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

ENV NODE_ENV=production

# Copy necessary files
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/api-v2/package.json ./apps/api-v2/
COPY --from=builder /app/apps/api-v2/dist ./apps/api-v2/dist
COPY --from=builder /app/apps/api-v2/prisma ./apps/api-v2/prisma

# Install production dependencies only
RUN pnpm install --frozen-lockfile --prod

# Generate Prisma client
RUN pnpm --filter api db:generate

EXPOSE 4001

CMD ["pnpm", "--filter", "api", "start:prod"]
