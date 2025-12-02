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
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Generate Prisma client and push schema
pnpm --filter api db:generate
pnpm --filter api db:push

# Start development servers
pnpm dev
```

The API will be available at `http://localhost:4001` and the frontend at `http://localhost:3001`.

**Note:** The API default port is 4001 (configurable via PORT env variable). The frontend runs on port 3001 by default (see `apps/web/package.json`).

## Project Structure

```
SPACE-App/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── common/   # Filters, interceptors, decorators
│   │   │   ├── config/   # Configuration validation
│   │   │   └── modules/  # Feature modules
│   │   │       ├── auth/
│   │   │       ├── bookings/
│   │   │       ├── health/
│   │   │       ├── prisma/
│   │   │       ├── spaces/
│   │   │       ├── upload/
│   │   │       └── users/
│   │   ├── prisma/       # Database schema
│   │   ├── test/         # E2E tests
│   │   └── uploads/      # Local image storage
│   │
│   └── web/              # Next.js frontend
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

### API (`apps/api`)

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

### Frontend (`apps/web`)

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

### Upload
- `POST /api/upload/image` - Upload single image
- `POST /api/upload/images` - Upload multiple images (max 5)
- `DELETE /api/upload/:filename` - Delete image
- `GET /api/upload/images/:filename` - Serve uploaded image
- `GET /api/upload/thumbnails/:filename` - Serve thumbnail

## Environment Variables

### API (`apps/api/.env`)

```env
DATABASE_URL="postgresql://user:password@localhost:5432/space_app"
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_SECRET="your-refresh-secret-min-32-chars"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=4001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### Frontend (`apps/web/.env.local`)

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
docker build -t space-api -f apps/api/Dockerfile .
docker build -t space-web -f apps/web/Dockerfile .

# Run with docker-compose
docker compose -f docker-compose.yml -f docker-compose.prod.yml up
```

**Note:** Production Docker Compose configuration may need to be created based on project requirements.

## Current Implementation Status

### Completed Features ✅
- User authentication (JWT with refresh tokens)
- Space management (CRUD operations)
- Booking system (request, confirm, cancel)
- Image upload system (local storage with thumbnails)
- Soft delete for users and spaces
- E2E test coverage
- Health check endpoints

### In Development / Planned
- Payment processing (Stripe integration)
- Map integration for space discovery
- Messaging system between users
- Email verification
- Content moderation system
- Analytics dashboard

For detailed feature specifications, see [docs/core_features.md](./docs/core_features.md).

## Migration from Legacy

If migrating from the legacy Express/React stack, see [MIGRATION.md](./MIGRATION.md).

## License

UNLICENSED - Private repository
