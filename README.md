# SPACE-App

SPACE is an innovative advertising rental platform that connects in-store space owners with advertisers, enabling businesses to monetize unused walls, doors, windows, and other in-store surfaces. Modeled after successful marketplace platforms, SPACE provides a streamlined, technology-driven solution for hyperlocal, cost-effective advertising.

## Tech Stack

### Backend (NestJS)
- **Framework**: NestJS 10 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with refresh token rotation
- **Validation**: class-validator + class-transformer
- **Testing**: Jest with e2e test support

### Frontend (Next.js)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form with Zod validation

### Infrastructure
- **Monorepo**: pnpm workspaces with Turborepo
- **Database**: PostgreSQL (Docker Compose for local dev)
- **Deployment**: Render (render.yaml included)

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker (for local PostgreSQL)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/SPACE-App.git
cd SPACE-App

# Install dependencies
pnpm install

# Start PostgreSQL
docker compose up -d postgres

# Set up environment variables
cp apps/api-v2/.env.example apps/api-v2/.env
cp apps/web-v2/.env.example apps/web-v2/.env.local

# Generate Prisma client and push schema
pnpm --filter api db:generate
pnpm --filter api db:push

# Start development servers
pnpm dev
```

The API will be available at `http://localhost:4001` and the frontend at `http://localhost:3001`.

## Project Structure

```
SPACE-App/
├── apps/
│   ├── api-v2/           # NestJS backend
│   │   ├── src/
│   │   │   ├── common/   # Filters, interceptors, decorators
│   │   │   ├── config/   # Configuration validation
│   │   │   └── modules/  # Feature modules
│   │   │       ├── auth/
│   │   │       ├── bookings/
│   │   │       ├── health/
│   │   │       ├── prisma/
│   │   │       ├── spaces/
│   │   │       └── users/
│   │   ├── prisma/       # Database schema
│   │   └── test/         # E2E tests
│   │
│   └── web-v2/           # Next.js frontend
│       └── src/
│           ├── app/      # App Router pages
│           ├── components/
│           ├── hooks/
│           ├── lib/      # API client, utilities
│           └── providers/
│
├── packages/
│   ├── shared/           # Shared types & constants
│   ├── typescript-config/ # TypeScript configurations
│   └── eslint-config/    # ESLint configurations
│
├── docker-compose.yml    # Local development databases
├── turbo.json           # Turborepo config
└── render.yaml          # Render deployment config
```

## Available Scripts

### Root (Monorepo)

```bash
pnpm dev          # Start all apps in development
pnpm build        # Build all apps
pnpm lint         # Lint all apps
pnpm type-check   # Type check all apps
pnpm test         # Run all tests
```

### API (`apps/api-v2`)

```bash
pnpm --filter api dev           # Start development server
pnpm --filter api build         # Build for production
pnpm --filter api start:prod    # Start production server
pnpm --filter api test          # Run unit tests
pnpm --filter api test:e2e      # Run e2e tests
pnpm --filter api db:generate   # Generate Prisma client
pnpm --filter api db:push       # Push schema to database
pnpm --filter api db:migrate    # Create migration
pnpm --filter api db:studio     # Open Prisma Studio
```

### Frontend (`apps/web-v2`)

```bash
pnpm --filter web dev     # Start development server
pnpm --filter web build   # Build for production
pnpm --filter web start   # Start production server
pnpm --filter web lint    # Run linting
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get current user

### Spaces
- `GET /api/spaces` - List spaces (public, paginated)
- `GET /api/spaces/:id` - Get space details
- `POST /api/spaces` - Create space (auth required)
- `PATCH /api/spaces/:id` - Update space (owner/admin)
- `DELETE /api/spaces/:id` - Delete space (owner/admin)
- `GET /api/spaces/my-spaces` - Get user's spaces

### Bookings
- `GET /api/bookings` - List user bookings
- `GET /api/bookings/:id` - Get booking details
- `POST /api/bookings` - Create booking request
- `PATCH /api/bookings/:id/status` - Update status (owner)
- `PATCH /api/bookings/:id/cancel` - Cancel booking
- `GET /api/bookings/my-bookings` - Get bookings made
- `GET /api/bookings/owner-bookings` - Get incoming requests

### Health
- `GET /api/health` - Health check with DB status
- `GET /api/health/live` - Liveness probe
- `GET /api/health/ready` - Readiness probe

## Environment Variables

### API (`apps/api-v2/.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/space_app"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4001
NODE_ENV=development
FRONTEND_URL="http://localhost:3001"
```

### Frontend (`apps/web-v2/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4001/api
```

## Testing

### E2E Tests

```bash
# Start test database
docker compose up -d postgres-test

# Push schema to test database
pnpm --filter api db:test:push

# Run e2e tests
pnpm --filter api test:e2e
```

## Deployment

### Render

The project includes a `render.yaml` blueprint for one-click deployment:

1. Connect your GitHub repository to Render
2. Create a new Blueprint Instance
3. Render will provision:
   - PostgreSQL database
   - NestJS API service
   - Next.js frontend service

### Docker

```bash
# Build images
docker build -t space-api -f apps/api-v2/Dockerfile .
docker build -t space-web -f apps/web-v2/Dockerfile .

# Run with docker-compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

## Migration from Legacy

If migrating from the legacy Express/React stack, see [MIGRATION.md](./MIGRATION.md).

## License

UNLICENSED - Private repository
