# SAB TOOLS Google Form mirror

Destination: published form "sab tool resid".
https://docs.google.com/forms/d/e/1FAIpQLSc9xQyk-4_lkGYsMaZIBWA2l7pIST6w0aw6WdmthUcltINyOQ/viewform

Linked spreadsheet: "Sab tool Rasid register", tab "Form responses 1".
https://docs.google.com/spreadsheets/d/1WhPFCiMNQ6LXUml-FsvOeDqtxb7hay4j6f2BaL2bDhE/edit

No Apps Script, register key or GitHub webhook secret is used. The old Apps Script workflow is retired.

## Current layout

Timestamp, Receipt data (legacy), Date, Receipt no., Customer, Village, Item, CFT, Rate (INR/CFT), Total (INR), Paid (INR), Balance (INR), Labour (INR), Transport (INR).

The form now has twelve optional short-answer questions, with their published entry IDs mapped in `src/sheetMirror.js`. The original Receipt data question remains so older deployed clients keep working until the new code goes live. New code does not populate that legacy cell.

The existing response was copied into the matching columns while retaining its original cell. Item, Labour and Transport were not present in the old transmission and remain blank on that historical row. Blank is not zero. Do not guess missing values.

## Go-live and verification

1. Review the separate-column PR and obtain owner approval before merge/deploy.
2. Keep the form published and accepting anonymous responses. Do not require sign-in, verified email, one response per person or restrictive validation: the background request sends no Google cookies.
3. After approved deployment, each shop user opens Shared shop register setup and taps Enable automatic sharing on this device once. Existing enabled setups remain enabled because the endpoint is unchanged. Stop automatic sharing disables it for that account/browser.
4. Each successful cloud Save receipt or Save PDF/print sends the twelve fields. Local-only saves and drafts do not transmit.
5. With owner approval, save a labelled test receipt and compare all fields in the linked sheet. This change was validated with tests, build, published form IDs and sheet reads; no new end-to-end response was submitted during PR preparation.

## Limits

- Best-effort append-only mirroring, not a reliable accounting ledger. Primary receipts stay the main record. An opaque no-cors response is not a delivery acknowledgement.
- The public form may receive spam; responses are not proof of an app user's identity.
- Re-saving and printing can create duplicates. No dedupe, automatic retry or replay of missing sends. No PDF upload.
- CFT uses four decimals; money uses two decimals. Total includes Labour and Transport. Overpayment produces a negative Balance. Mixed historical rates display Mixed.
- Item contains distinct wood names from the receipt rows, separated by commas. Missing wood names stay blank. Tabs/newlines in names become spaces; URL encoding preserves Unicode and special characters.
- One-time device enable explicitly shares customer/payment data with this register. Past receipts are not automatically backfilled.

## Owner isolation

Set `VITE_REGISTER_OWNER_UID` from Firebase Authentication > Users after verifying
which account the shop owner actually uses in this app. Supply it as the matching
GitHub Actions secret. Empty configuration disables the legacy Form for everyone.
The Google account administering Firebase is not necessarily an app user.
Other users' old local sharing flags are ignored and cleared. Both the UI and
send helper require an exact UID match. The owner's existing form action,
question IDs, per-device consent key and append behavior are unchanged.
This is a client-side accidental-disclosure guard, not access control on the
public Google Form endpoint: old clients or direct external submissions cannot
be prevented by frontend code. Update cached clients after release.

## Personal private Sheets (new accounts)

The personal register uses Sheets API directly, not a Google Form. Forms API's
`linkedSheetId` is output-only and its update methods cannot link a response
spreadsheet. Each Google user taps Connect, consents to `drive.file`, and a
private Sheet with 13 columns (receipt ID + the existing 12 receipt fields) is
created in their Google account. Destination configuration is stored only in
`users/{uid}.personalSheet`. The existing owner Form stays unchanged.

Before release: enable Google Sheets API on the Firebase OAuth project, add
`drive.file` to its OAuth consent data access configuration, check public-user
availability, and test actual Google consent with a non-owner test account.
No new client secret or broad `spreadsheets` scope is needed. Use the same Firebase
Google OAuth client. Email/password-only users must use Google sign-in first.

This is client-only sync while the app is open with a current Google token, NOT
permanent background sync. After reload or token expiry, reconnect Google to send
pending receipts. Access tokens live in memory only. For unattended sync without
reconnect, a separately approved backend with secured refresh-token storage is
required. Firebase session persistence does not refresh Google API access.

Receipts successfully saved to cloud are queued under the signed-in user's
`preferences/sheet-row-{receiptId}`. Firestore transactions allocate a stable row
number and version. Re-save and retry overwrite that same row via values.update
with RAW input, not append; formula-looking customer text stays text. Retry is
not automatically retried after an ambiguous timeout; delivery stays locked until replacement recovery. Do not reorder, insert or delete register
rows: allocated row positions are part of this version's sync contract. Editing
receipt fields in the Sheet does not change cloud receipts and is overwritten on
re-save. Stop disables future sync across devices; requests already in flight
cannot be recalled. Pending rows stay until reconnect. Existing past receipts are
not backfilled automatically. Cloud receipts remain the primary record.

A durable Firestore provisioning lock prevents simultaneous first-time setup
across devices. The lock is never automatically expired: a timed-out Google
create could have succeeded. Partial provisioning shows a recovery-needed error
and the real Sheet URL if known, rather than creating another Sheet. Recovery
requires inspecting the Google account and user profile before clearing the lock
or completing its destination configuration. Existing pending receipts are not
lost. A missing/deleted or inaccessible Sheet never falls back to the owner Form.

Official references:
- https://developers.google.com/workspace/forms/api/reference/rest/v1/forms
- https://developers.google.com/workspace/forms/api/reference/rest/v1/forms/batchUpdate
- https://developers.google.com/workspace/sheets/api/scopes
- https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets/create
- https://firebase.google.com/docs/auth/web/google-signin
- https://developers.google.com/identity/oauth2/web/guides/use-token-model

## Safe-stop delivery and replacement recovery

A durable Firestore `sheetDelivery` lock pins each sender to one spreadsheet ID.
It has no timeout and is not cleared by reconnect. After each confirmed row PUT,
the sender rereads pending versions so a concurrent update is sent next rather
than allowing two devices to write overlapping versions. Explicit 401/403
responses release the lock and retain pending rows. Network failures, 5xx errors,
or missing acknowledgement keep the lock: a late Google write cannot be ruled
out. Cloud saving continues while Sheet delivery is paused.

Never add a force-unlock or timer expiry. A client cannot prove an abandoned
request has finished. The recovery UI instead requires review and confirmation
to create a NEW private register, preserve the previous register and its lock in
a `retired-sheet-*` preferences record, and copy latest cloud receipts. The new
spreadsheet ID fences old requests to the retired register. After replacement,
use only the new register. During recovery `sheetRecovery` prevents senders and
another replacement. Interrupted provisioning/copying stays paused for support;
ordinary reconnect must not create another replacement or clear recovery state.

The delivery engine and actual module adapters have deterministic tests for
concurrent devices, newer pending versions, ambiguous responses, definite auth
rejections, replacement fencing, and failed cleanup. These tests use a simulated
Firestore transaction adapter, not a live Firebase emulator. The original live
Google happy-path test predates this hardening. Real hardened recovery and
expired/revoked access still need a test-only preview run before release.
