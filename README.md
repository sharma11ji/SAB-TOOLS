# SAB TOOLS

Smart Tools for Carpenters & Furniture Workers.

## Production stack
React + Vite + Firebase Auth + Firestore + PWA.

## Required Firebase setup
1. Enable Google provider.
2. Enable Email/Password provider.
3. Configure an authorized domain for the deployed site.
4. Add the Firebase web app values to a local `.env` using `.env.example`.
5. Deploy `firestore.rules`.
6. Deploy with Firebase Hosting after `npm run build`.

## Architecture
Calculations are pure local JavaScript modules and do not require Firebase. Firebase stores authenticated user data, projects, project calculations, measurements, cutting lists, estimates and global history.

Offline saves are queued locally with idempotent operation IDs and retried after reconnect. Firestore records use version/revision metadata so stale writes can be detected.

## Commands
```
npm install
npm run dev
npm run build
```

## Firebase collections
users/{uid}
users/{uid}/projects/{projectId}
users/{uid}/projects/{projectId}/measurements/{measurementId}
users/{uid}/projects/{projectId}/calculations/{calculationId}
users/{uid}/projects/{projectId}/cuttingLists/{cuttingListId}
users/{uid}/projects/{projectId}/estimates/{estimateId}
users/{uid}/history/{historyId}
users/{uid}/preferences/{preferenceId}
