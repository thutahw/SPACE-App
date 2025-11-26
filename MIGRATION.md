# To restart in the future:

cd /Users/vaircana/Desktop/SPACE-App

# Start API

pnpm --filter api dev

# In another terminal, start frontend

cd apps/web-v2 && pnpm dev

# SPACE-App Migration Guide

This document outlines the migration from the legacy Express/React/Sequelize stack to the new NestJS/Next.js/Prisma stack.

## Overview

### Legacy Stack

- **Backend**: Express.js with JavaScript
- **Frontend**: React with JavaScript
- **Database**: Sequelize ORM
- **Authentication**: Custom JWT implementation

### New Stack

- **Backend**: NestJS 10 with TypeScript (`apps/api-v2`)
- **Frontend**: Next.js 14 with TypeScript (`apps/web-v2`)
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: Passport.js with JWT + Refresh Token rotation
- **Package Manager**: pnpm with Turborepo

## Directory Structure

```
SPACE-App/
├── apps/
│   ├── api/              # Legacy Express backend
│   ├── api-v2/           # New NestJS backend
│   ├── web/              # Legacy React frontend
│   └── web-v2/           # New Next.js frontend
├── packages/
│   ├── shared/           # Shared types, constants, validations
│   ├── typescript-config/ # Shared TypeScript configs
│   └── eslint-config/    # Shared ESLint configs
├── docker-compose.yml    # PostgreSQL dev/test databases
├── turbo.json           # Turborepo configuration
└── pnpm-workspace.yaml  # pnpm workspace config
```

## Migration Steps

### 1. Database Migration

The Prisma schema is located at `apps/api-v2/prisma/schema.prisma`. To migrate:

```bash
# Start PostgreSQL
docker compose up -d postgres

# Create .env file from example
cp apps/api-v2/.env.example apps/api-v2/.env

# Generate Prisma client
pnpm --filter api db:generate

# Push schema to database (development)
pnpm --filter api db:push

# Or create migrations (production)
pnpm --filter api db:migrate
```

### 2. Data Migration

To migrate existing data from Sequelize to Prisma:

1. Export data from the legacy database
2. Transform data to match new schema
3. Import using Prisma's `createMany`

Example migration script:

```typescript
// scripts/migrate-data.ts
import { PrismaClient } from "@prisma/client";
import legacyData from "./legacy-export.json";

const prisma = new PrismaClient();

async function migrate() {
  // Migrate users
  await prisma.user.createMany({
    data: legacyData.users.map((user) => ({
      id: user.id,
      email: user.email,
      password: user.password, // Already hashed
      name: user.name,
      role: user.role || "USER",
    })),
    skipDuplicates: true,
  });

  // Migrate spaces
  await prisma.space.createMany({
    data: legacyData.spaces.map((space) => ({
      id: space.id,
      title: space.title,
      description: space.description,
      price: space.price,
      location: space.location,
      ownerId: space.userId,
      status: "ACTIVE",
    })),
    skipDuplicates: true,
  });

  // Migrate bookings
  await prisma.booking.createMany({
    data: legacyData.bookings.map((booking) => ({
      id: booking.id,
      spaceId: booking.spaceId,
      userId: booking.userId,
      startDate: new Date(booking.startDate),
      endDate: new Date(booking.endDate),
      status: booking.status,
      totalPrice: booking.totalPrice,
    })),
    skipDuplicates: true,
  });
}

migrate()
  .then(() => console.log("Migration complete"))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 3. API Endpoint Mapping

| Legacy Endpoint       | New Endpoint              | Notes                           |
| --------------------- | ------------------------- | ------------------------------- |
| `POST /auth/register` | `POST /api/auth/register` | Added refresh token             |
| `POST /auth/login`    | `POST /api/auth/login`    | Returns access + refresh tokens |
| `GET /spaces`         | `GET /api/spaces`         | Added pagination, filters       |
| `POST /spaces`        | `POST /api/spaces`        | Requires auth                   |
| `GET /spaces/:id`     | `GET /api/spaces/:id`     | Includes owner info             |
| `PUT /spaces/:id`     | `PATCH /api/spaces/:id`   | Changed to PATCH                |
| `DELETE /spaces/:id`  | `DELETE /api/spaces/:id`  | Soft delete                     |
| `GET /bookings`       | `GET /api/bookings`       | User-specific, paginated        |
| `POST /bookings`      | `POST /api/bookings`      | Validates dates, ownership      |

### 4. Authentication Changes

**Token Storage** (Frontend):

```typescript
// Legacy: Stored in memory/context only
// New: Stored in localStorage with refresh capability

// After login
localStorage.setItem(
  "auth_tokens",
  JSON.stringify({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
  })
);
```

**Token Refresh** (Automatic):

```typescript
// The API client automatically refreshes on 401
// See: apps/web-v2/src/lib/api-client.ts
```

### 5. Frontend Component Migration

Key differences:

- React Router → Next.js App Router
- Context API → React Query for server state
- CSS Modules → Tailwind CSS + shadcn/ui

Example component migration:

```typescript
// Legacy (React)
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function SpacesList() {
  const [spaces, setSpaces] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios.get("/spaces").then((res) => setSpaces(res.data));
  }, []);

  return (
    <div className="spaces-list">
      {spaces.map((space) => (
        <div key={space.id} onClick={() => navigate(`/spaces/${space.id}`)}>
          {space.title}
        </div>
      ))}
    </div>
  );
}

// New (Next.js)
("use client");
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { spacesApi } from "@/lib/api-client";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

function SpacesList() {
  const { data, isLoading } = useQuery({
    queryKey: ["spaces"],
    queryFn: () => spacesApi.list(),
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {data?.data.map((space) => (
        <Link key={space.id} href={`/spaces/${space.id}`}>
          <Card>
            <CardHeader>
              <CardTitle>{space.title}</CardTitle>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
```

## Running the New Stack

### Development

```bash
# Start databases
docker compose up -d

# Install dependencies
pnpm install

# Generate Prisma client
pnpm --filter api db:generate

# Push database schema
pnpm --filter api db:push

# Start both apps in development
pnpm dev

# Or start individually
pnpm --filter api dev      # API on port 4001
pnpm --filter web dev      # Frontend on port 3001
```

### Production

```bash
# Build all apps
pnpm build

# Start in production
pnpm --filter api start:prod
pnpm --filter web start
```

### Testing

```bash
# Run all tests
pnpm test

# Run e2e tests (requires test database)
docker compose up -d postgres-test
pnpm --filter api test:e2e
```

## Rollback Plan

If issues arise, the legacy apps remain in place:

- `apps/api` - Legacy Express backend
- `apps/web` - Legacy React frontend

Simply route traffic back to the legacy endpoints.

## Post-Migration Cleanup

After successful migration and verification:

1. Remove legacy apps:

   ```bash
   rm -rf apps/api apps/web
   ```

2. Rename new apps:

   ```bash
   mv apps/api-v2 apps/api
   mv apps/web-v2 apps/web
   ```

3. Update package.json names
4. Update pnpm-workspace.yaml
5. Update CI/CD pipelines
6. Update documentation

## Support

For issues during migration, check:

- NestJS docs: https://docs.nestjs.com
- Next.js docs: https://nextjs.org/docs
- Prisma docs: https://www.prisma.io/docs
