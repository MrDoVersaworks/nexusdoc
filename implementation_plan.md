# NexusDoc — AI Document Intelligence Platform
# Complete Implementation Plan

> **Status:** AWAITING USER APPROVAL — No code will be written until approved.
> **Project:** 1 of 5 | **AI Provider:** Google Gemini (user-configured)

---

## 1. PROJECT OVERVIEW

NexusDoc is a full-stack AI-powered document intelligence platform. Users upload documents (PDFs, text files), the system uses the Google Gemini API to extract summaries and key insights, and enables natural-language semantic search across all uploaded documents. A personal AI research assistant.

**What It Proves:** AI API integration, file handling, semantic search, encryption, clean architecture.

---

## 2. TECH STACK

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Next.js (App Router) | 14+ |
| Frontend Language | TypeScript | 5.x |
| Frontend Styling | Vanilla CSS | — |
| Backend Runtime | Node.js | 20+ |
| Backend Framework | Express | 4.x |
| Backend Language | TypeScript | 5.x |
| ORM | Drizzle ORM | Latest |
| Database | PostgreSQL (Neon) | 16 |
| AI Provider | Google Gemini (`@google/generative-ai`) | Latest |
| File Storage | Vercel Blob | Latest |
| Auth | JWT (access + refresh), bcrypt, httpOnly cookies | — |
| Validation | Zod | Latest |
| Encryption | AES-256-GCM (for user API keys) | Node crypto |
| Toast Notifications | sonner | Latest |
| Deployment (FE) | Vercel | — |
| Deployment (BE) | Render | — |

---

## 3. ENVIRONMENT VARIABLES

### Backend `.env`

```env
# Database
DATABASE_URL=                    # Neon PostgreSQL connection string

# Auth
JWT_ACCESS_SECRET=               # Secret for signing access tokens (15min)
JWT_REFRESH_SECRET=              # Secret for signing refresh tokens (7d)

# Encryption
AES_ENCRYPTION_KEY=              # 64-character hex string (32 bytes) for AES-256-GCM encryption of user API keys

# File Storage
BLOB_READ_WRITE_TOKEN=           # Vercel Blob storage token

# Server
PORT=4000                        # Express server port
NODE_ENV=development             # development | production
CORS_ORIGIN=http://localhost:3000  # Frontend URL (changes per environment)
```

### Frontend `.env`

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:4000  # Backend URL (changes per environment)
```

> **NOTE:** No Gemini API key or model name in `.env`. Users provide these through the Settings UI. They are AES-256-GCM encrypted (API key) or stored plain (model name) in the database.

---

## 4. DATABASE SCHEMA

### Table: `users`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | User ID |
| email | varchar(255) | UNIQUE, NOT NULL | User email |
| password_hash | varchar(255) | NOT NULL | bcrypt hash |
| name | varchar(100) | NOT NULL | Display name |
| encrypted_gemini_key | text | NULLABLE | AES-256-GCM encrypted Gemini API key |
| gemini_key_iv | varchar(24) | NULLABLE | 12-byte IV in hex (24 hex chars) for AES-256-GCM |
| gemini_key_tag | varchar(32) | NULLABLE | 16-byte auth tag in hex (32 hex chars) for AES-256-GCM |
| gemini_model | varchar(100) | NULLABLE, default null | User's preferred Gemini generation model (e.g. gemini-2.5-flash) |
| gemini_embedding_model | varchar(100) | NULLABLE, default null | User's preferred Gemini embedding model (e.g. text-embedding-004) |
| created_at | timestamp | NOT NULL, default now() | Account creation |
| updated_at | timestamp | NOT NULL, default now() | Last update |

### Table: `refresh_tokens`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Token ID |
| user_id | uuid | FK → users.id, NOT NULL | Owner |
| token_hash | varchar(255) | NOT NULL | bcrypt hash of refresh token |
| expires_at | timestamp | NOT NULL | Expiration (7 days from issue) |
| created_at | timestamp | NOT NULL, default now() | Issue time |
| updated_at | timestamp | NOT NULL, default now() | Last update |

### Table: `documents`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Document ID |
| user_id | uuid | FK → users.id, NOT NULL | Owner (multi-tenancy) |
| title | varchar(255) | NOT NULL | User-editable title |
| original_filename | varchar(255) | NOT NULL | Original uploaded filename |
| file_url | text | NOT NULL | Vercel Blob storage URL |
| file_type | varchar(50) | NOT NULL | MIME type (application/pdf, text/plain) |
| file_size_bytes | integer | NOT NULL | File size for display |
| content_text | text | NOT NULL | Extracted plain text content |
| ai_summary | text | NULLABLE | Gemini-generated summary |
| created_at | timestamp | NOT NULL, default now() | Upload time |
| updated_at | timestamp | NOT NULL, default now() | Last update |

### Table: `document_chunks`
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | Chunk ID |
| document_id | uuid | FK → documents.id, NOT NULL | Parent document |
| user_id | uuid | FK → users.id, NOT NULL | Owner (multi-tenancy scoping) |
| chunk_text | text | NOT NULL | ~500 token text chunk |
| embedding | vector(768) | NOT NULL | Gemini embedding vector (768-dim for text-embedding-004) |
| chunk_index | integer | NOT NULL | Order position in document |
| created_at | timestamp | NOT NULL, default now() | Creation time |
| updated_at | timestamp | NOT NULL, default now() | Last update |

---

## 5. API ENDPOINT MAP

### Auth Routes (`/api/auth`)

| Method | Path | Auth | Request Body | Response | Purpose |
|--------|------|------|-------------|----------|---------|
| POST | /api/auth/register | No | `{ email, password, name }` | `{ success, data: { user } }` | Create account |
| POST | /api/auth/login | No | `{ email, password }` | `{ success, data: { accessToken, user } }` + httpOnly refresh cookie | Login |
| POST | /api/auth/logout | Yes | — | `{ success, data: null }` | Clear refresh cookie, invalidate token |
| POST | /api/auth/refresh | Cookie | — (reads httpOnly cookie) | `{ success, data: { accessToken } }` | Refresh access token |
| DELETE | /api/auth/account | Yes | `{ password }` | `{ success, data: null }` | Delete account + cascade all data |

### Document Routes (`/api/documents`)

| Method | Path | Auth | Request Body | Response | Purpose |
|--------|------|------|-------------|----------|---------|
| GET | /api/documents | Yes | Query: `?page=1&limit=10&sort=created_at&order=desc` | `{ success, data: documents[], pagination }` | List user's documents (paginated) |
| POST | /api/documents | Yes | multipart/form-data: `file`, `title` | `{ success, data: { document } }` | Upload + extract text + AI summarize + chunk + embed |
| GET | /api/documents/:id | Yes | — | `{ success, data: { document } }` | Get single document with full details |
| DELETE | /api/documents/:id | Yes | — | `{ success, data: null }` | Delete document + file + chunks |
| POST | /api/documents/search | Yes | `{ query }` | `{ success, data: { results[] } }` | Semantic search across user's documents |

### Settings Routes (`/api/settings`)

| Method | Path | Auth | Request Body | Response | Purpose |
|--------|------|------|-------------|----------|---------|
| GET | /api/settings/ai | Yes | — | `{ success, data: { hasApiKey, geminiModel, geminiEmbeddingModel } }` | Check if user has API key configured + current models |
| PUT | /api/settings/ai | Yes | `{ geminiApiKey?, geminiModel, geminiEmbeddingModel }` | `{ success, data: { hasApiKey, geminiModel, geminiEmbeddingModel } }` | Save/update encrypted API key + model preferences |
| DELETE | /api/settings/ai-key | Yes | — | `{ success, data: null }` | Delete stored API key |

### Health Route

| Method | Path | Auth | Response | Purpose |
|--------|------|------|----------|---------|
| GET | /health | No | `{ status: 'ok' }` | Deployment health check |

---

## 6. DATA FLOWS

### Flow 1: Document Upload + AI Processing
```
User uploads file (frontend form)
  → multipart/form-data POST /api/documents
  → Auth middleware extracts userId from JWT
  → Validation middleware (Zod: file type, file size)
  → Upload file to Vercel Blob → get file_url
  → Extract text from file (PDF: pdf-parse, TXT: read directly)
  → Decrypt user's Gemini API key from DB (AES-256-GCM)
  → If no API key configured → save document WITHOUT summary, return warning
  → Send text to Gemini → receive AI summary
  → Split text into ~500-token chunks
  → Send each chunk to Gemini embedding API → receive 768-dim vectors
  → DB Transaction:
      INSERT document (with ai_summary)
      INSERT all document_chunks (with embeddings)
  → Return complete document to frontend
```

### Flow 2: Semantic Search
```
User types natural language query (frontend search bar)
  → POST /api/documents/search { query }
  → Auth middleware extracts userId
  → Decrypt user's Gemini API key from DB
  → If no API key → return error "Configure your API key in Settings"
  → Embed the query via Gemini embedding API → 768-dim vector
  → pgvector cosine similarity search on document_chunks WHERE user_id = userId
  → Return top N matching chunks with parent document info
  → Frontend displays results with document titles and relevant excerpts
```

### Flow 3: API Key + Model Configuration
```
User navigates to Settings page
  → GET /api/settings/ai → shows if key exists + current generation model + current embedding model
  → User enters:
      • Gemini API key (password-masked input)
      • Generation model name (e.g. gemini-2.5-flash)
      • Embedding model name (e.g. text-embedding-004)
  → PUT /api/settings/ai { geminiApiKey, geminiModel, geminiEmbeddingModel }
  → Backend validates all fields are non-empty strings
  → AES-256-GCM encrypt the API key:
      Generate random 12-byte IV
      Encrypt with AES_ENCRYPTION_KEY from .env
      Store: encrypted_gemini_key, gemini_key_iv, gemini_key_tag in users table
  → Store gemini_model and gemini_embedding_model as plain text in users table
  → Return confirmation (never return the key back)
```

> **IMPORTANT:** If a user changes their embedding model after uploading documents, existing embeddings become incompatible. The system must detect this mismatch and warn the user that existing documents need re-embedding, or reject the change until documents are re-processed.

### Flow 4: Account Deletion Cascade
```
User clicks "Delete Account" → confirmation dialog with password input
  → DELETE /api/auth/account { password }
  → Auth middleware extracts userId
  → Verify password against stored hash
  → DB Transaction:
      DELETE FROM document_chunks WHERE user_id = userId
      DELETE FROM documents WHERE user_id = userId (Vercel Blob cleanup per file)
      DELETE FROM refresh_tokens WHERE user_id = userId
      DELETE FROM users WHERE id = userId
  → Clear httpOnly cookie
  → Return success
```

---

## 7. COMPLETE DIRECTORY STRUCTURE

```
nexusdoc/
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout: font loading, Toaster, AuthProvider
│   │   │   ├── page.tsx                    # Landing page (public)
│   │   │   ├── globals.css                 # CSS reset + design tokens + global styles
│   │   │   ├── (auth)/
│   │   │   │   ├── login/
│   │   │   │   │   └── page.tsx            # Login page
│   │   │   │   └── register/
│   │   │   │       └── page.tsx            # Registration page
│   │   │   └── (dashboard)/
│   │   │       ├── layout.tsx              # Dashboard layout: sidebar, topbar, auth guard
│   │   │       ├── dashboard/
│   │   │       │   └── page.tsx            # Main dashboard: document library + search
│   │   │       ├── documents/
│   │   │       │   ├── page.tsx            # Document list (redirect to dashboard)
│   │   │       │   ├── upload/
│   │   │       │   │   └── page.tsx        # Upload document page
│   │   │       │   └── [id]/
│   │   │       │       └── page.tsx        # Single document view (summary, content, metadata)
│   │   │       ├── search/
│   │   │       │   └── page.tsx            # Semantic search results page
│   │   │       └── settings/
│   │   │           └── page.tsx            # AI settings (API key, model) + account management
│   │   ├── components/
│   │   │   ├── shared/
│   │   │   │   ├── Button.tsx              # Reusable button (variants: primary, secondary, danger, ghost)
│   │   │   │   ├── Input.tsx               # Reusable input field with label + error state
│   │   │   │   ├── Modal.tsx               # Reusable modal dialog (for confirmations)
│   │   │   │   ├── Spinner.tsx             # Loading spinner
│   │   │   │   ├── Skeleton.tsx            # Skeleton loader for content placeholders
│   │   │   │   ├── EmptyState.tsx          # Empty state with message + CTA
│   │   │   │   ├── ErrorState.tsx          # Error state with message + retry button
│   │   │   │   └── PageHeader.tsx          # Page title + description + optional action button
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx           # Login form with validation
│   │   │   │   └── RegisterForm.tsx        # Registration form with validation
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx             # Dashboard sidebar navigation
│   │   │   │   ├── Topbar.tsx              # Top bar with user menu + mobile toggle
│   │   │   │   └── MobileNav.tsx           # Mobile slide-out navigation
│   │   │   ├── documents/
│   │   │   │   ├── DocumentCard.tsx        # Document preview card (title, date, summary snippet)
│   │   │   │   ├── DocumentGrid.tsx        # Grid of DocumentCards with pagination
│   │   │   │   ├── DocumentUploadForm.tsx  # File upload form with drag-and-drop
│   │   │   │   ├── DocumentDetail.tsx      # Full document view (summary, content, metadata)
│   │   │   │   └── DocumentDeleteDialog.tsx # Confirmation dialog for document deletion
│   │   │   ├── search/
│   │   │   │   ├── SearchBar.tsx           # Search input with submit
│   │   │   │   └── SearchResultCard.tsx    # Search result with relevance, excerpt, source doc
│   │   │   └── settings/
│   │   │       ├── AISettingsForm.tsx       # Gemini API key + model config form
│   │   │       ├── AccountDangerZone.tsx    # Delete account section with confirmation
│   │   │       └── ApiKeyStatus.tsx         # Shows if API key is configured (never shows the key)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts                  # Auth context hook (login, logout, user state, token refresh)
│   │   │   ├── useDocuments.ts             # Document CRUD operations hook
│   │   │   ├── useSearch.ts                # Semantic search hook
│   │   │   └── useSettings.ts              # AI settings CRUD hook
│   │   ├── lib/
│   │   │   ├── api.ts                      # Centralized API client (fetch wrapper with auth, token refresh)
│   │   │   └── utils.ts                    # Formatting helpers (dates, file sizes, truncation)
│   │   ├── types/
│   │   │   └── index.ts                    # All TypeScript interfaces (User, Document, SearchResult, ApiResponse, etc.)
│   │   ├── constants/
│   │   │   └── index.ts                    # Frontend constants (file size limits, accepted types, pagination defaults)
│   │   └── context/
│   │       └── AuthContext.tsx              # React context for auth state + token management
│   ├── public/
│   │   └── favicon.ico                     # App favicon
│   ├── .env.example                        # Frontend env template
│   ├── next.config.js                      # Next.js configuration
│   ├── tsconfig.json                       # TypeScript config (strict: true)
│   └── package.json                        # Frontend dependencies
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.ts                    # Reads ALL env vars, validates on startup, exports typed config
│   │   ├── db/
│   │   │   ├── connection.ts               # Neon/Drizzle database connection
│   │   │   ├── schema.ts                   # Drizzle table definitions (users, documents, document_chunks, refresh_tokens)
│   │   │   └── migrate.ts                  # Migration runner script
│   │   ├── middleware/
│   │   │   ├── auth.ts                     # JWT verification middleware (extracts userId)
│   │   │   ├── errorHandler.ts             # Global error handler (consistent error shape)
│   │   │   ├── rateLimiter.ts              # Rate limiting on auth endpoints
│   │   │   └── validate.ts                 # Zod validation middleware factory
│   │   ├── routes/
│   │   │   ├── auth.routes.ts              # Auth route definitions
│   │   │   ├── document.routes.ts          # Document route definitions
│   │   │   └── settings.routes.ts          # Settings route definitions
│   │   ├── services/
│   │   │   ├── auth.service.ts             # Auth business logic (register, login, logout, delete, refresh)
│   │   │   ├── document.service.ts         # Document CRUD + file processing logic
│   │   │   ├── ai.service.ts               # Gemini API integration (summarize, embed)
│   │   │   ├── search.service.ts           # Semantic search logic (embed query, pgvector similarity)
│   │   │   ├── encryption.service.ts       # AES-256-GCM encrypt/decrypt for API keys
│   │   │   └── settings.service.ts         # AI settings CRUD (save/read/delete encrypted key + model)
│   │   ├── types/
│   │   │   └── index.ts                    # Backend TypeScript interfaces + Zod schemas
│   │   ├── utils/
│   │   │   ├── textExtractor.ts            # Extract text from PDF/TXT files
│   │   │   ├── chunker.ts                  # Split text into ~500-token chunks
│   │   │   └── logger.ts                   # Dev-only logging utility (gated behind NODE_ENV)
│   │   ├── constants/
│   │   │   └── index.ts                    # Backend constants (file size limits, chunk size, rate limits)
│   │   └── index.ts                        # Express app setup, route mounting, middleware, server start
│   ├── drizzle/                            # Generated migration files (by drizzle-kit)
│   ├── drizzle.config.ts                   # Drizzle Kit configuration
│   ├── .env.example                        # Backend env template
│   ├── tsconfig.json                       # TypeScript config (strict: true)
│   └── package.json                        # Backend dependencies
└── README.md                              # Project documentation
```

---

## 8. FRONTEND PAGES & COMPONENTS

### Pages

| Route | Page File | Auth Required | Purpose |
|-------|-----------|--------------|---------|
| `/` | `app/page.tsx` | No | Public landing page — hero, features, CTA to register |
| `/login` | `app/(auth)/login/page.tsx` | No (redirect if authed) | Login form |
| `/register` | `app/(auth)/register/page.tsx` | No (redirect if authed) | Registration form |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | Yes | Document library, search bar, stats |
| `/documents/upload` | `app/(dashboard)/documents/upload/page.tsx` | Yes | Upload new document |
| `/documents/[id]` | `app/(dashboard)/documents/[id]/page.tsx` | Yes | View single document details + AI summary |
| `/search` | `app/(dashboard)/search/page.tsx` | Yes | Semantic search results |
| `/settings` | `app/(dashboard)/settings/page.tsx` | Yes | AI config (API key, model) + account danger zone |

### Three-State Pattern (Every Data Component)
1. **Loading** → Skeleton/Spinner
2. **Success** → Data rendered
3. **Error** → Error message + retry button

### Empty State Pattern
- No documents yet → "Upload your first document" with upload CTA
- No search results → "No results found. Try a different query."
- No API key configured → "Configure your Gemini API key in Settings to enable AI features" with link to Settings

---

## 9. VERIFICATION PLAN

### Automated Checks
- `npx tsc --noEmit` after every TypeScript file creation/modification
- `npm run build` after completing each major section (backend, frontend)
- Drizzle migration generation and application verified against Neon

### Browser Verification (Performed by AI Agent)
The AI agent will verify the following using the browser tool at three viewports (mobile 375px, tablet 768px, desktop 1440px):
- All pages render correctly — no overflow, no clipping, no horizontal scroll
- Auth flow: register → login → dashboard → logout → redirect
- Document upload → AI summary appears → document visible in library
- Semantic search returns relevant results
- Settings: API key save → status shows configured → delete key → status shows unconfigured
- Account deletion: confirmation dialog → password required → all data removed → redirect to landing
- Error states: no API key → appropriate warning on upload/search
- Toast notifications fire on success/error actions

### Security Checks
- API key never returned in any API response
- API key never visible in frontend state/console
- Documents scoped to userId — cannot access another user's documents
- Refresh token in httpOnly cookie — not accessible via JavaScript
- Rate limiting active on auth endpoints

### Environment Parity
- `.env` values are the ONLY difference between dev and production — zero code changes required
- CORS_ORIGIN reads from `.env` — dev uses `http://localhost:3000`, production uses the Vercel domain
- NEXT_PUBLIC_API_URL reads from `.env` — dev uses `http://localhost:4000`, production uses the Render URL
- All deployment platforms (Vercel, Render) set env vars via their dashboards — no manual file editing on servers
