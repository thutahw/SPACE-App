# SPACE-App Context

## Project Overview
SPACE-App is a monorepo-based marketplace platform connecting in-store space owners with advertisers. It allows businesses to monetize unused surfaces (walls, windows, etc.) for hyperlocal advertising.

## Architecture & Tech Stack
The project uses a modern full-stack TypeScript architecture managed by **Turborepo**.

### **Monorepo Structure**
- **Package Manager:** `pnpm`
- **Build System:** `turborepo`
- **Workspaces:**
  - `apps/api`: Backend API (NestJS)
  - `apps/web`: Frontend Application (Next.js)
  - `packages/shared`: Shared TypeScript types, constants, and utilities.
  - `packages/*-config`: Shared configurations (ESLint, TypeScript).

### **Backend (`apps/api`)**
- **Framework:** NestJS 10
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Access + Refresh Tokens), Passport
- **Validation:** `class-validator`, `class-transformer`, `joi`
- **File Uploads:** `multer`
- **Testing:** Jest (Unit & E2E)

### **Frontend (`apps/web`)**
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, shadcn/ui (Radix UI)
- **State Management:** TanStack Query (React Query)
- **Forms:** React Hook Form + Zod
- **Icons:** Lucide React

### **Infrastructure**
- **Database:** PostgreSQL (via Docker Compose for local dev)
- **Deployment:** Render (`render.yaml`)

---

## Key Commands

### **Setup & Installation**
```bash
pnpm install
docker compose up -d postgres      # Start local DB
pnpm --filter api db:generate      # Generate Prisma Client
pnpm --filter api db:push          # Push schema to DB
```

### **Development**
```bash
pnpm dev             # Start all apps (API: 4001, Web: 3001)
pnpm --filter api dev # Start only API
pnpm --filter web dev # Start only Web
```

### **Database (Prisma)**
Run these from root or filter to api:
```bash
pnpm --filter api db:migrate       # Create/run migrations
pnpm --filter api db:studio        # Open Prisma Studio GUI
pnpm --filter api db:seed          # Seed database
```

### **Testing**
```bash
pnpm test            # Run unit tests
pnpm --filter api test:e2e # Run API E2E tests
```

---

## Development Standards

### **Backend (NestJS)**
- **Modules:** Follow the modular architecture (Controller -> Service -> Repository/Prisma).
- **DTOs:** strictly use `class-validator` decorators for input validation.
- **Env:** Access environment variables via `@nestjs/config`.
- **Response:** Use standard interceptors for response formatting if present (`TransformInterceptor`).

### **Frontend (Next.js)**
- **App Router:** Use the `app/` directory structure (`page.tsx`, `layout.tsx`, `loading.tsx`).
- **Client vs Server:** explicit `'use client'` directive for interactive components.
- **Data Fetching:** Prefer Server Components for initial data, React Query for client-side updates.
- **Components:** use `shadcn/ui` patterns located in `src/components/ui`.

### **Shared Code**
- Place shared types (interfaces, enums) and validation schemas (Zod) in `packages/shared`.
- Re-build shared package if changes aren't reflected: `pnpm --filter @space-app/shared build`.

## Important Notes
- **Migration Context:** `CLAUDE.md` contains information about a *legacy* stack (Express/React Router v5). **Ignore** that architecture in favor of the current NestJS/Next.js App Router setup found in the codebase.
- **Ports:**
  - Web: `3001`
  - API: `4001`
  - Postgres: `5432`
