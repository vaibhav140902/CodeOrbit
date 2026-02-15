# CodeOrbit - Company-First Coding Prep Platform

CodeOrbit is a production-oriented LeetCode-style app with:
- auth + admin + problem bank
- full coding workspace with multi-language execution
- leaderboard + activity analytics
- topic-wise and company-wise prep tracks
- pricing/subscription UI
- Razorpay payment flow via Firebase Functions
- daily free-pass quota (first 100 users/day)
- deploy configs for Firebase Hosting, Vercel, and Netlify

## 1. Architecture

- Frontend: `frontend/` (React + TypeScript + Vite)
- Backend: `backend/functions/` (Firebase Functions v2)
- Database: Firestore (`users`, `problems`, `submissions`, `leaderboard`, `subscriptions`, `billingOrders`, `dailyAccessQuota`)

## 2. Local Setup

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
```

Fill `frontend/.env`:
```bash
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_FUNCTIONS_REGION=asia-south2
VITE_PISTON_RUNTIMES_URL=https://emkc.org/api/v2/piston/runtimes
VITE_PISTON_EXECUTE_URL=https://emkc.org/api/v2/piston/execute
```

Run:
```bash
npm run dev
```

### Backend Functions
```bash
cd ../backend/functions
npm install
cp .env.example .env
```

Fill `backend/functions/.env`:
```bash
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxx
MAX_DAILY_FREE_USERS=100
```

## 3. Firebase Setup

Use one Firebase project consistently for:
- Firebase Console
- root `.firebaserc`
- frontend `.env`

Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

Deploy functions (from `backend/`):
```bash
cd backend
firebase deploy --only functions
```

## 4. Billing + Free Quota Flow

### Daily free quota
- Callable: `checkDailyFreeQuota`
- Callable: `claimDailyFreePass`
- First 100 users/day (UTC) get `daily-free` access in `subscriptions/{uid}`

### Paid billing (Razorpay)
- Callable: `createBillingOrder` (creates order in Razorpay + stores `billingOrders/{orderId}`)
- Callable: `verifyBillingPayment` (signature verification + activates subscription)
- Webhook endpoint: `razorpayWebhook` (signature-validated event intake)

## 5. Prep Tracks

`/prep` provides:
- topic-wise filtered question track
- company-wise filtered revision track
- question availability indicator against your Firestore `problems` collection

If a track question is not in Firestore yet, it shows as "Add in Admin".

## 6. Deployment Choice (Firebase vs Vercel/Netlify)

Best choice for your current stack:
- Primary recommendation: Firebase Hosting + Firebase Functions (single platform, simple ops)
- Secondary: Vercel/Netlify for frontend hosting, Firebase for backend/data

### Why Firebase Hosting is best here
- native fit with Firestore/Auth/Functions
- simpler production auth domain setup
- one CLI workflow for rules/functions/hosting

### Why Vercel/Netlify is still good
- easier preview deployments
- excellent frontend CI/CD experience
- can still use Firebase backend perfectly

## 7. Deploy Config Included

- Firebase Hosting config in root `firebase.json` with SPA rewrites
- `vercel.json` in project root
- `netlify.toml` in project root

## 8. Build Commands

Frontend production build:
```bash
cd frontend
npm run build
```

Functions TypeScript build:
```bash
cd ../backend/functions
npm run build
```

## 9. Security Checklist

- Do not commit service account JSON files.
- Rotate any leaked keys immediately.
- Keep billing keys only in backend/functions `.env` (never frontend).
- Restrict Firestore writes for billing/subscription collections to server-side only.

## 10. Suggested Production Rollout

1. Deploy Firestore rules.
2. Deploy Functions.
3. Deploy frontend.
4. Add hosting domain in Firebase Auth Authorized Domains.
5. Run end-to-end test:
   - signup
   - claim daily free pass
   - paid checkout (test mode)
   - submit code
   - verify leaderboard/activity updates

