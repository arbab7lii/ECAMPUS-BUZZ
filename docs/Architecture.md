# ECAMPUS Buzz — Engineering Architecture Document
**Version:** 1.0 | **Lead Architect Review** | Based on PRD v1

---

## TABLE OF CONTENTS

1. [PRD Analysis Summary](#1-prd-analysis-summary)
2. [Phase-by-Phase Implementation Roadmap](#2-phase-by-phase-implementation-roadmap)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database Schema Plan](#5-database-schema-plan)
6. [API Architecture](#6-api-architecture)
7. [Folder Structure](#7-folder-structure)
8. [Reusable Component Strategy](#8-reusable-component-strategy)
9. [State Management Strategy](#9-state-management-strategy)
10. [Animation Strategy](#10-animation-strategy)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Cursor-Ready Implementation Sequence](#12-cursor-ready-implementation-sequence)

---

## 1. PRD ANALYSIS SUMMARY

### Core Product
A mobile-first campus social ecosystem. Students discover clubs, participate in discussions, vote in polls, attend events — all inside structured micro-communities.

### Complexity Classification
| Module | Complexity | Risk Level |
|---|---|---|
| Auth + RBAC | Medium | Low |
| Clubs System | High | Medium |
| Posts (Rich Text + Media) | High | Medium |
| Polls (Animated + Expiry) | Medium | Low |
| Events + RSVP | Medium | Low |
| Notifications | Medium | Medium |
| Reporting + Moderation | Medium | Low |
| Search (Debounced + Live) | Medium | Low |
| Saved Content | Low | Low |
| Activity Feed (Infinite Scroll) | Medium | Low |
| Admin Dashboard | High | Medium |
| 3D / Motion UI Layer | High | High |

### Key Architectural Decisions from PRD
- **Next.js 16 App Router** — required by PRD
- **PostgreSQL + Prisma** — required
- **Zustand** over Redux (simpler, better DX for this scope)
- **React Query (TanStack Query)** for server state
- **Framer Motion** primary animation — GSAP optional for scroll-pinned sequences
- **Three.js / React Three Fiber** — hero sections only, never inside feeds
- **Cloudinary** over S3 for MVP (faster setup, built-in transforms)
- **Vercel** frontend, **Railway** backend

---

## 2. PHASE-BY-PHASE IMPLEMENTATION ROADMAP

### Phase 0 — Foundation (Week 1)
**Goal:** Zero-to-running monorepo. No features. Just infrastructure.

```
Deliverables:
├── Monorepo setup (Turborepo)
├── Next.js 16 app initialized with App Router
├── Express.js API initialized
├── PostgreSQL + Prisma connected
├── Environment variable structure (.env.example)
├── Tailwind CSS configured with custom design tokens
├── ESLint + Prettier + Husky pre-commit hooks
├── TypeScript strict mode enabled
├── Shared types package created
└── CI/CD pipeline (GitHub Actions → Vercel + Railway)
```

**Exit Criteria:** `npm run dev` works. DB connects. No lint errors. CI passes.

---

### Phase 1 — Auth + RBAC (Week 2)
**Goal:** Secure, role-aware auth system. Foundation for all protected routes.

```
Deliverables:
├── Users table + Prisma migration
├── POST /api/auth/register
├── POST /api/auth/login
├── POST /api/auth/logout
├── JWT middleware (access + refresh tokens)
├── bcrypt password hashing
├── RBAC middleware (student / club_admin / super_admin)
├── Auth store (Zustand)
├── Protected route HOC (Next.js middleware)
├── Signup page (animated)
├── Login page (animated)
├── Forgot password page (UI only for MVP)
└── Session persistence (httpOnly cookies)
```

**Exit Criteria:** Register, login, logout work. JWT protected routes reject unauthorized. Roles enforced at middleware level.

---

### Phase 2 — Clubs System (Week 3–4)
**Goal:** Core micro-community engine. Most complex module.

```
Deliverables:
├── Clubs table + ClubMembership table + migrations
├── CRUD APIs for clubs
├── Join / Request / Approve / Reject flows
├── Club directory page (/clubs)
├── Individual club page (/clubs/[slug])
├── Club header component (cover, logo, member count, tags)
├── Club feed tabs (Posts / Events / Polls / Members)
├── Join button state machine (Join → Requested → Joined / Rejected)
├── Club creation modal (Club Admin+)
├── Member management panel (Club Admin+)
├── Public vs Private club logic
└── Club search + filter
```

**Exit Criteria:** Student can create club, join public club, request private club, get approved/rejected. Club admin can manage members.

---

### Phase 3 — Content Modules (Week 5–6)
**Goal:** Posts, Polls, Events — the core engagement loop.

```
Phase 3A — Posts:
├── Posts table + migrations
├── Rich text editor integration (Tiptap or Quill)
├── Cloudinary upload integration (images)
├── Post creation modal
├── Post feed card component
├── Save / Unsave post
├── Report post
└── Delete own post

Phase 3B — Polls:
├── Polls table + PollVote table + migrations
├── Poll creation modal (2–5 options)
├── Vote API (idempotent, expiry-aware)
├── Animated result bars (Framer Motion)
├── Voting state / Result state / Expired state
└── Poll card component

Phase 3C — Events:
├── Events table + EventRSVP table + migrations
├── Event creation modal
├── RSVP API
├── Event card component
├── Events feed page (/events)
└── Save / Unsave event
```

**Exit Criteria:** Student can create/view posts with media. Can vote in polls (once, before expiry). Can RSVP to events.

---

### Phase 4 — Notifications + Reporting + Search (Week 7)
**Goal:** System-wide utility modules. Platform feels alive.

```
Phase 4A — Notifications:
├── Notifications table + migration
├── Notification triggers (join approved, new post, poll created, etc.)
├── GET /api/notifications
├── PATCH /api/notifications/:id/read
├── Notification center page (/notifications)
├── Notification bell (navbar, with unread count badge)
└── Notification preference settings

Phase 4B — Reporting:
├── Reports table + migration
├── Report modal (target: user/post/poll/club, reasons)
├── POST /api/reports
├── Admin: GET /api/reports
└── Moderation actions (remove, suspend, warn, reject)

Phase 4C — Search:
├── Debounced search hook
├── Search API (clubs + posts + tags)
├── Live suggestions dropdown
├── Search results page
├── Recent searches (localStorage)
└── Empty state for no results
```

**Exit Criteria:** Notifications fire on key actions. Reports submittable. Search returns relevant results with debouncing.

---

### Phase 5 — Activity Feed + Saved + Admin (Week 8)
**Goal:** Complete the platform experience. Admin control center.

```
Phase 5A — Activity Feed:
├── Unified feed query (posts + events + polls from joined clubs)
├── Infinite scroll implementation
├── Pagination (cursor-based)
├── Lazy loading cards
├── Animated entry for new items
└── Home feed page (/)

Phase 5B — Saved Content:
├── SavedItems join table + migration
├── Saved section page (/saved)
├── Tabs: Saved Posts / Saved Events / Saved Polls
└── Remove from saved

Phase 5C — Admin Dashboard:
├── /admin route (super_admin only)
├── Reports queue
├── User management (suspend / warn)
├── Club management (delete)
├── Platform statistics (user count, club count, post count)
└── Admin navigation sidebar
```

**Exit Criteria:** Home feed shows personalized content with infinite scroll. Saved section fully functional. Admin can take moderation actions.

---

### Phase 6 — Polish + Performance + Deployment (Week 9–10)
**Goal:** Production-ready. Fast. Beautiful. Deployed.

```
Deliverables:
├── Skeleton loaders on all async content
├── Error boundary components
├── Empty state illustrations on all empty views
├── Toast notification system
├── 3D hero section (Three.js / R3F — home page only)
├── Scroll-based reveal animations (GSAP ScrollTrigger)
├── Mobile bottom navigation
├── PWA manifest + icons
├── Image optimization (next/image + Cloudinary CDN)
├── Code splitting audit
├── Lighthouse audit (target: 90+ mobile)
├── Rate limiting on all mutation APIs
├── Input sanitization audit
├── Security headers (next.config.js)
├── Production environment variables
├── Vercel deployment (frontend)
├── Railway deployment (backend)
└── PostgreSQL hosted (Railway / Supabase)
```

**Exit Criteria:** Lighthouse 90+ mobile. Zero console errors. All edge cases handled. Deployed and accessible.

---

## 3. FRONTEND ARCHITECTURE

### Stack
```
Framework:        Next.js 16 (App Router)
Language:         TypeScript (strict mode)
Styling:          Tailwind CSS v4
Animations:       Framer Motion (primary)
                  GSAP + ScrollTrigger (scroll sequences)
3D:               React Three Fiber + Drei (hero only)
Icons:            Lucide React
UI Primitives:    Radix UI (accessible headless)
Components:       shadcn/ui (customized, not stock)
Forms:            React Hook Form + Zod
HTTP Client:      Axios
Server State:     TanStack Query (React Query v5)
Global State:     Zustand
Rich Text:        Tiptap
File Uploads:     react-dropzone → Cloudinary
```

### Design Token System (Tailwind Config)
```ts
// tailwind.config.ts — custom tokens
colors: {
  // Base
  'buzz-black':     '#080B12',   // deepest background
  'buzz-surface':   '#0E1420',   // card background
  'buzz-border':    '#1C2333',   // subtle borders
  'buzz-muted':     '#2A3449',   // disabled, placeholder
  
  // Brand
  'buzz-primary':   '#6366F1',   // indigo — primary CTA
  'buzz-accent':    '#22D3EE',   // cyan — highlights, glow
  'buzz-danger':    '#F43F5E',   // rose — delete, errors
  'buzz-success':   '#10B981',   // emerald — approvals
  'buzz-warning':   '#F59E0B',   // amber — warnings
  
  // Text
  'buzz-text':      '#E2E8F0',   // primary text
  'buzz-muted-text':'#64748B',   // secondary text
}

fontFamily: {
  display: ['Clash Display', 'sans-serif'],  // headings
  body:    ['Geist', 'sans-serif'],          // body text
  mono:    ['JetBrains Mono', 'monospace'],  // code
}

borderRadius: {
  'card': '16px',
  'modal': '24px',
  'pill': '9999px',
}
```

### Next.js App Router Page Map
```
app/
├── (auth)/
│   ├── login/page.tsx
│   ├── register/page.tsx
│   └── forgot-password/page.tsx
│
├── (app)/                          ← protected layout
│   ├── layout.tsx                  ← navbar + bottom nav
│   ├── page.tsx                    ← / home feed
│   ├── clubs/
│   │   ├── page.tsx                ← /clubs directory
│   │   └── [slug]/page.tsx         ← /clubs/[slug]
│   ├── polls/page.tsx
│   ├── events/page.tsx
│   ├── notifications/page.tsx
│   ├── saved/page.tsx
│   ├── profile/
│   │   ├── page.tsx                ← /profile (own)
│   │   └── [userId]/page.tsx       ← /profile/[userId]
│   └── admin/
│       ├── layout.tsx              ← admin sidebar layout
│       ├── page.tsx                ← dashboard
│       ├── reports/page.tsx
│       └── users/page.tsx
│
└── api/                            ← Next.js API routes (proxy or direct)
```

### Rendering Strategy
| Route | Strategy | Reason |
|---|---|---|
| `/` Home Feed | CSR + ISR hybrid | Personalized, frequently changing |
| `/clubs` | SSG + revalidate 60s | Discoverable, SEO beneficial |
| `/clubs/[slug]` | SSR | Dynamic, member-specific content |
| `/polls` | CSR | Realtime vote counts |
| `/events` | ISR (30s) | Semi-static |
| `/notifications` | CSR | User-specific |
| `/admin` | CSR | Admin only, no SEO |
| Auth pages | Static | No data dependency |

---

## 4. BACKEND ARCHITECTURE

### Stack
```
Runtime:      Node.js 20 LTS
Framework:    Express.js
Language:     TypeScript
ORM:          Prisma 5
Database:     PostgreSQL 16
Auth:         jsonwebtoken + bcrypt
Validation:   Zod
File Storage: Cloudinary SDK
Rate Limit:   express-rate-limit
Security:     helmet, cors, hpp
Logging:      Winston
```

### Service Architecture (Modular Monolith)
```
Not microservices for MVP. Modular monolith with clean service boundaries.
Easy to extract to microservices in Phase 2 (post-MVP).

src/
├── modules/
│   ├── auth/          ← AuthService, AuthController, AuthRouter
│   ├── clubs/         ← ClubService, ClubController, ClubRouter
│   ├── posts/         ← PostService, PostController, PostRouter
│   ├── polls/         ← PollService, PollController, PollRouter
│   ├── events/        ← EventService, EventController, EventRouter
│   ├── notifications/ ← NotificationService, NotificationController
│   ├── reports/       ← ReportService, ReportController
│   ├── search/        ← SearchService, SearchController
│   └── saves/         ← SaveService, SaveController
│
├── middleware/
│   ├── auth.middleware.ts      ← JWT verification
│   ├── rbac.middleware.ts      ← Role enforcement
│   ├── upload.middleware.ts    ← Cloudinary multer
│   ├── validate.middleware.ts  ← Zod schema validation
│   ├── rateLimit.middleware.ts ← Per-route rate limiting
│   └── errorHandler.middleware.ts
│
├── lib/
│   ├── prisma.ts       ← Prisma client singleton
│   ├── cloudinary.ts   ← Cloudinary config
│   ├── jwt.ts          ← Token helpers
│   └── logger.ts       ← Winston logger
│
├── types/
│   └── index.ts        ← Shared TS interfaces
│
└── app.ts              ← Express app bootstrap
```

### Notification Trigger Architecture
```
Notifications are NOT realtime in MVP. Event-based trigger pattern:

Action happens (e.g., club join approved)
    ↓
Service layer calls NotificationService.create(payload)
    ↓
Notification written to DB
    ↓
Client polls GET /api/notifications (every 30s or on tab focus)

Future: Replace polling with WebSockets or Server-Sent Events.
```

---

## 5. DATABASE SCHEMA PLAN

### Entity Relationship Overview
```
Users ──< ClubMembership >── Clubs
Users ──< Posts >── Clubs
Users ──< Polls >── Clubs
Users ──< PollVotes >── Polls
Users ──< Events >── Clubs
Users ──< EventRSVPs >── Events
Users ──< Notifications
Users ──< Reports
Users ──< SavedItems (Post | Poll | Event)
```

### Full Prisma Schema
```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

enum UserRole {
  STUDENT
  CLUB_ADMIN
  SUPER_ADMIN
}

enum ClubVisibility {
  PUBLIC
  PRIVATE
}

enum MembershipStatus {
  PENDING
  APPROVED
  REJECTED
  REMOVED
}

enum MembershipRole {
  MEMBER
  ADMIN
}

enum ReportTargetType {
  POST
  POLL
  USER
  CLUB
}

enum ReportReason {
  SPAM
  HARASSMENT
  NSFW
  FAKE_INFORMATION
  OTHER
}

enum ReportStatus {
  PENDING
  RESOLVED
  REJECTED
}

enum SavedItemType {
  POST
  POLL
  EVENT
}

enum NotificationType {
  JOIN_REQUEST
  JOIN_APPROVED
  JOIN_REJECTED
  MEMBER_REMOVED
  MEMBER_PROMOTED
  NEW_POST
  NEW_POLL
  NEW_EVENT
  REPORT_RESOLVED
}

// ─────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(STUDENT)
  avatar       String?
  bio          String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relations
  clubsCreated       Club[]            @relation("ClubCreator")
  memberships        ClubMembership[]
  posts              Post[]
  polls              Poll[]
  pollVotes          PollVote[]
  events             Event[]
  eventRsvps         EventRSVP[]
  notifications      Notification[]    @relation("NotificationRecipient")
  reportsSubmitted   Report[]          @relation("ReportedBy")
  savedItems         SavedItem[]

  @@map("users")
}

model Club {
  id          String         @id @default(uuid())
  name        String
  slug        String         @unique
  logo        String?
  coverImage  String?
  description String?
  tags        String[]
  visibility  ClubVisibility @default(PUBLIC)
  createdBy   String
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt

  // Relations
  creator     User             @relation("ClubCreator", fields: [createdBy], references: [id])
  members     ClubMembership[]
  posts       Post[]
  polls       Poll[]
  events      Event[]

  @@map("clubs")
}

model ClubMembership {
  id        String           @id @default(uuid())
  userId    String
  clubId    String
  role      MembershipRole   @default(MEMBER)
  status    MembershipStatus @default(PENDING)
  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  club Club @relation(fields: [clubId], references: [id], onDelete: Cascade)

  @@unique([userId, clubId])
  @@map("club_memberships")
}

model Post {
  id        String   @id @default(uuid())
  clubId    String
  createdBy String
  title     String
  content   String   // JSON string (Tiptap output)
  media     String[] // Array of Cloudinary URLs
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  club    Club      @relation(fields: [clubId], references: [id], onDelete: Cascade)
  author  User      @relation(fields: [createdBy], references: [id])
  saves   SavedItem[] @relation("SavedPost")

  @@map("posts")
}

model Poll {
  id         String    @id @default(uuid())
  clubId     String?   // null = public poll
  createdBy  String
  question   String
  options    String[]  // Array of option texts
  visibility ClubVisibility @default(PUBLIC)
  expiresAt  DateTime?
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  club   Club?      @relation(fields: [clubId], references: [id], onDelete: SetNull)
  author User       @relation(fields: [createdBy], references: [id])
  votes  PollVote[]
  saves  SavedItem[] @relation("SavedPoll")

  @@map("polls")
}

model PollVote {
  id          String   @id @default(uuid())
  pollId      String
  userId      String
  optionIndex Int      // 0-based index into poll.options[]
  createdAt   DateTime @default(now())

  poll Poll @relation(fields: [pollId], references: [id], onDelete: Cascade)
  user User @relation(fields: [userId], references: [id])

  @@unique([pollId, userId]) // Prevents duplicate voting at DB level
  @@map("poll_votes")
}

model Event {
  id          String   @id @default(uuid())
  clubId      String?
  createdBy   String
  title       String
  description String?
  eventDate   DateTime
  location    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  club   Club?       @relation(fields: [clubId], references: [id], onDelete: SetNull)
  author User        @relation(fields: [createdBy], references: [id])
  rsvps  EventRSVP[]
  saves  SavedItem[] @relation("SavedEvent")

  @@map("events")
}

model EventRSVP {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  createdAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([eventId, userId])
  @@map("event_rsvps")
}

model Notification {
  id          String           @id @default(uuid())
  recipientId String
  type        NotificationType
  message     String
  referenceId String?          // ID of related entity (clubId, postId, etc.)
  isRead      Boolean          @default(false)
  createdAt   DateTime         @default(now())

  recipient User @relation("NotificationRecipient", fields: [recipientId], references: [id], onDelete: Cascade)

  @@map("notifications")
}

model Report {
  id         String           @id @default(uuid())
  targetId   String
  targetType ReportTargetType
  reason     ReportReason
  reportedBy String
  status     ReportStatus     @default(PENDING)
  notes      String?          // Admin resolution notes
  createdAt  DateTime         @default(now())
  updatedAt  DateTime         @updatedAt

  reporter User @relation("ReportedBy", fields: [reportedBy], references: [id])

  @@map("reports")
}

model SavedItem {
  id        String        @id @default(uuid())
  userId    String
  itemType  SavedItemType
  postId    String?
  pollId    String?
  eventId   String?
  createdAt DateTime      @default(now())

  user  User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  post  Post?  @relation("SavedPost",  fields: [postId],  references: [id], onDelete: Cascade)
  poll  Poll?  @relation("SavedPoll",  fields: [pollId],  references: [id], onDelete: Cascade)
  event Event? @relation("SavedEvent", fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@unique([userId, pollId])
  @@unique([userId, eventId])
  @@map("saved_items")
}
```

### Database Indexes (Performance)
```sql
-- High-traffic queries need indexes:

CREATE INDEX idx_club_memberships_userid ON club_memberships(user_id);
CREATE INDEX idx_club_memberships_clubid ON club_memberships(club_id);
CREATE INDEX idx_posts_clubid ON posts(club_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_polls_clubid ON polls(club_id);
CREATE INDEX idx_polls_expires_at ON polls(expires_at);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_saved_items_userid ON saved_items(user_id, item_type);

-- Full-text search:
CREATE INDEX idx_clubs_search ON clubs USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));
CREATE INDEX idx_posts_search ON posts USING gin(to_tsvector('english', title || ' ' || content));
```

---

## 6. API ARCHITECTURE

### Design Principles
- RESTful conventions
- Versioned: `/api/v1/...`
- Consistent response envelope
- Cursor-based pagination (not offset — better for feeds)
- Zod validation on all inputs
- Rate limiting per route class

### Standard Response Envelope
```ts
// Success
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "nextCursor": "uuid...",
    "total": 142
  }
}

// Error
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "You must be logged in to perform this action"
  }
}
```

### Complete API Endpoint Table

#### Auth (`/api/v1/auth`)
| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/register` | None | 10/hr | Create account |
| POST | `/login` | None | 20/hr | Login, returns JWT |
| POST | `/logout` | JWT | None | Invalidate session |
| POST | `/refresh` | Refresh token | 50/hr | Refresh access token |
| GET | `/me` | JWT | None | Get current user |

#### Clubs (`/api/v1/clubs`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | Optional | Any | List clubs (paginated, searchable) |
| POST | `/` | JWT | Student+ | Create club |
| GET | `/:slug` | Optional | Any | Get club by slug |
| PATCH | `/:id` | JWT | Club Admin | Update club |
| DELETE | `/:id` | JWT | Super Admin | Delete club |
| POST | `/:id/join` | JWT | Student | Join public club |
| POST | `/:id/request` | JWT | Student | Request to join private club |
| GET | `/:id/members` | JWT | Club Member | List members |
| PATCH | `/:id/members/:userId` | JWT | Club Admin | Update member role/status |
| DELETE | `/:id/members/:userId` | JWT | Club Admin | Remove member |

#### Posts (`/api/v1/posts`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Member | Get posts (by club or feed) |
| POST | `/` | JWT | Member | Create post |
| GET | `/:id` | JWT | Member | Get single post |
| DELETE | `/:id` | JWT | Author/Club Admin | Delete post |

#### Polls (`/api/v1/polls`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Member | List polls |
| POST | `/` | JWT | Member | Create poll |
| GET | `/:id` | JWT | Member | Get poll with vote counts |
| POST | `/:id/vote` | JWT | Member | Cast vote |

#### Events (`/api/v1/events`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/` | JWT | Member | List events |
| POST | `/` | JWT | Member | Create event |
| GET | `/:id` | JWT | Member | Get event |
| POST | `/:id/rsvp` | JWT | Member | RSVP to event |
| DELETE | `/:id/rsvp` | JWT | Member | Cancel RSVP |

#### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | JWT | List notifications (paginated) |
| PATCH | `/:id/read` | JWT | Mark one as read |
| PATCH | `/read-all` | JWT | Mark all as read |
| GET | `/unread-count` | JWT | Get badge count |

#### Reports (`/api/v1/reports`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/` | JWT | Any | Submit report |
| GET | `/` | JWT | Super Admin | List reports |
| PATCH | `/:id` | JWT | Super Admin | Resolve/reject report |

#### Search (`/api/v1/search`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/?q=term&type=clubs,posts,tags` | Optional | Full-text search |

#### Saved Items (`/api/v1/saves`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | JWT | Save an item |
| DELETE | `/:id` | JWT | Unsave an item |
| GET | `/` | JWT | List saved items (by type) |

#### Admin (`/api/v1/admin`)
| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/stats` | JWT | Super Admin | Platform statistics |
| PATCH | `/users/:id/suspend` | JWT | Super Admin | Suspend user |
| DELETE | `/clubs/:id` | JWT | Super Admin | Force delete club |

### Pagination Strategy
```
Cursor-based pagination for feeds (infinite scroll):
GET /api/v1/posts?clubId=xxx&cursor=lastPostId&limit=20

Returns:
{
  data: [...posts],
  meta: {
    nextCursor: "uuid-of-last-item",
    hasMore: true
  }
}

Offset pagination for admin tables:
GET /api/v1/admin/reports?page=2&limit=25
```

---

## 7. FOLDER STRUCTURE

### Monorepo Structure (Turborepo)
```
ecampus-buzz/
├── apps/
│   ├── web/                        ← Next.js 16 frontend
│   └── api/                        ← Express.js backend
│
├── packages/
│   ├── types/                      ← Shared TypeScript interfaces
│   │   └── src/index.ts
│   ├── ui/                         ← Shared UI primitives (optional)
│   └── config/
│       ├── eslint-config/
│       └── tsconfig/
│
├── turbo.json
├── package.json
└── .github/
    └── workflows/
        ├── ci.yml
        └── deploy.yml
```

### Frontend (`apps/web/`)
```
apps/web/
├── src/
│   ├── app/                        ← Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── register/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx          ← Auth layout (centered, dark)
│   │   │
│   │   ├── (app)/                  ← Protected app shell
│   │   │   ├── layout.tsx          ← AppShell component
│   │   │   ├── page.tsx            ← Home feed
│   │   │   ├── clubs/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx
│   │   │   ├── polls/page.tsx
│   │   │   ├── events/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── saved/page.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx
│   │   │   │   └── [userId]/page.tsx
│   │   │   └── admin/
│   │   │       ├── layout.tsx
│   │   │       ├── page.tsx
│   │   │       ├── reports/page.tsx
│   │   │       └── users/page.tsx
│   │   │
│   │   ├── globals.css
│   │   ├── layout.tsx              ← Root layout (fonts, providers)
│   │   └── not-found.tsx
│   │
│   ├── components/
│   │   ├── ui/                     ← Base design system
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Textarea.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Tabs.tsx
│   │   │   ├── Dropdown.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── index.ts           ← Barrel export
│   │   │
│   │   ├── layout/                 ← Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── AppShell.tsx
│   │   │
│   │   ├── clubs/                  ← Club-specific components
│   │   │   ├── ClubCard.tsx
│   │   │   ├── ClubHeader.tsx
│   │   │   ├── ClubFeed.tsx
│   │   │   ├── ClubFeedTabs.tsx
│   │   │   ├── ClubMemberList.tsx
│   │   │   ├── JoinButton.tsx
│   │   │   ├── CreateClubModal.tsx
│   │   │   └── ClubDirectory.tsx
│   │   │
│   │   ├── posts/
│   │   │   ├── PostCard.tsx
│   │   │   ├── PostFeed.tsx
│   │   │   ├── CreatePostModal.tsx
│   │   │   ├── RichTextEditor.tsx
│   │   │   └── MediaUploader.tsx
│   │   │
│   │   ├── polls/
│   │   │   ├── PollCard.tsx
│   │   │   ├── PollOption.tsx
│   │   │   ├── PollResultBar.tsx
│   │   │   └── CreatePollModal.tsx
│   │   │
│   │   ├── events/
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventFeed.tsx
│   │   │   └── CreateEventModal.tsx
│   │   │
│   │   ├── notifications/
│   │   │   ├── NotificationItem.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationList.tsx
│   │   │
│   │   ├── feed/
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── FeedItem.tsx
│   │   │   └── InfiniteScroll.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchSuggestions.tsx
│   │   │   └── SearchResults.tsx
│   │   │
│   │   ├── moderation/
│   │   │   ├── ReportModal.tsx
│   │   │   └── ModerationActions.tsx
│   │   │
│   │   └── three/                  ← 3D components (isolated)
│   │       ├── HeroBackground.tsx
│   │       ├── ParticleField.tsx
│   │       └── FloatingOrbs.tsx
│   │
│   ├── hooks/                      ← Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useClub.ts
│   │   ├── usePosts.ts
│   │   ├── usePolls.ts
│   │   ├── useEvents.ts
│   │   ├── useNotifications.ts
│   │   ├── useSearch.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useDebounce.ts
│   │   ├── useMediaUpload.ts
│   │   └── useSave.ts
│   │
│   ├── stores/                     ← Zustand stores
│   │   ├── auth.store.ts
│   │   ├── notifications.store.ts
│   │   ├── ui.store.ts             ← modal open/close, theme
│   │   └── index.ts
│   │
│   ├── lib/                        ← Utilities
│   │   ├── api.ts                  ← Axios instance
│   │   ├── queryClient.ts          ← React Query config
│   │   ├── validators/             ← Zod schemas (mirrored from API)
│   │   │   ├── auth.schema.ts
│   │   │   ├── club.schema.ts
│   │   │   ├── post.schema.ts
│   │   │   ├── poll.schema.ts
│   │   │   └── event.schema.ts
│   │   ├── utils.ts                ← cn(), formatDate(), truncate()
│   │   ├── motion.ts               ← Shared Framer Motion variants
│   │   └── constants.ts
│   │
│   ├── types/                      ← Frontend-specific types
│   │   └── index.ts
│   │
│   └── styles/
│       └── fonts.ts                ← Font declarations
│
├── public/
│   ├── icons/
│   ├── illustrations/              ← Empty state SVGs
│   └── logo.svg
│
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Backend (`apps/api/`)
```
apps/api/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.router.ts
│   │   │   └── auth.schema.ts      ← Zod validation schemas
│   │   ├── clubs/
│   │   │   ├── clubs.controller.ts
│   │   │   ├── clubs.service.ts
│   │   │   ├── clubs.router.ts
│   │   │   └── clubs.schema.ts
│   │   ├── posts/
│   │   ├── polls/
│   │   ├── events/
│   │   ├── notifications/
│   │   ├── reports/
│   │   ├── search/
│   │   └── saves/
│   │
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   ├── rbac.middleware.ts
│   │   ├── validate.middleware.ts
│   │   ├── upload.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── errorHandler.middleware.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── cloudinary.ts
│   │   ├── jwt.ts
│   │   └── logger.ts
│   │
│   ├── types/
│   │   └── express.d.ts            ← Augment Express Request type
│   │
│   └── app.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── tsconfig.json
└── package.json
```

---

## 8. REUSABLE COMPONENT STRATEGY

### Component Design Principles
1. **Atomic → Molecular → Organism hierarchy** — build small, compose big
2. **No logic in UI components** — props in, rendering out
3. **All variants via props** — not separate files
4. **Motion variants centralized** — `lib/motion.ts`
5. **Never hardcode colors** — always use Tailwind tokens
6. **Mobile-first props** — every component tested at 375px first

### Core Design System Components (`components/ui/`)

#### Button
```tsx
// Variants: primary | secondary | ghost | danger | outline
// Sizes: sm | md | lg
// States: loading (spinner) | disabled | active
// Motion: scale(0.97) on press, glow on hover (primary only)

<Button variant="primary" size="md" loading={isSubmitting}>
  Join Club
</Button>
```

#### Card
```tsx
// Base glassmorphism card — all content cards extend this
// Props: glass (bool), glow (bool), hover (bool)
// glass → backdrop-blur + bg-white/5 + border-white/10
// glow → subtle indigo drop shadow on hover
// hover → translate-y(-2px) on hover with motion

<Card glass glow hover>
  {children}
</Card>
```

#### Modal
```tsx
// Radix Dialog under the hood
// Framer Motion: slide up on open, fade out on close
// Mobile: full-screen sheet on < 640px
// Desktop: centered modal with blur backdrop

<Modal open={open} onClose={onClose} title="Create Club">
  {children}
</Modal>
```

#### Skeleton
```tsx
// Shimmer animation (left-to-right gradient sweep)
// Variants: text | avatar | card | bar
// Used on every async component

<Skeleton variant="card" className="h-48" />
```

#### EmptyState
```tsx
// Animated SVG illustration + heading + description + CTA button
// Every feed/section has its own empty state defined

<EmptyState
  illustration="no-clubs"
  title="No clubs joined yet"
  description="Discover communities and join the ones that interest you"
  action={{ label: "Browse Clubs", href: "/clubs" }}
/>
```

### Feature Component Patterns

#### PostCard — Composition Pattern
```
PostCard
├── PostCardHeader (Avatar + AuthorName + ClubBadge + Timestamp)
├── PostCardContent (Title + RichText preview + tags)
├── PostCardMedia (Image grid — 1, 2, 3, 4+ layouts)
└── PostCardActions (Save button + Report button + expand)
```

#### PollCard — State Machine Pattern
```
PollCard manages internal state:
  'voting' → show options, allow selection
  'submitting' → loading on selected option
  'voted' → show animated result bars
  'expired' → show final results, disabled

All transitions animated with Framer Motion AnimatePresence
```

#### JoinButton — State Machine Pattern
```
States: 'idle' | 'joining' | 'pending' | 'joined' | 'rejected'
Transitions triggered by API calls
Visual: color + label + icon changes per state
```

#### InfiniteScroll — Hook Pattern
```tsx
// useInfiniteScroll hook wraps TanStack Query's useInfiniteQuery
// Intersection Observer triggers next page load
// Skeleton cards shown during next page fetch

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = 
  useInfiniteScroll('/api/v1/posts', { clubId })
```

---

## 9. STATE MANAGEMENT STRATEGY

### Zustand — Global Client State
```ts
// Three stores only. Keep it lean.

// 1. auth.store.ts
interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

// 2. notifications.store.ts
interface NotificationStore {
  unreadCount: number
  setUnreadCount: (count: number) => void
  decrementUnread: () => void
  resetUnread: () => void
}

// 3. ui.store.ts
interface UIStore {
  activeModal: string | null
  modalData: Record<string, unknown>
  openModal: (name: string, data?: unknown) => void
  closeModal: () => void
  toasts: Toast[]
  addToast: (toast: Toast) => void
  removeToast: (id: string) => void
}
```

### TanStack Query — Server State
```ts
// Query key factory pattern for cache invalidation clarity

export const queryKeys = {
  clubs: {
    all: ['clubs'] as const,
    list: (filters?: ClubFilters) => ['clubs', 'list', filters] as const,
    detail: (slug: string) => ['clubs', 'detail', slug] as const,
    members: (clubId: string) => ['clubs', 'members', clubId] as const,
  },
  posts: {
    all: ['posts'] as const,
    feed: (clubId?: string) => ['posts', 'feed', clubId] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
  },
  polls: {
    all: ['polls'] as const,
    detail: (id: string) => ['polls', 'detail', id] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    unreadCount: ['notifications', 'unread-count'] as const,
  },
}

// On mutation success, invalidate relevant queries:
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: queryKeys.posts.feed(clubId) })
}
```

### State Ownership Rules
| State Type | Owner | Examples |
|---|---|---|
| Server data | TanStack Query | Posts, clubs, polls, events |
| Auth session | Zustand auth store | User object, isAuthenticated |
| Notification badge | Zustand notifications store | unreadCount |
| Modal state | Zustand UI store | Which modal is open |
| Form state | React Hook Form | Field values, validation errors |
| Animation state | Local useState | Hover, focus, expanded |
| Recent searches | localStorage | Search history |

---

## 10. ANIMATION STRATEGY

### Animation Library Responsibility Split
```
Framer Motion:
├── Page transitions (layout animations)
├── Modal enter/exit (AnimatePresence)
├── Feed card entry (staggerChildren)
├── Poll result bars (width animation)
├── Button micro-interactions
├── Notification badge pulse
├── Skeleton to content transitions
└── All component-level animations

GSAP + ScrollTrigger:
├── Hero section scroll parallax
├── Stats counter animations
├── Scroll-pinned sequences (club showcase)
└── Complex multi-step scroll reveals

React Three Fiber (Three.js):
├── Home page hero background ONLY
├── Particle field ambient animation
├── Floating geometric orbs
└── NEVER inside feeds or cards
```

### Motion Variant Library (`lib/motion.ts`)
```ts
// Centralized — prevents inconsistency across components

export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
  transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
}

export const staggerContainer = {
  animate: { transition: { staggerChildren: 0.08 } }
}

export const cardHover = {
  whileHover: { y: -4, scale: 1.01 },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
}

export const modalVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.25 } },
  exit:    { opacity: 0, scale: 0.97, y: 10 }
}

export const pollBarVariants = {
  initial: { width: '0%' },
  animate: (pct: number) => ({
    width: `${pct}%`,
    transition: { duration: 0.8, ease: 'easeOut', delay: 0.2 }
  })
}

export const glowPulse = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(99, 102, 241, 0)',
      '0 0 20px rgba(99, 102, 241, 0.4)',
      '0 0 0px rgba(99, 102, 241, 0)'
    ],
    transition: { duration: 2, repeat: Infinity }
  }
}
```

### Performance Guardrails
- `will-change: transform` only on actively animating elements
- `transform` and `opacity` only — never animate `width/height/top/left`
- 3D scenes use `<Suspense>` + lazy loading
- `prefers-reduced-motion` media query respected via Framer Motion's `useReducedMotion()`
- No animations inside virtualized lists
- GSAP ScrollTrigger instances cleaned up in `useEffect` return

---

## 11. DEPLOYMENT STRATEGY

### Infrastructure Map
```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                    (Browser / PWA)                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                       │
│              Next.js 16 — Edge + Serverless                 │
│         CDN: Vercel Edge Network (global)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │ API calls
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY (Backend)                        │
│              Express.js — Node.js 20 LTS                    │
│              Auto-scaling container                         │
└───────────┬───────────────────────────┬────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────┐       ┌───────────────────────┐
│  PostgreSQL       │       │    CLOUDINARY          │
│  (Railway)        │       │    Media CDN           │
│  Managed DB       │       │    Image transforms     │
└───────────────────┘       └───────────────────────┘
```

### Environment Variables Structure
```bash
# apps/api/.env
DATABASE_URL="postgresql://..."
JWT_ACCESS_SECRET="..."
JWT_REFRESH_SECRET="..."
JWT_ACCESS_EXPIRES="15m"
JWT_REFRESH_EXPIRES="7d"
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CORS_ORIGIN="https://ecampusbuzz.vercel.app"
NODE_ENV="production"
PORT=8080

# apps/web/.env.local
NEXT_PUBLIC_API_URL="https://api.ecampusbuzz.railway.app/api/v1"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
```

### CI/CD Pipeline (GitHub Actions)
```yaml
# On PR → main:
1. npm ci (all workspaces)
2. TypeScript check (tsc --noEmit)
3. ESLint
4. Prisma validate
5. Unit tests (if any)

# On merge to main:
1. Deploy frontend → Vercel (automatic via Vercel Git integration)
2. Deploy backend → Railway (via railway up)
3. Run Prisma migrations (prisma migrate deploy)
```

### Branch Strategy
```
main          ← production (protected)
dev           ← integration branch
feature/*     ← individual features
fix/*         ← bug fixes
```

---

## 12. CURSOR-READY IMPLEMENTATION SEQUENCE

> Use this as your step-by-step prompt sequence for Cursor AI.
> Each block is one Cursor session. Do not skip steps.

---

### SEQUENCE 1 — Monorepo Bootstrap
```
TASK: Initialize Turborepo monorepo with two apps: 'web' (Next.js 16, TypeScript, 
Tailwind CSS v4, App Router) and 'api' (Express.js, TypeScript). Add a shared 
'packages/types' workspace. Configure turbo.json for build and dev pipelines. 
Set up ESLint + Prettier + Husky pre-commit hooks across all packages.
Do not add any features yet. Only infrastructure.
```

### SEQUENCE 2 — Design Token System
```
TASK: In apps/web, configure tailwind.config.ts with the ECAMPUS Buzz design 
token system: custom colors (buzz-black #080B12, buzz-surface #0E1420, 
buzz-border #1C2333, buzz-primary #6366F1, buzz-accent #22D3EE), 
custom fonts (Clash Display for display, Geist for body), custom border radius 
(card: 16px, modal: 24px). Import fonts from next/font. Create 
src/lib/motion.ts with Framer Motion variant library 
(fadeInUp, staggerContainer, cardHover, modalVariants, pollBarVariants).
Install Framer Motion and Lucide React.
```

### SEQUENCE 3 — Database + Prisma Setup
```
TASK: In apps/api/prisma/schema.prisma, implement the full Prisma schema for 
ECAMPUS Buzz including all enums (UserRole, ClubVisibility, MembershipStatus, 
MembershipRole, ReportTargetType, ReportReason, ReportStatus, SavedItemType, 
NotificationType) and all models (User, Club, ClubMembership, Post, Poll, 
PollVote, Event, EventRSVP, Notification, Report, SavedItem) with all 
relations and constraints. Run prisma migrate dev --name init. 
Create prisma/seed.ts with sample data (2 clubs, 3 users, 5 posts).
```

### SEQUENCE 4 — Backend Core Infrastructure
```
TASK: In apps/api/src, create the Express app with: helmet, cors, compression, 
express.json middleware. Create lib/prisma.ts (singleton client), lib/jwt.ts 
(signAccessToken, signRefreshToken, verifyToken helpers), lib/logger.ts 
(Winston with timestamps). Create middleware/auth.middleware.ts (JWT verification, 
attaches req.user). Create middleware/rbac.middleware.ts (requireRole factory). 
Create middleware/validate.middleware.ts (Zod schema validation). 
Create middleware/errorHandler.middleware.ts (global error handler with 
consistent error envelope). Mount all middleware on app.ts.
```

### SEQUENCE 5 — Auth Module (Backend)
```
TASK: In apps/api/src/modules/auth, implement: auth.schema.ts (Zod schemas for 
register and login), auth.service.ts (register with bcrypt hash, login with 
bcrypt compare, token generation), auth.controller.ts (register, login, logout, 
refresh, getMe handlers), auth.router.ts (POST /register, POST /login, 
POST /logout, POST /refresh, GET /me). Apply rate limiting on register (10/hr) 
and login (20/hr). getMe requires JWT middleware.
```

### SEQUENCE 6 — Auth UI (Frontend)
```
TASK: In apps/web, create: src/lib/api.ts (Axios instance with base URL, 
request interceptor to attach JWT, response interceptor to handle 401). 
Create src/stores/auth.store.ts (Zustand store with user, isAuthenticated, 
login, logout, updateUser). Create the (auth) layout with dark centered design.
Create /login page with animated form (email, password, submit). 
Create /register page with animated form (name, email, password). 
Wire up React Hook Form + Zod validation. On success, store token and redirect.
Create Next.js middleware (middleware.ts) for route protection.
```

### SEQUENCE 7 — App Shell + Layout
```
TASK: Create the (app) layout with AppShell component. AppShell contains: 
Navbar (desktop top nav: logo, nav links, notification bell, avatar) + 
BottomNav (mobile: icons for Home, Clubs, Events, Polls, Profile). 
BottomNav fixed at bottom on mobile, hidden on desktop. 
Navbar hidden on mobile, shown on desktop. Apply glassmorphism style to both 
(backdrop-blur, bg-buzz-surface/80, border-buzz-border). 
Animate Navbar entrance with Framer Motion fadeInDown. Create ui/Button, 
ui/Card, ui/Avatar, ui/Badge, ui/Skeleton, ui/EmptyState base components.
```

### SEQUENCE 8 — Clubs Module (Backend)
```
TASK: Implement the full Clubs module in apps/api/src/modules/clubs.
clubs.schema.ts: Zod schemas for createClub, updateClub, joinClub, memberUpdate.
clubs.service.ts: createClub (with slug generation), getClubs (paginated, 
searchable), getClubBySlug, updateClub, deleteClub, joinClub (public = 
instantly approved, private = pending), requestJoin, getMembers, 
updateMember (approve/reject/promote/remove), handleLastAdminEdgeCase.
clubs.controller.ts + clubs.router.ts: all routes as per API table.
Trigger notifications on: join approved, join rejected, member promoted, member removed.
```

### SEQUENCE 9 — Clubs UI (Frontend)
```
TASK: Build the clubs frontend. 
/clubs page: Club directory with search input (debounced, 300ms), 
filter by public/private, animated ClubCard grid (stagger entrance). 
ClubCard: cover image, logo, name, member count, tags, join button.
/clubs/[slug] page: SSR. ClubHeader (full-width cover, overlapping logo circle, 
name, description, tag pills, member count, JoinButton state machine). 
ClubFeedTabs (Posts | Events | Polls | Members) — tab content switches 
with AnimatePresence. JoinButton: states idle/joining/pending/joined/rejected 
with Framer Motion transitions between states.
CreateClubModal: accessible modal with logo upload, cover upload, name, 
description, tags, visibility toggle.
```

### SEQUENCE 10 — Posts Module (Full Stack)
```
TASK: Backend: posts module (service, controller, router, schema). 
GET /posts supports clubId filter and cursor pagination. 
POST /posts validates rich text content (sanitize HTML). 
Cloudinary upload endpoint (POST /uploads/image) — multer + cloudinary.uploader.upload. 
Frontend: PostCard component (header with author/club/time, rich text preview, 
image grid up to 4 with +N overflow indicator, save button, report trigger). 
CreatePostModal with Tiptap rich text editor, react-dropzone for images 
(max 5, jpg/png/webp, preview thumbnails). 
useInfiniteScroll hook wrapping TanStack Query's useInfiniteQuery.
PostFeed with Framer Motion staggerChildren.
```

### SEQUENCE 11 — Polls Module (Full Stack)
```
TASK: Backend: polls module. POST /polls validates 2-5 unique options, 
optional expiresAt. POST /polls/:id/vote — idempotent (return existing vote 
if already voted), reject if expired, DB-level unique constraint. 
GET /polls/:id returns options with vote counts and whether current user voted.
Frontend: PollCard with three animated states using AnimatePresence:
1. VOTING: radio-style option buttons, animated selection ring, submit button.
2. VOTED/RESULT: animated progress bars (Framer Motion width: 0 → pct%), 
   percentage labels, vote counts, winner highlighted with buzz-accent glow.
3. EXPIRED: same as result but with "Poll Ended" badge, all interactions disabled.
CreatePollModal: question input, dynamic option fields (add/remove, 2-5), 
date/time picker for expiry.
```

### SEQUENCE 12 — Events Module (Full Stack)
```
TASK: Backend: events module. CRUD + RSVP endpoints. 
RSVP is a toggle (POST to RSVP, DELETE to cancel). 
Frontend: EventCard (date badge, title, location pill, RSVP button with count). 
/events page: upcoming events sorted by date, past events collapsed. 
CreateEventModal: title, description, date picker, location input. 
Save event to saved items.
```

### SEQUENCE 13 — Notifications Module (Full Stack)
```
TASK: Backend: Notification triggers already placed in clubs/posts/polls services. 
Now build: GET /notifications (paginated, newest first). 
PATCH /notifications/:id/read. PATCH /notifications/read-all. 
GET /notifications/unread-count.
Frontend: NotificationBell in Navbar — animated badge with buzz-danger background 
showing unread count, pulses when new notifications arrive. 
Poll unread count every 30 seconds (setInterval + refetch on window focus). 
/notifications page: list of NotificationItem components with 
icon-by-type, message, timestamp, unread indicator dot. Mark as read on click.
```

### SEQUENCE 14 — Search + Reporting + Saved (Full Stack)
```
TASK: 
SEARCH: Backend GET /search with full-text PostgreSQL search across clubs, posts, tags. 
Frontend: SearchBar component in Navbar (expand on focus, debounced 300ms), 
SearchSuggestions dropdown (club results + post results), recent searches in localStorage.

REPORTING: ReportModal (target type auto-detected, reason dropdown, notes textarea). 
POST /reports. Admin: GET /reports with status filter, PATCH /reports/:id (resolve/reject).

SAVED: POST /saves, DELETE /saves/:id, GET /saves?type=post|poll|event. 
/saved page with tabs. Save/unsave toggle on PostCard, PollCard, EventCard.
```

### SEQUENCE 15 — Activity Feed + Home Page
```
TASK: 
Backend: GET /feed — aggregated cursor-paginated query of posts + polls + events 
from all clubs the authenticated user has APPROVED membership in. 
Sorted by createdAt DESC. Returns typed union items with a 'contentType' discriminator.
Frontend: Home page (/) — ActivityFeed component with InfiniteScroll. 
FeedItem renders the correct card type based on contentType. 
Empty state when user has joined no clubs (animated illustration + 
"Explore Clubs" CTA button). Smooth animated entry for each item 
(fadeInUp with stagger as items load).
```

### SEQUENCE 16 — Admin Dashboard
```
TASK: /admin route — Super Admin only (enforced by RBAC middleware + Next.js middleware). 
Admin layout with sidebar (Reports, Users, Platform Stats). 
Reports page: table of pending reports (target type badge, reason, reporter, date, actions). 
Actions: Resolve (remove content), Reject (dismiss), Warn user. 
Users page: user list with suspend/unsuspend toggle. 
Stats page: cards showing total users, total clubs, total posts, total polls, 
reports pending. All data from /admin/stats API.
```

### SEQUENCE 17 — 3D Hero + Polish
```
TASK: 
3D HERO: On home page, add a React Three Fiber canvas as background behind the 
feed header. ParticleField component: 200 small floating particles with 
gentle drift animation. FloatingOrbs: 3-5 semi-transparent geometric spheres 
with ambient rotation. Lazy-loaded with <Suspense fallback={null}>. 
Disabled on mobile (useMediaQuery). Canvas pointer-events: none so it never 
blocks interaction.

POLISH: Add skeleton loaders to all async content (match the shape of real content). 
Add EmptyState components with SVG illustrations to every empty scenario. 
Add toast system (Zustand ui.store + fixed-position toast container, 
Framer Motion AnimatePresence for enter/exit). 
Audit all forms for error states (red border, error message below field). 
Add 404 page (animated). Add loading.tsx files to all route segments.
```

### SEQUENCE 18 — Performance + Security Audit
```
TASK:
PERFORMANCE:
- Audit all images: replace <img> with next/image, add sizes prop.
- Add dynamic imports for heavy components (RichTextEditor, 3D Canvas).
- Verify all feeds use cursor pagination, not offset.
- Add React Query staleTime and gcTime configuration.
- Verify IntersectionObserver cleanup in useEffect returns.

SECURITY:
- Add express-rate-limit to all mutation endpoints.
- Verify all user inputs sanitized (DOMPurify on rich text display).
- Add helmet() with strict CSP headers.
- Add input length limits to all Zod schemas.
- Verify CORS allows only production frontend origin.
- Verify all file uploads validate MIME type + size before Cloudinary.
- Ensure poll vote endpoint is idempotent at DB level (unique constraint).
- Add CSRF protection.
```

### SEQUENCE 19 — Deployment
```
TASK:
FRONTEND: Connect GitHub repo to Vercel. Set environment variables. 
Configure next.config.ts: images remotePatterns for Cloudinary + Railway domain. 
Add security headers to next.config.ts (X-Frame-Options, X-Content-Type-Options, 
Referrer-Policy, Permissions-Policy). Deploy. Test in production.

BACKEND: Create Railway project. Add PostgreSQL plugin. Set environment variables. 
Add Procfile: web: node dist/app.js. Configure build command: npm run build. 
Add health check endpoint GET /health. Run prisma migrate deploy in Railway shell. 
Run prisma db seed. Deploy. Test all critical paths in production.

FINAL: Run Lighthouse audit on production. Target 90+ mobile. 
Fix any LCP, CLS, or FCP issues.
```

---

## APPENDIX A — Edge Cases & Business Logic

| Scenario | Handling |
|---|---|
| Last admin tries to leave club | Block leave action, must promote another member first |
| Club deleted with active members | Cascade delete memberships, notify all members |
| Poll vote after expiry | API rejects with 409 CONFLICT — check expiresAt server-side |
| Duplicate poll vote | DB unique constraint `@@unique([pollId, userId])` + API returns existing vote |
| User tries to join club they're already in | API returns 409 with current membership status |
| Unsupported file upload type | Multer fileFilter rejects before upload, 400 error returned |
| File exceeds size limit | Multer limits.fileSize rejects, 413 error returned |
| Notification count very large (99+) | Display "99+" badge, not actual number |
| Admin removed — no admins left | Last admin cannot be removed; promote another first |
| Search returns no results | Animated empty state with "Try different keywords" prompt |

## APPENDIX B — Future-Proofing Architecture Decisions

These decisions are made now to avoid painful refactors later:

1. **UUID primary keys** — avoids enumerable ID attacks, works with distributed systems
2. **Cursor pagination** — infinite scroll works at scale; offset pagination breaks at large offsets
3. **Notification referenceId field** — when realtime is added, notifications link to live entities
4. **ClubMembership as a separate table** — supports future role expansion without schema changes
5. **Modular monolith** — each module is self-contained; extract to microservice by moving the folder
6. **SavedItem as typed join table** — supports future saved types (announcements, files) without new tables
7. **content stored as JSON string in Post** — Tiptap/Slate JSON; renderable in any future editor
8. **NotificationType as enum** — typed triggers, easy to add new types
9. **API versioned at /v1/** — future breaking changes go to /v2/ without breaking existing clients
10. **Zustand over Redux** — smaller bundle, simpler DX; Redux scale-up is possible but not needed at MVP

---

*End of ECAMPUS Buzz Engineering Architecture Document v1.0*
*Total estimated development time: 9–10 weeks (solo) | 4–5 weeks (2-person team)*
