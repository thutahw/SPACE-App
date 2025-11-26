# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SPACE-App is a two-sided marketplace connecting in-store space owners with advertisers. Businesses can monetize unused walls, doors, windows, and other surfaces for hyperlocal advertising.

## Tech Stack

- **Frontend:** React 18.2.0 with React Router v5, CSS modules
- **Backend:** Express 5.1.0 with Sequelize ORM 6.37.7
- **Database:** PostgreSQL
- **Monorepo:** Turbo 2.5.3
- **Deployment:** Vercel

## Common Commands

```bash
# From root directory
npm run dev          # Start both API (:4000) and web (:3000) concurrently
npm run build        # Production build
npm start            # Start production servers

# API only (apps/api)
npm run dev          # Start with nodemon
npm test             # Run Jest tests

# Web only (apps/web)
npm start            # Start dev server
npm run build        # Create production build
npm test             # Run React tests
```

## Project Structure

```
apps/
├── web/                    # React frontend
│   └── src/
│       ├── App.js          # Router configuration
│       ├── auth/           # AuthContext for authentication state
│       ├── api/            # API client functions
│       ├── components/     # Reusable components (Header, ListingCard)
│       ├── pages/          # Page components (Home, Spaces, SpaceDetail, etc.)
│       └── styles/         # CSS files (one per component/page)
│
└── api/                    # Express backend
    ├── server.js           # Entry point
    ├── config/             # Sequelize configuration
    ├── models/             # User, Space, Booking models
    ├── controllers/        # Business logic
    ├── routes/             # API endpoints
    ├── migrations/         # Database migrations (numbered 0001-0007)
    └── tests/              # Jest tests
```

## Architecture Patterns

### Frontend
- React Router v5 with Switch/Route pattern
- AuthContext for global auth state (no Redux)
- Lazy loading for CreateSpace, MySpaces, NotFound pages
- API calls use `REACT_APP_API_URL` environment variable

### Backend
- MVC architecture with clear separation
- RESTful endpoints: `/spaces`, `/bookings`, `/users`
- Soft deletes via `deleted` boolean field (not hard deletes)
- Password hashing with bcryptjs hooks in User model
- Database config uses `DATABASE_URL` environment variable

### Data Models
- **User:** email (unique), password (auto-hashed), name, role (user/admin), deleted
- **Space:** title, description, price, location, imageUrls (array), ownerId (FK), deleted
- **Booking:** Links users to spaces with booking details

## Environment Variables

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `PORT` - Server port (default: 4000)

**Frontend:**
- `REACT_APP_API_URL` - Base URL for API calls

## Additional Documentation

Detailed specs available in `/docs/`:
- `technical_specs.md` - Full technology architecture
- `core_features.md` - MVP feature set
- `mvp_spec.md` - Detailed MVP requirements
