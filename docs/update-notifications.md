# SAB TOOLS update notifications

This local build adds owner-only Android Chrome web push. It does not send any notification until setup is finished, the new app is deployed, and the owner enables notifications on the phone. Keep the existing white-screen recovery, offline shell and safe mid-session Update button.

## How it works

1. After the signed-in owner uses a tool and returns Home, an English "Update notifications" panel offers Enable notifications. No browser prompt happens on first load. The owner must tap Enable. Not now remembers dismissal. A Home settings control remains available. Denial leaves the app working and explains Chrome site settings. Turn off deletes this device's server subscription.
2. Firebase issues a device token using the existing sw.js registration and the project's public VAPID key. The token is stored in the owner's private Firestore subcollection, users/<owner UID>/pushSubscriptions/<random device ID>. Tokens are not logged or placed in source code. They are refreshed on later signed-in launches with permission and prior opt-in.
3. A separate GitHub Actions job runs after successful Pages deployment, verifies that the expected worker fingerprint is actually live, reads only that owner's subscriptions, and sends data-only FCM updates. Other users do not receive pushes from this sender.
4. The existing worker displays "New update available" / "Tap to open SAB TOOLS and update." No duplicate SDK notification payload is used. If this device already runs that release, it ignores the notice. In the foreground, the app checks for a worker update and uses the normal safe update flow.
5. Tap opens the ordinary app URL when closed, where launch auto-update applies. If an app window is already open, tap focuses it and checks for updates but does NOT navigate/reload an active form. Use its Update button and save-work confirmation.

## Setup, phone-friendly order

These are setup instructions, not changes already made. Use the same Firebase project as the app. Do not paste private keys or device tokens into WhatsApp/chat.

### A. Firebase web push public key

Open Firebase Console, select the app's project, then gear > Project settings > Cloud Messaging > Web configuration > Web Push certificates > Generate key pair (or use the existing pair). Copy the PUBLIC key displayed there. In the GitHub repository open Settings > Secrets and variables > Actions > New repository secret:

- Name: VITE_FIREBASE_VAPID_KEY
- Value: the public VAPID key

The public VAPID key is safe to embed in the app; never substitute the private key. Existing VITE_FIREBASE_* secrets and VITE_PUSH_OWNER_UID stay in use. Confirm VITE_PUSH_OWNER_UID is this user's Auth UID in Firebase Authentication > Users. For this setup, the user confirmed amrjkumar848502@gmail.com, verified Auth UID BTfrq1ucz8QEQFJ4OPP772yuoJt2. Set the NEW VITE_PUSH_OWNER_UID secret to that UID. Keep VITE_REGISTER_OWNER_UID unchanged; it controls receipt/register behavior for a different account. Enrollment requires signing into SAB TOOLS with amrjkumar848502@gmail.com, not a different remembered app account. Do not hardcode this UID in source.

In Google Cloud Console for this same project, APIs & Services > Library: verify Firebase Cloud Messaging API (HTTP v1) and FCM Registration API are enabled. New projects may already enable registration. No legacy FCM server key is used.

### B. Firestore subscription rules

Firebase Console > Firestore Database > Rules. Review the current rules first. Add the pushSubscriptions match from this branch's firestore.rules INSIDE the existing /users/{uid} match. Do not overwrite unrelated production rules blindly. Publish after review. The rule permits only that authenticated user's token registration/read/delete and requires a server timestamp. Admin sender access uses IAM, not these client rules. The default Firestore database must already exist (the app already uses Firestore).

### C. Dedicated sender credential

Google Cloud Console > IAM & Admin > Service Accounts > Create service account, e.g. sab-tools-update-sender. Grant:

- Firebase Cloud Messaging API Admin (roles/firebasecloudmessaging.admin), to send updates.
- Cloud Datastore User (roles/datastore.user), to read/delete subscriptions and record sentRelease in Firestore.

The latter role is database-wide IAM access, broader than this script's owner-only query. Keep the account dedicated and key tightly controlled; a future hardened setup can replace the key with GitHub OIDC federation. Do not use an Owner/Editor role or put any server credential in a VITE_ variable.

On that service account open Keys > Add key > Create new key > JSON. Download it privately. This JSON contains a persistent private key. Put its FULL contents directly into GitHub repository Actions secret FIREBASE_PUSH_SERVICE_ACCOUNT using the GitHub UI, or use a secure vault credential handoff for an authorized assistant. Never send it in chat, commit it, or attach it to this document. Delete the local download after secure setup. If exposed, revoke and replace the key in IAM immediately. An organization policy may block key creation; then use workload identity federation instead, which is not wired into this build.

The JSON's project_id must match VITE_FIREBASE_PROJECT_ID; the sender checks this before sending. Existing Firebase web apiKey is NOT a server send credential.

### D. Enable sender AFTER setup

GitHub repository > Settings > Secrets and variables > Actions > Variables > New repository variable:

- Name: ENABLE_UPDATE_PUSH
- Value: true

It is deliberately OFF/absent by default. Once enabled, the notify-update job follows the deploy job in .github/workflows/build.yml. No credentials are included in build artifacts, and the sender does not use npm/admin SDK dependencies. It gets the exact deployed sw.js artifact from the build job. A skipped/failed sender does not pretend notification delivery succeeded. It verifies live deployment before any FCM call. No notification on PR builds.

### E. First phone setup and end-to-end test

After an independently approved deployment, open the fixed app online once (an already-stranded old install may need one fresh entry). Sign in as the owner, use a tool, return Home, tap Enable notifications, then allow Android/Chrome's permission prompt. Confirm the panel says On for this device. Nothing pushes to a device before enrollment.

For the next approved version deployment, check Actions > Deploy SAB TOOLS > notify-update. The log reports FCM accepted count, not delivered count. Close the PWA normally, leave Chrome running normally, and confirm a phone notification appears. Tap it and check the new app version loads. Separately verify tapping while a form is open does not discard entries.

If the job needs retry, rerun the failed job for that deployment. sentRelease suppresses already-accepted tokens; a crash between send and marker write can duplicate a send, but the worker notification tag replaces the previous update notice. The script retries HTTP throttling/transient failures with bounded backoff, removes FCM UNREGISTERED tokens, and skips subscriptions not refreshed for 90 days. A later signed-in app launch refreshes the subscription. No release is sent before its worker is live.

## Limits and verified status

GitHub Pages is static; it cannot send push by itself. FCM plus the post-deploy Action is the sender. Phone delivery depends on internet, Chrome/Android notification settings, FCM, and battery restrictions. Closing the PWA normally can still allow push; Android force-stop, disabled Chrome, battery optimization, Do Not Disturb, or permission denial can delay/suppress it. No guaranteed immediate notice. Messages expire after 24 hours. Slow launch updates may still offer Update rather than auto-reload, protecting work.

Push fixes FUTURE notifications, not an old install that has never loaded this code. It also does not repair missing offline files without internet. The inline recovery protects missing-bundle startup; not every possible app/runtime/device failure is proven eliminated.

Locally verified: automated unit tests, builds with/without push config, production-bundle offline/update/migration/recovery browser tests, contextual settings UI at 320px, and a synthetic data PushEvent through the bundled FCM worker with the page closed. Synthetic push is NOT real FCM delivery. No Firebase Console, secrets, permission on the user's phone, real FCM send, or deployment was performed. Final phone enrollment and a real future deployment notification remain unverified.

## Official references

- https://firebase.google.com/docs/cloud-messaging/web/get-started
- https://firebase.google.com/docs/cloud-messaging/web/receive-messages
- https://firebase.google.com/docs/cloud-messaging/send/v1-api
- https://firebase.google.com/docs/cloud-messaging/manage-tokens
- https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission_static
- https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions

This repo pins Firebase 12.19.0 and uses its supported getToken(serviceWorkerRegistration, vapidKey) API. Current docs also describe newer FID APIs; do not silently mix those into this pinned token sender.
