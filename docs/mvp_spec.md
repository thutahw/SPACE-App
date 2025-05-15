SPACE Platform Technical Documentation MVP Architecture for Airbnb-Style Advertising Space Marketplace

1. MVP Overview
   This document outlines the specifications of building a MVP. A two-sided marketplace connecting space owners (supply) with advertisers (demand). Built with modern web technologies for rapid iteration and scalability. Refer to the technical_specs for full specifications.
   Core Features
   User Auth: Secure signup/login via Auth0 (email/social login)
   Space Listings: Create/edit listings with photos, pricing, and location (Google Maps)
   Search & Discovery: Map-based browsing, filters (price, location, type)
   Booking & Payments: Stripe integration with escrow-like transactions
   Admin Dashboard: Basic moderation and analytics

2. Frontend Architecture (React)
   Tech Stack: React 18, React Router 6, Material-UI 5, @react-google-maps/api
   Key Components
   // Example SpaceCard Component

const SpaceCard = ({ title, price, location, image }) => (

  <Card>

    <CardMedia component="img" image={image} alt={title} />

    <CardContent>

      <Typography variant="h6">{title}</Typography>

      <Box display="flex" justifyContent="space-between">

        <Rating value={4.5} precision={0.5} readOnly />

        <Typography>${price}/day</Typography>

      </Box>

      <LocationPin lat={location.lat} lng={location.lng} />

    </CardContent>

  </Card>

);
Core Pages

3. Backend Architecture (Node.js/Express)
   Tech Stack: Express 4, PostgreSQL 14, Sequelize 6, Stripe SDK, AWS S3
   API Endpoints
   // spacesRouter.js

router.get("/", cache("10 minutes"), getSpaces);

router.post("/", authCheck, upload.array("images", 5), createSpace);

router.get("/search", searchSpaces); // Full-text search on title/description

// paymentsRouter.js

router.post("/intent", authCheck, createPaymentIntent);

router.post("/webhook", stripeWebhookHandler); // Stripe event handling
Database Schema (PostgreSQL)
CREATE TABLE spaces (

id SERIAL PRIMARY KEY,

title VARCHAR(255) NOT NULL,

price DECIMAL(10,2) CHECK (price > 0),

location GEOGRAPHY(POINT, 4326),

owner_id INT REFERENCES users(id) ON DELETE CASCADE,

created_at TIMESTAMPTZ DEFAULT NOW()

);

CREATE INDEX spaces_location_idx ON spaces USING GIST(location);

4. Key Integrations
   Auth0 Configuration

# .env

AUTH0_DOMAIN=your-domain.auth0.com

AUTH0_CLIENT_ID=your-client-id

AUTH0_AUDIENCE=https://api.space.com

// authMiddleware.js

const jwtCheck = auth({

audience: process.env.AUTH0_AUDIENCE,

issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}/`,

tokenSigningAlg: 'RS256'

});
Stripe Payment Flow
Create PaymentIntent on booking confirmation
Handle 3D Secure authentication client-side
Confirm payment via webhook:

app.post(

"/webhook",

bodyParser.raw({ type: "application/json" }),

(req, res) => {

    const sig = req.headers["stripe-signature"];

    const event = stripe.webhooks.constructEvent(

      req.body,

      sig,

      process.env.STRIPE_WEBHOOK_SECRET

    );

    // Handle event.type (payment_intent.succeeded etc.)

}

);
Google Maps Integration
// MapComponent.jsx

const Map = ({ center }) => (

<GoogleMap

    mapContainerStyle={{ width: "100%", height: "400px" }}

    center={center}

    zoom={13}

>

    <Marker position={center} />

  </GoogleMap>

);

5. Infrastructure & Deployment
   Initial Heroku Setup

# Database setup

heroku addons:create heroku-postgresql:hobby-dev

# Environment variables

heroku config:set \

DATABASE_URL=postgres://... \

STRIPE*SECRET_KEY=sk_test*... \

GOOGLE_MAPS_API_KEY=...

# Deployment

git push heroku main
Future AWS Migration Plan

6. Security & Compliance
   Data Encryption: TLS 1.3, encrypted database fields
   Rate Limiting: Express-rate-limit (100 reqs/15min)
   Input Validation: Joi schema validation middleware
   CORS: Whitelist frontend domains only
   Monitoring: Winston logging + New Relic APM

7. Development Workflow

# Local setup

npm install

createdb space_dev

cp .env.example .env # Configure credentials

# Testing

npm test # Jest unit tests

npx cypress open # E2E tests

# Deployment

git push heroku main

heroku logs --tail # Monitor live

Estimated MVP Timeline
