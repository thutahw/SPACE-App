# Comprehensive Map & Messaging Feature Plan (v3 - Final Architectural Lock)

## Overview

This document outlines the definitive implementation plan for the SPACE-App Map and Messaging features.
**Status:** v3 (Incorporates Critical Scale & Security Fixes)
**Approved By:** CTO
**Date:** Dec 5, 2025

---

# 🚨 CRITICAL ARCHITECTURAL MANDATES

## 1. Database: PostGIS & Infrastructure
We are committing to **PostGIS**.
- **Local:** We MUST swap `postgres:15-alpine` for `postgis/postgis:15-3.4-alpine` in `docker-compose.yml`.
- **Production:** We must verify the hosting provider supports PostGIS extensions.
- **Fallback:** If production lacks PostGIS, we fallback to bounding box floats + app-side filtering (slower, but safe).

## 2. Schema: Normalized Conversation Participants
To prevent duplicate conversations, we enforce a strict ordering rule:
**`participantOneId` MUST ALWAYS be less than `participantTwoId` (alphabetically/lexicographically).**

**Correct Logic:**
```typescript
const [p1, p2] = [userIdA, userIdB].sort();
// Upsert based on { p1, p2 }
```

## 3. Security: Explicit WebSocket Auth
We do not rely on implicit auth. We validate the JWT handshake explicitly.
```typescript
// messages.gateway.ts
handleConnection(client: Socket) {
  const token = client.handshake.auth.token; // Verify via JwtService
  // If invalid, disconnect immediately.
}
```

## 4. API Safety: Rate Limiting
We proxy Mapbox calls. We MUST protect our quota.
- **Mechanism:** `@nestjs/throttler`
- **Limit:** 30 requests / minute / user for Geocoding endpoints.

---

# PART 1: IMPLEMENTATION TASKS

## Phase 1: Foundation (Day 1-2)

### 1.1 Infrastructure & Database
- [ ] **Docker:** Update `docker-compose.yml` to use `postgis/postgis` image.
- [ ] **Prisma:** Add `Conversation` and `Message` models (see Final Schema below).
- [ ] **Migration (SQL):** Enable PostGIS extension (`CREATE EXTENSION postgis;`).
- [ ] **Migration (SQL):** Convert `Space` lat/lng to `geometry(Point, 4326)`.

### 1.2 Backend Core - Messaging
- [ ] **Service:** `ConversationsService` with `findOrCreate(userA, userB)` (Sorting logic!).
- [ ] **Service:** `MessagesService` with cursor-based pagination (`beforeId`).
- [ ] **Endpoint:** `GET /api/conversations` (Inbox).
    - *Note:* Use simple `OR` query for MVP. If performance drops, refactor to App-side UNION.
- [ ] **Endpoint:** `POST /api/messages` (Send).

### 1.3 Backend Core - Map
- [ ] **Controller:** `SpacesController.getInBounds(sw, ne)`.
    - *Query:* `ST_Within(location, ST_MakeEnvelope(...))`
- [ ] **Service:** `GeocodingService` (Mapbox) with **Throttling**.

## Phase 2: Frontend & Real-time (Day 3-5)

### 2.1 Real-time Messaging
- [ ] **Gateway:** `MessagesGateway` with strict JWT auth.
- [ ] **Events:** `sendMessage` (Client->Server), `newMessage` (Server->Client).
- [ ] **Frontend:** `SocketProvider` handling auth & reconnection.

### 2.2 Messaging UI
- [ ] **Components:** `ConversationList`, `MessageBubble`, `ChatInput`.
- [ ] **Logic:** Optimistic updates for sending.
- [ ] **Read Status:** HTTP endpoint `PATCH /conversations/:id/read` (No socket events for read receipts in MVP).

### 2.3 Map UI
- [ ] **Library:** `react-leaflet` + `react-leaflet-cluster`.
- [ ] **Components:** `PriceMarker` (CSS-based DivIcon).
- [ ] **Logic:** "Search this area" button (Manual trigger).
- [ ] **Geocoding:** Address Autocomplete with debouncing.

---

# PART 2: FINAL SCHEMA SPECIFICATION

## 2.1 New Models

```prisma
// apps/api/prisma/schema.prisma

model Conversation {
  id            String    @id @default(cuid())
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastMessageAt DateTime?
  lastMessagePreview String? @db.VarChar(100) // Denormalization for list performance

  // Participants (ALWAYS SORTED: participantOneId < participantTwoId)
  participantOneId String
  participantOne   User   @relation("ConversationParticipantOne", fields: [participantOneId], references: [id])
  participantTwoId String
  participantTwo   User   @relation("ConversationParticipantTwo", fields: [participantTwoId], references: [id])

  // Context
  spaceId   String?
  space     Space?   @relation(fields: [spaceId], references: [id], onDelete: SetNull)
  bookingId String?
  booking   Booking? @relation(fields: [bookingId], references: [id], onDelete: SetNull)

  // Archives
  isArchivedByOne Boolean @default(false)
  isArchivedByTwo Boolean @default(false)

  messages Message[]

  @@unique([participantOneId, participantTwoId])
  @@index([participantOneId, lastMessageAt(sort: Desc)])
  @@index([participantTwoId, lastMessageAt(sort: Desc)])
  @@map("conversations")
}

model Message {
  id        String   @id @default(cuid())
  content   String   @db.Text
  createdAt DateTime @default(now())

  senderId String
  sender   User   @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)

  conversationId String
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  isRead  Boolean   @default(false)
  readAt  DateTime?

  @@index([conversationId, createdAt(sort: Desc)])
  @@index([senderId])
  @@map("messages")
}
```

## 2.2 Updated Existing Models

### User Model (REPLACE messaging relations)

```prisma
model User {
  id        String    @id @default(cuid())
  email     String    @unique
  password  String
  name      String?
  role      UserRole  @default(USER)

  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  // Existing relations
  spaces        Space[]
  bookings      Booking[]
  refreshTokens RefreshToken[]

  // NEW: Conversation-based messaging (replaces old direct relations)
  sentMessages       Message[]      @relation("SentMessages")
  conversationsAsOne Conversation[] @relation("ConversationParticipantOne")
  conversationsAsTwo Conversation[] @relation("ConversationParticipantTwo")

  @@index([email])
  @@index([deletedAt])
  @@map("users")
}
```

### Space Model (ADD conversations relation)

```prisma
model Space {
  id          String    @id @default(cuid())
  title       String    @db.VarChar(255)
  description String?   @db.Text
  price       Decimal   @db.Decimal(10, 2)
  location    String?   @db.VarChar(500)
  latitude    Float?
  longitude   Float?
  imageUrls   String[]  @default([])

  deletedAt   DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  ownerId     String
  owner       User      @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  bookings    Booking[]

  // NEW: Conversations about this space
  conversations Conversation[]

  @@index([ownerId])
  @@index([deletedAt])
  @@index([price])
  @@index([location])
  @@index([latitude, longitude])
  @@map("spaces")
}
```

### Booking Model (ADD conversations, REMOVE direct messages)

```prisma
model Booking {
  id         String        @id @default(cuid())
  startDate  DateTime
  endDate    DateTime
  totalPrice Decimal       @default(0) @db.Decimal(10, 2)
  message    String?       @db.Text  // Initial booking message (keep for backward compat)
  status     BookingStatus @default(PENDING)

  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt

  userId    String
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  spaceId   String
  space     Space         @relation(fields: [spaceId], references: [id], onDelete: Cascade)

  // NEW: Conversations about this booking (replaces direct messages)
  conversations Conversation[]

  @@index([userId])
  @@index([spaceId])
  @@index([status])
  @@index([startDate, endDate])
  @@map("bookings")
}
```

---

# PART 2.5: DATA MIGRATION STRATEGY

## Migration Order (CRITICAL)

Execute in this exact order to avoid foreign key violations:

### Step 1: Create New Tables (Prisma handles this)
```bash
npx prisma migrate dev --name add_conversations
```

### Step 2: Migrate Existing Messages to Conversations

```sql
-- Run this AFTER Prisma migration creates the tables

-- 2a. Create conversations for each unique sender/receiver pair
INSERT INTO conversations (id, created_at, updated_at, participant_one_id, participant_two_id, last_message_at)
SELECT
  gen_random_uuid()::text,
  MIN(m.created_at),
  NOW(),
  LEAST(m.sender_id, m.receiver_id),      -- Normalized: smaller ID first
  GREATEST(m.sender_id, m.receiver_id),   -- Normalized: larger ID second
  MAX(m.created_at)
FROM messages m
GROUP BY LEAST(m.sender_id, m.receiver_id), GREATEST(m.sender_id, m.receiver_id)
ON CONFLICT (participant_one_id, participant_two_id) DO NOTHING;

-- 2b. Update messages to reference their conversation
UPDATE messages m
SET conversation_id = c.id
FROM conversations c
WHERE
  LEAST(m.sender_id, m.receiver_id) = c.participant_one_id
  AND GREATEST(m.sender_id, m.receiver_id) = c.participant_two_id;

-- 2c. Set lastMessagePreview for each conversation
UPDATE conversations c
SET last_message_preview = (
  SELECT LEFT(content, 100)
  FROM messages m
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC
  LIMIT 1
);

-- 2d. Link conversations to bookings (if messages had booking context)
UPDATE conversations c
SET booking_id = (
  SELECT DISTINCT m.booking_id
  FROM messages m
  WHERE m.conversation_id = c.id AND m.booking_id IS NOT NULL
  LIMIT 1
);
```

### Step 3: Clean Up Old Columns

```sql
-- Only run AFTER verifying migration success!
ALTER TABLE messages DROP COLUMN IF EXISTS receiver_id;
ALTER TABLE messages DROP COLUMN IF EXISTS booking_id;
```

### Step 4: Verify Migration

```sql
-- Check: All messages have conversation_id
SELECT COUNT(*) FROM messages WHERE conversation_id IS NULL;
-- Should return 0

-- Check: Conversation count matches unique pairs
SELECT
  (SELECT COUNT(*) FROM conversations) as conv_count,
  (SELECT COUNT(DISTINCT LEAST(sender_id, receiver_id) || '-' || GREATEST(sender_id, receiver_id))
   FROM messages) as expected_count;
-- Both numbers should match
```

## Rollback Script (If Migration Fails)

```sql
-- Emergency rollback
DROP TABLE IF EXISTS conversations CASCADE;
-- Messages table reverts to original schema (receiver_id column preserved if not dropped)
```

---

# PART 3: ROLLBACK & RISK MITIGATION

## PostGIS Rollback Strategy
If the production database does not support PostGIS, we execute:
1. `DROP INDEX IF EXISTS spaces_location_idx;`
2. `ALTER TABLE spaces DROP COLUMN IF EXISTS location;`
3. Revert code to use `latitude`/`longitude` floats with `FindMany` + application-side filtering.

## Mapbox Quota Protection
- **Strict Throttling:** 30 req/min per IP/User.
- **Caching:** Cache geocoding results in Redis/Memory for 24h (addresses don't change often).

---

# SUMMARY OF CHANGES FROM V2
1. **Schema:** Normalized participant order (`p1 < p2`) enforced in service layer.
2. **Schema:** Added `lastMessagePreview` to avoid joining latest message on list view.
3. **Schema:** Full model updates for User, Space, Booking with new relations.
4. **Auth:** Explicit socket handshake validation.
5. **Performance:** Downgraded "Read Receipts" to HTTP-only (no socket storm).
6. **Security:** Added Throttling to Geocoding API.
7. **Migration:** Complete SQL migration strategy for existing messages.
8. **Rollback:** Emergency rollback scripts for both PostGIS and Conversations.

---

# APPENDIX: QUICK REFERENCE

## Files to Modify

| File | Changes |
|------|---------|
| `docker-compose.yml` | Change to `postgis/postgis:15-3.4-alpine` |
| `schema.prisma` | Add Conversation, update Message, User, Space, Booking |
| `conversations.service.ts` | NEW: findOrCreate with participant sorting |
| `conversations.controller.ts` | NEW: GET /conversations, PATCH /:id/read |
| `messages.service.ts` | Update to use conversationId |
| `messages.gateway.ts` | Add explicit JWT validation |
| `geocoding.service.ts` | NEW: Mapbox integration |
| `geocoding.controller.ts` | NEW: with @Throttle decorator |

## Environment Variables to Add

```env
MAPBOX_ACCESS_TOKEN=pk.xxx...
```

## Commands Cheat Sheet

```bash
# 1. Update schema & generate client
npx prisma migrate dev --name add_conversations

# 2. Run data migration (after step 1)
psql $DATABASE_URL -f scripts/migrate_messages.sql

# 3. Enable PostGIS (if not auto-enabled)
psql $DATABASE_URL -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# 4. Verify
npx prisma studio
```
