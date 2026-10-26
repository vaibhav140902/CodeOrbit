# CodeOrbit

CodeOrbit is being rebuilt into a secure company-first coding prep platform.

The new stack lives in the monorepo root and preserves the current live design while moving data access behind authenticated Cloud Functions.

## Workspace Layout

- `apps/web`: Next.js 15 App Router frontend
- `backend/functions`: Firebase Functions v2 backend
- `packages/ui`: shared preserved design system and UI primitives
- `packages/schema`: shared Zod contracts and Supabase schema
- `frontend`: legacy Vite app kept temporarily for reference during migration

## Current Rebuild Status

Secure foundation now includes:

- Firebase Auth wired into the new Next.js app
- optional Firebase App Check client setup
- strict security headers and CSP in the new frontend
- authenticated callable Functions for profile, problems, dashboard, activity, leaderboard, and admin analytics
- Supabase-backed repository layer for published problems and user profiles
- Firestore client access locked down with deny-all rules for the new app flow

- secure submission queue from the new Monaco workspace
- premium-aware problem gating in the problem bank and workspace
- new pricing flow aligned to `Rs 49/month` and `Rs 99 one-time`
- company/topic prep tracks in the Next.js app
- AI problem assist callable endpoints for hint, ELI5, and solver flows
- AI mock interview page with webcam, voice capture, and scorecards
- AI resume builder with PDF export route
- privacy consent banner, Hindi/English toggle, and PWA manifest/service worker

## Local Setup

Use Node `22` for Firebase Functions. The root workspace can run under the installed npm version, but Functions verification is intended for Node `22`.

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the new web app

```bash
cp apps/web/.env.example apps/web/.env.local
```

Fill these values:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION=asia-south2
NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY=
NEXT_PUBLIC_ENABLE_APPCHECK=false
NEXT_PUBLIC_APPCHECK_DEBUG_TOKEN=
NEXT_PUBLIC_USE_FUNCTIONS_EMULATOR=false
NEXT_PUBLIC_FUNCTIONS_EMULATOR_HOST=127.0.0.1
NEXT_PUBLIC_FUNCTIONS_EMULATOR_PORT=5001
```

### 3. Configure Functions

```bash
cp backend/functions/.env.example backend/functions/.env
```

Fill these values:

```bash
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=sk-your-openai-key
OPENAI_MODEL=gpt-4o-mini
GROK_API_KEY=xai-your-grok-key
GROK_MODEL=grok-2-latest
AI_PROVIDER=gemini
MAX_DAILY_FREE_USERS=100
ENFORCE_APPCHECK=false
WEB_ALLOWED_ORIGINS=http://localhost:3000,https://your-app.vercel.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Apply Supabase schema

Run the SQL in:

`packages/schema/supabase/0001_core.sql`

### 5. Start the new app

```bash
npm run dev
```

The new web app runs at [http://localhost:3000](http://localhost:3000).

Run only one Next.js development server at a time. `npm run dev` and `npm run dev:web` both start this app and share `apps/web/.next`; stop the first server before starting the other. If port 3000 is occupied, use the local URL printed by Next.js.

If you only want the Next.js app:

```bash
npm run dev:web
```

## Verification Commands

```bash
npm run lint:web
npm run build:web
```

Functions can be type-checked with:

```bash
cd backend/functions
npm run build
```

Legacy commands are still available while migration continues:

```bash
npm run legacy:frontend
npm run legacy:functions
```

## Security Notes

- The new app does not rely on direct client Firestore reads for platform data.
- Razorpay secrets stay in `backend/functions/.env` only.
- Gemini, OpenAI, and Grok API keys stay in `backend/functions/.env` only.
- Supabase uses server-side service role access inside Functions only.
- Firebase App Check can be enforced per environment.
- `firestore.rules` currently deny all client access for the rebuild flow.

## Deployment Direction

- Frontend target: Vercel
- Auth and storage: Firebase
- Backend logic: Firebase Functions
- extra protected data layer: Supabase

The legacy Firebase Hosting deployment remains online for reference until the new Vercel deployment replaces it.
