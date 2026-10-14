# SAB TOOLS

Smart Tools for Carpenters & Furniture Workers.

A mobile-first PWA with wood calculators, timber receipts and a smart
cutting optimizer. Works offline and can be used without an account
(local mode); signing in syncs receipts and business records to the
user's own Firestore space.

## Features
- Wood calculators: plank (L x W x T), door/ply area, and round wood
  using the quarter-girth formula, each in Foot/Inch and Meter/cm.
- Timber receipts with CFT/CBM totals, rates, labour/transport and
  balance; save, share and print.
- Smart cutting optimizer with offcut stock reuse, workshop mode and
  printable plans.
- Business tools: saved receipts, baki hisab (udhaar ledger), customer
  list, sale report and a bubble level.
- PWA: installable, offline after first load, safe update prompt and
  automatic shell recovery.

## Stack
React + Vite front end. Firebase (Auth + Firestore) is optional: without
`VITE_FIREBASE_*` env values the app runs in local mode and keeps data on
the device. Calculations are pure local JavaScript and never need the
network.

## Commands
```
npm install
npm run dev     # local dev server
npm test        # node:test unit suite
npm run lint    # eslint
npm run build   # production build into dist/
```

## Verification scripts
```
node scripts/verifyPwa.mjs       # offline, update and SW recovery flows
node scripts/verifyCutting.mjs   # cutting optimizer end-to-end in a browser
```
Both serve `dist/` locally and drive a real browser via playwright-core
(`PLAYWRIGHT_MODULE` and `CHROME_BIN` env vars select the module and
browser binary).

## Firebase setup (optional, for sign-in + cloud sync)
1. Enable the Google and Email/Password providers in Firebase Auth.
2. Add the deployed domain to Auth authorized domains.
3. Put the web app values in `.env` (see `.env.example`).
4. Deploy `firestore.rules` (per-user data isolation).

## Deployment
GitHub Actions builds and deploys `dist/` to GitHub Pages on pushes to
`main` (see `.github/workflows/`). The site is served under the
`/SAB-TOOLS/` base path.
