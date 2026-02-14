# Leetcode Clone

Production-ready Leetcode-style platform built with React + TypeScript + Firebase.

## What Is Included

- Firebase email/password auth with:
  - signup
  - signin
  - forgot-password reset flow
- Protected routes and admin route guard
- Firestore-backed problem list
- Difficulty and topic/tag filtering for scalable catalog browsing
- Problem workspace with run/submit, multi-language support, and autosave
- Live leaderboard with rank, score, solved counts, and percentile view
- Activity dashboard with streaks, acceptance rate, heatmap, and recent accepted history
- Admin panel for managing problems/users
- Admin scripts for:
  - promoting a user to admin
  - seeding a starter bank of curated problems (21 included)
  - syncing all Firebase Auth users into Firestore registry
  - rebuilding leaderboard stats from existing submissions

## Project Structure

```text
.
├── frontend/                    # React + Vite client app
│   ├── src/components/auth/     # login/signup/forgot-password pages
│   ├── src/components/          # problems/admin/activity pages
│   └── src/admin-scripts/       # admin utilities + starter problem bank
├── backend/                     # legacy/backend code and cloud functions
├── firestore.rules              # Firestore security rules
├── firebase.json                # Firebase deploy config
└── .firebaserc                  # default Firebase project ID
```

## Prerequisites

- Node.js 18+ (recommended)
- npm
- Firebase CLI (`npm i -g firebase-tools`)
- Firebase project with:
  - Authentication (Email/Password enabled)
  - Firestore Database created

## 1) Configure Frontend Firebase

Create or update:

`frontend/.env`

```env
TSC_COMPILE_ON_ERROR=true
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Important:

- `VITE_FIREBASE_PROJECT_ID` must match `.firebaserc` default project.
- Restart Vite after env changes.

## 2) Install and Run Frontend

```bash
cd frontend
npm install
npm run dev -- --force
```

Open:

`http://localhost:5173`

## 3) Deploy Firestore Rules

From project root:

```bash
firebase login --reauth
firebase use <your-project-id>
FIREBASE_SKIP_UPDATE_CHECK=1 firebase deploy --only firestore:rules
```

## 4) Make First Admin User

1. Sign up once in the UI.
2. Copy that user's UID from Firebase Authentication.
3. Run:

```bash
cd frontend/src/admin-scripts
npm install
node makeAdmin.js <uid>
```

This sets:

- custom claim `admin: true`
- `users/<uid>.isAdmin = true`

## 5) Registered Users Registry (Production)

All users are tracked in Firestore collection `users` and visible in Admin Dashboard -> Users tab with:

- search by email/display name
- admin-only filter
- registration timestamp
- last login timestamp
- email verification status
- user role/status

If you already have users in Firebase Authentication from earlier versions, backfill them into Firestore:

```bash
cd frontend/src/admin-scripts
node syncUsersFromAuth.js
```

## 6) Seed Starter Problem Bank (21 Problems)

The file `frontend/src/admin-scripts/problemBank.json` contains curated, tag-separated problems across Easy/Medium/Hard.

Run:

```bash
cd frontend/src/admin-scripts
node seedProblems.js
```

Notes:

- uses deterministic Firestore doc IDs (`slug`) so reruns are safe (upsert behavior)
- keeps data scalable for future migrations

## Auth Flows

- `/login` -> signin
- `/signup` -> create account + user profile doc in Firestore
- `/forgot-password` -> sends password reset email

## Problem Catalog Behavior

`/problems` now supports:

- grouped sections by difficulty (Easy/Medium/Hard)
- topic filter (Array, String, Graph, etc. from tags)
- search by problem name
- combined filtering (search + difficulty + topic)

## Problem Solving Workspace

Click any problem row to open `/problems/:problemId`.

Workspace includes:

- multi-language code templates
- run and submit controls
- custom input + expected output
- autosave per user/problem/language
- recent submission history for that problem

When user submits, app stores submission in `submissions` and updates `leaderboard/<uid>` metrics.

## Leaderboard and Activity

- `/leaderboard` shows:
  - global rank
  - score (difficulty-weighted)
  - solved count by difficulty
  - acceptance rate
  - current user standing + percentile

- `/activity` shows:
  - submission trend chart (30 days)
  - solved split by difficulty
  - acceptance rate
  - current/longest streak
  - consistency heatmap (12 weeks)
  - recent accepted list

If you already have historical submissions and want instant leaderboard data:

```bash
cd frontend/src/admin-scripts
node rebuildLeaderboard.js
```

## Deployment Checklist

Before deploying:

1. Ensure frontend env values are set for production.
2. Confirm Firebase Auth provider is enabled.
3. Confirm Firestore rules are deployed.
4. Run user sync if migrating existing auth users.
5. Seed starter problems (optional but recommended).
6. Verify admin account access.
7. Run build:

```bash
cd frontend
npm run build
```

## Troubleshooting

- `auth/api-key-not-valid`:
  - wrong project/account
  - outdated API key
  - Vite not restarted after `.env` changes
- `Missing or insufficient permissions`:
  - rules not deployed to same Firebase project
  - signed-in user lacks required access
- Forgot password not delivering email:
  - check spam folder
  - verify user exists

## Security Notes

- Never commit real production `.env` secrets.
- Keep service account JSON private and out of public repos.
- Use separate Firebase projects for dev and prod.
